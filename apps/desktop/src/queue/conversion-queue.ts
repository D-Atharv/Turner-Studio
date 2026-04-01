import { EventEmitter } from 'node:events';
import fsSync from 'node:fs';
import path from 'node:path';
import type { ConvertJob, ConvertOptions } from '@turner/contracts';
import type { MediaEngineRunner } from '@turner/media-engine';
import type { Logger } from '@turner/observability';
import { resolveOutputPath } from '@turner/domain';
import { createAppError, err, ok, type Result } from '@turner/shared';
import { prepareJobsForEnqueue } from './enqueue-preparation';
import { cleanupOriginalOnSuccess, emitStatus, resolveEtaSeconds } from './queue-helpers';
import type { ActiveTask, ConversionQueueEvents } from './queue-types';

export class ConversionQueue {
  private readonly events = new EventEmitter();
  private readonly jobs = new Map<string, ConvertJob>();
  private readonly pendingJobIds: string[] = [];
  private readonly optionsByJobId = new Map<string, ConvertOptions>();
  private readonly lastEtaByJobId = new Map<string, number>();
  private activeTask: ActiveTask | undefined;

  constructor(
    private readonly mediaEngine: MediaEngineRunner,
    private readonly logger: Logger
  ) {}

  onProgress(listener: ConversionQueueEvents['progress']): () => void {
    this.events.on('progress', listener);
    return () => this.events.off('progress', listener);
  }

  onStatusChanged(listener: ConversionQueueEvents['statusChanged']): () => void {
    this.events.on('statusChanged', listener);
    return () => this.events.off('statusChanged', listener);
  }

  async enqueue(inputPaths: string[], baseOptions: Partial<ConvertOptions>): Promise<Result<string[]>> {
    const prepared = await prepareJobsForEnqueue({ inputPaths, baseOptions });
    if (!prepared.ok) {
      return prepared;
    }

    const jobIds: string[] = [];
    for (const job of prepared.value.jobs) {
      this.jobs.set(job.jobId, job);
      this.optionsByJobId.set(job.jobId, prepared.value.options);
      this.pendingJobIds.push(job.jobId);
      jobIds.push(job.jobId);
      emitStatus(this.events, job, 'waiting');
    }

    void this.pump();

    return ok(jobIds);
  }

  cancel(jobId: string): Result<void> {
    const pendingIndex = this.pendingJobIds.findIndex((candidate) => candidate === jobId);

    if (pendingIndex >= 0) {
      this.pendingJobIds.splice(pendingIndex, 1);
      const existingJob = this.jobs.get(jobId);
      if (existingJob) {
        existingJob.status = 'cancelled';
        existingJob.endedAt = Date.now();
        this.lastEtaByJobId.delete(existingJob.jobId);
        emitStatus(this.events, existingJob, 'cancelled');
      }

      return ok(undefined);
    }

    if (this.activeTask?.jobId === jobId) {
      this.activeTask.task.cancel();
      return ok(undefined);
    }

    return err(createAppError('VALIDATION_ERROR', 'Job does not exist or has already finished', { details: { jobId } }));
  }

  setOutputName(jobId: string, outputName: string): Result<void> {
    const job = this.jobs.get(jobId);
    if (!job) return err(createAppError('VALIDATION_ERROR', 'Job not found', { details: { jobId } }));
    if (job.status !== 'waiting') {
      return err(createAppError('VALIDATION_ERROR', 'Only waiting jobs can be renamed'));
    }

    const resolved = resolveOutputPath({
      inputPath: job.inputPath,
      outputDir: path.dirname(job.outputPath),
      outputFileBaseName: outputName,
      exists: fsSync.existsSync
    });
    if (!resolved.ok) return resolved;

    job.outputPath = resolved.value;
    emitStatus(this.events, job, 'waiting', job.outputPath);
    return ok(undefined);
  }

  shutdown(): void {
    if (this.activeTask) {
      this.activeTask.task.cancel();
    }

    for (const pendingJobId of this.pendingJobIds.splice(0, this.pendingJobIds.length)) {
      const pendingJob = this.jobs.get(pendingJobId);
      if (!pendingJob) {
        continue;
      }

      pendingJob.status = 'cancelled';
      pendingJob.endedAt = Date.now();
      this.lastEtaByJobId.delete(pendingJob.jobId);
      emitStatus(this.events, pendingJob, 'cancelled');
    }
  }

  private async pump(): Promise<void> {
    if (this.activeTask || this.pendingJobIds.length === 0) {
      return;
    }

    const nextJobId = this.pendingJobIds.shift();
    if (!nextJobId) {
      return;
    }

    const job = this.jobs.get(nextJobId);
    const options = this.optionsByJobId.get(nextJobId);

    if (!job || !options) {
      await this.pump();
      return;
    }

    job.status = 'converting';
    job.startedAt = Date.now();
    emitStatus(this.events, job, 'converting');

    const startResult = this.mediaEngine.start({
      inputPath: job.inputPath,
      outputPath: job.outputPath,
      options,
      onProgress: (progress) => {
        const bounded = Math.max(0, Math.min(100, progress.percent));
        job.progressPercent = bounded;
        const etaSeconds = resolveEtaSeconds({
          startedAt: job.startedAt,
          progressPercent: bounded,
          parsedEtaSeconds: progress.etaSeconds,
          previousEtaSeconds: this.lastEtaByJobId.get(job.jobId)
        });

        if (typeof etaSeconds === 'number') {
          this.lastEtaByJobId.set(job.jobId, etaSeconds);
        }

        this.events.emit('progress', {
          jobId: job.jobId,
          percent: bounded,
          fps: progress.fps,
          speedMultiplier: progress.speedMultiplier,
          etaSeconds
        });
      }
    });

    if (!startResult.ok) {
      job.status = 'failed';
      job.error = startResult.error;
      job.endedAt = Date.now();
      this.lastEtaByJobId.delete(job.jobId);
      emitStatus(this.events, job, 'failed', undefined, startResult.error);
      await this.pump();
      return;
    }

    this.activeTask = { jobId: job.jobId, task: startResult.value };

    const doneResult = await startResult.value.done;

    if (doneResult.ok) {
      job.status = 'done';
      job.progressPercent = 100;
      job.endedAt = Date.now();
      this.lastEtaByJobId.delete(job.jobId);
      emitStatus(this.events, job, 'done', job.outputPath);
      await cleanupOriginalOnSuccess(job, options, this.logger);
    } else {
      job.status = doneResult.error.code === 'CANCELLED' ? 'cancelled' : 'failed';
      job.error = doneResult.error;
      job.endedAt = Date.now();
      this.lastEtaByJobId.delete(job.jobId);
      emitStatus(this.events, job, job.status, undefined, doneResult.error);
    }

    this.activeTask = undefined;
    await this.pump();
  }
}

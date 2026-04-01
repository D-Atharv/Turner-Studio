import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import type { EventEmitter } from 'node:events';
import type { ConvertJob, ConvertOptions } from '@turner/contracts';
import type { Logger } from '@turner/observability';
import { createAppError, err, ok, type AppError, type Result } from '@turner/shared';

export const validateInputFile = async (inputPath: string): Promise<Result<void>> => {
  try {
    await fs.access(inputPath, fsSync.constants.R_OK);
    const stat = await fs.stat(inputPath);

    if (!stat.isFile()) {
      return err(createAppError('VALIDATION_ERROR', 'Input path is not a file', { details: { inputPath } }));
    }

    if (stat.size <= 0) {
      return err(createAppError('VALIDATION_ERROR', 'Input file is empty', { details: { inputPath } }));
    }

    return ok(undefined);
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;

    if (nodeError.code === 'ENOENT') {
      return err(createAppError('IO_ERROR', 'Input file was not found', { details: { inputPath } }));
    }

    if (nodeError.code === 'EACCES' || nodeError.code === 'EPERM') {
      return err(createAppError('PERMISSION_ERROR', 'Permission denied while accessing input file', { details: { inputPath } }));
    }

    return err(createAppError('IO_ERROR', 'Unable to access input file', { cause: error }));
  }
};

const estimateEtaFromElapsed = (startedAt: number, progressPercent: number): number | undefined => {
  const ratio = progressPercent / 100;
  if (!Number.isFinite(ratio) || ratio < 0.03 || ratio >= 1) {
    return undefined;
  }

  const elapsedSeconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
  const etaSeconds = Math.round((elapsedSeconds * (1 - ratio)) / ratio);
  return Math.max(0, etaSeconds);
};

export const resolveEtaSeconds = ({
  startedAt,
  progressPercent,
  parsedEtaSeconds,
  previousEtaSeconds
}: {
  startedAt: number | undefined;
  progressPercent: number;
  parsedEtaSeconds: number | undefined;
  previousEtaSeconds: number | undefined;
}): number | undefined => {
  const fromParser =
    typeof parsedEtaSeconds === 'number' && Number.isFinite(parsedEtaSeconds)
      ? Math.max(0, Math.round(parsedEtaSeconds))
      : undefined;

  const fromElapsed = typeof startedAt === 'number' ? estimateEtaFromElapsed(startedAt, progressPercent) : undefined;
  const candidate = fromParser ?? fromElapsed;
  if (candidate === undefined) {
    return previousEtaSeconds;
  }

  if (previousEtaSeconds === undefined) {
    return candidate;
  }

  return Math.max(0, Math.round(previousEtaSeconds * 0.65 + candidate * 0.35));
};

export const emitStatus = (
  events: EventEmitter,
  job: ConvertJob,
  status: ConvertJob['status'],
  outputPath?: string,
  error?: AppError
): void => {
  events.emit('statusChanged', {
    jobId: job.jobId,
    inputPath: job.inputPath,
    status,
    outputPath,
    error
  });
};

export const cleanupOriginalOnSuccess = async (
  job: ConvertJob,
  options: ConvertOptions,
  logger: Logger
): Promise<void> => {
  if (options.keepOriginal) {
    return;
  }

  try {
    await fs.unlink(job.inputPath);
  } catch (error) {
    logger.warn('Unable to delete original file after successful conversion', {
      inputPath: job.inputPath,
      cause: error
    });
  }
};

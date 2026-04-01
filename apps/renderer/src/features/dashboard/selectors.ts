import type { UiJob } from '@/state/types';
import { deriveLiveEtaSeconds } from './eta';

const FALLBACK_SECONDS_PER_JOB = 45;

export type SessionStats = {
  total: number;
  queued: number;
  converting: number;
  successful: number;
  failed: number;
  estimatedSeconds: number;
};

const averageSecondsPerJob = (jobs: UiJob[]): number => {
  const completedDurations = jobs
    .filter(
      (job): job is UiJob & { startedAt: number; endedAt: number } =>
        job.status === 'done' && typeof job.startedAt === 'number' && typeof job.endedAt === 'number'
    )
    .map((job) => Math.max(1, Math.round((job.endedAt - job.startedAt) / 1000)));

  if (completedDurations.length === 0) {
    return FALLBACK_SECONDS_PER_JOB;
  }

  const total = completedDurations.reduce((sum, seconds) => sum + seconds, 0);
  return Math.max(1, Math.round(total / completedDurations.length));
};

export const getActiveJob = (jobs: UiJob[]): UiJob | undefined => {
  return jobs.find((job) => job.status === 'converting') ?? jobs.find((job) => job.status === 'waiting');
};

export const getRecentProcessed = (jobs: UiJob[]): UiJob[] => {
  return jobs.filter((job) => job.status === 'done').slice(0, 8);
};

export const getSessionStats = (jobs: UiJob[]): SessionStats => {
  const queued = jobs.filter((job) => job.status === 'waiting').length;
  const converting = jobs.filter((job) => job.status === 'converting').length;
  const successful = jobs.filter((job) => job.status === 'done').length;
  const failed = jobs.filter((job) => job.status === 'failed').length;

  const pendingCount = queued + converting;
  const avgSeconds = averageSecondsPerJob(jobs);
  const activeJob = getActiveJob(jobs);
  const activeEtaSeconds = activeJob
    ? deriveLiveEtaSeconds(activeJob) ??
      (activeJob.status === 'waiting'
        ? avgSeconds
        : Math.round(Math.max(0, (100 - activeJob.progressPercent) / 100) * avgSeconds))
    : 0;
  const remainingAfterActive = Math.max(0, pendingCount - (activeJob ? 1 : 0));

  return {
    total: jobs.length,
    queued,
    converting,
    successful,
    failed,
    estimatedSeconds: Math.round(activeEtaSeconds + remainingAfterActive * avgSeconds)
  };
};

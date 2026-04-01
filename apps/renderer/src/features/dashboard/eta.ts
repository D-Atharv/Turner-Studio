import type { UiJob } from '@/state/types';

const MIN_PROGRESS_RATIO_FOR_ETA = 0.03;

export const deriveLiveEtaSeconds = (job: UiJob, nowMs: number = Date.now()): number | undefined => {
  if (job.status !== 'converting') {
    if (job.status === 'done') {
      return 0;
    }

    return undefined;
  }

  if (typeof job.etaSeconds === 'number' && Number.isFinite(job.etaSeconds)) {
    return Math.max(0, Math.round(job.etaSeconds));
  }

  if (typeof job.startedAt !== 'number') {
    return undefined;
  }

  const ratio = job.progressPercent / 100;
  if (!Number.isFinite(ratio) || ratio < MIN_PROGRESS_RATIO_FOR_ETA || ratio >= 1) {
    return undefined;
  }

  const elapsedSeconds = Math.max(1, Math.round((nowMs - job.startedAt) / 1000));
  const etaSeconds = Math.round((elapsedSeconds * (1 - ratio)) / ratio);

  return Math.max(0, etaSeconds);
};


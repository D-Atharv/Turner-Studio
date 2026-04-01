import { randomUUID } from 'node:crypto';
import type { ConvertJob } from '@turner/contracts';

export const createWaitingJob = (
  inputPath: string,
  outputPath: string,
  now: number = Date.now()
): ConvertJob => ({
  jobId: randomUUID(),
  inputPath,
  outputPath,
  status: 'waiting',
  progressPercent: 0,
  createdAt: now
});

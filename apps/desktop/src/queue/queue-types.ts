import type { ConvertJob } from '@turner/contracts';
import type { MediaEngineTask } from '@turner/media-engine';
import type { AppError } from '@turner/shared';

export type ConversionQueueEvents = {
  progress: (event: {
    jobId: string;
    percent: number;
    fps?: number;
    speedMultiplier?: number;
    etaSeconds?: number;
  }) => void;
  statusChanged: (event: {
    jobId: string;
    inputPath: string;
    status: ConvertJob['status'];
    outputPath?: string;
    error?: AppError;
  }) => void;
};

export type ActiveTask = {
  jobId: string;
  task: MediaEngineTask;
};

import type { ConvertOptions } from '@turner/contracts';
import type { Result } from '@turner/shared';

export type MediaEngineProgress = {
  percent: number;
  fps?: number | undefined;
  speedMultiplier?: number | undefined;
  etaSeconds?: number | undefined;
};

export type MediaEngineStartParams = {
  inputPath: string;
  outputPath: string;
  options: ConvertOptions;
  onProgress: (event: MediaEngineProgress) => void;
};

export type MediaEngineTask = {
  cancel: () => void;
  done: Promise<Result<void>>;
};

export type MediaEngineRunner = {
  start: (params: MediaEngineStartParams) => Result<MediaEngineTask>;
};

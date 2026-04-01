import type { AppError } from '@turner/shared';

export const PRESET_VALUES = ['ultrafast', 'veryfast', 'fast', 'medium', 'slow'] as const;
export type Preset = (typeof PRESET_VALUES)[number];

export type ConvertOptions = {
  outputDir?: string | undefined;
  crf: number;
  preset: Preset;
  audioBitrate: string;
  keepOriginal: boolean;
  timeoutMs: number;
};

export type ConvertRequest = {
  inputPaths: string[];
  options?: Partial<ConvertOptions>;
};

export type AppSettings = {
  schemaVersion: number;
  outputDir?: string | undefined;
  crf: number;
  preset: Preset;
  audioBitrate: string;
  keepOriginal: boolean;
  notifyOnCompletion: boolean;
  timeoutMs: number;
};

export type AppSettingsPatch = {
  outputDir?: string | undefined;
  crf?: number | undefined;
  preset?: Preset | undefined;
  audioBitrate?: string | undefined;
  keepOriginal?: boolean | undefined;
  notifyOnCompletion?: boolean | undefined;
  timeoutMs?: number | undefined;
};

export type JobStatus = 'waiting' | 'converting' | 'done' | 'failed' | 'cancelled';

export type ConvertJob = {
  jobId: string;
  inputPath: string;
  outputPath: string;
  status: JobStatus;
  progressPercent: number;
  createdAt: number;
  startedAt?: number | undefined;
  endedAt?: number | undefined;
  error?: AppError | undefined;
};

export type ConvertProgressEvent = {
  jobId: string;
  percent: number;
  fps?: number | undefined;
  speedMultiplier?: number | undefined;
  etaSeconds?: number | undefined;
};

export type ConvertStatusChangedEvent = {
  jobId: string;
  inputPath: string;
  status: JobStatus;
  outputPath?: string | undefined;
  error?: AppError | undefined;
};

export type Unsubscribe = () => void;

export type TurnerApi = {
  converter: {
    enqueue: (request: ConvertRequest) => Promise<string[]>;
    cancel: (jobId: string) => Promise<void>;
    setOutputName: (jobId: string, outputName: string) => Promise<void>;
    onProgress: (listener: (event: ConvertProgressEvent) => void) => Unsubscribe;
    onStatusChanged: (listener: (event: ConvertStatusChangedEvent) => void) => Unsubscribe;
  };
  settings: {
    get: () => Promise<AppSettings>;
    update: (patch: AppSettingsPatch) => Promise<AppSettings>;
  };
  shell: {
    openFile: (targetPath: string) => Promise<void>;
    showInFolder: (targetPath: string) => Promise<void>;
    renameFile: (targetPath: string, nextName: string) => Promise<string>;
    pickWebmFiles: () => Promise<string[]>;
    pickOutputFolder: () => Promise<string | null>;
    getFileSize: (filePath: string) => Promise<number | null>;
  };
};

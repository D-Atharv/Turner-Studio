import type { AppError, AppSettings, AppSettingsPatch, ConvertStatusChangedEvent, Preset } from '@turner/contracts';

export type UiJob = {
  jobId: string;
  inputPath: string;
  outputPath?: string | undefined;
  /** User-supplied output base name (without extension). Shown in queue before conversion starts. */
  preferredOutputName?: string | undefined;
  status: 'waiting' | 'converting' | 'done' | 'failed' | 'cancelled';
  progressPercent: number;
  fps?: number | undefined;
  speedMultiplier?: number | undefined;
  etaSeconds?: number | undefined;
  startedAt?: number | undefined;
  endedAt?: number | undefined;
  error?: AppError | undefined;
  fileSizeBytes?: number | undefined;
};

export type AppState = {
  settings: AppSettings;
  loadingSettings: boolean;
  isSettingsOpen: boolean;
  isEnqueueing: boolean;
  jobsById: Record<string, UiJob>;
  jobOrder: string[];
  appError: string | undefined;
};

export type Action =
  | { type: 'settingsLoaded'; payload: AppSettings }
  | { type: 'settingsUpdated'; payload: AppSettings }
  | { type: 'setSettingsOpen'; payload: boolean }
  | { type: 'setEnqueueing'; payload: boolean }
  | { type: 'setAppError'; payload: string | undefined }
  | { type: 'jobsQueued'; payload: Array<{ jobId: string; inputPath: string }> }
  | {
      type: 'progress';
      payload: {
        jobId: string;
        percent: number;
        fps?: number | undefined;
        speedMultiplier?: number | undefined;
        etaSeconds?: number | undefined;
      };
    }
  | {
      type: 'statusChanged';
      payload: ConvertStatusChangedEvent;
    }
  | { type: 'outputRenamed'; payload: { previousPath: string; nextPath: string } }
  | { type: 'setPreferredOutputName'; payload: { jobId: string; name: string } }
  | { type: 'jobFileSizeLoaded'; payload: { jobId: string; sizeBytes: number } };

export const DEFAULT_SETTINGS: AppSettings = {
  schemaVersion: 1,
  crf: 23,
  preset: 'medium' as Preset,
  audioBitrate: '128k',
  keepOriginal: true,
  notifyOnCompletion: true,
  timeoutMs: 30 * 60 * 1000
};

export const INITIAL_STATE: AppState = {
  settings: DEFAULT_SETTINGS,
  loadingSettings: true,
  isSettingsOpen: false,
  isEnqueueing: false,
  jobsById: {},
  jobOrder: [],
  appError: undefined
};

export const toSettingsPatch = (settings: AppSettings): AppSettingsPatch => ({
  outputDir: settings.outputDir,
  crf: settings.crf,
  preset: settings.preset,
  audioBitrate: settings.audioBitrate,
  keepOriginal: settings.keepOriginal,
  notifyOnCompletion: settings.notifyOnCompletion,
  timeoutMs: settings.timeoutMs
});

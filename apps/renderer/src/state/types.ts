import type { AppError, AppSettings, AppSettingsPatch, ConvertStatusChangedEvent, Preset } from '@turner/contracts';
import { DEFAULT_PROFILE_ID, type ConversionProfileId } from '@turner/shared';

// ── Toast ─────────────────────────────────────────────────────────────────────

export type ToastVariant = 'error' | 'success' | 'info';

export type AppToast = {
  id: string;
  variant: ToastVariant;
  message: string;
};

// ── Job ───────────────────────────────────────────────────────────────────────

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
  toasts: AppToast[];
  selectedProfileId: ConversionProfileId;
};

export type Action =
  | { type: 'settingsLoaded'; payload: AppSettings }
  | { type: 'settingsUpdated'; payload: AppSettings }
  | { type: 'setSettingsOpen'; payload: boolean }
  | { type: 'setEnqueueing'; payload: boolean }
  // setAppError is kept for backward-compat — it pushes an error toast
  | { type: 'setAppError'; payload: string | undefined }
  | { type: 'pushToast'; payload: AppToast }
  | { type: 'dismissToast'; payload: string }
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
  | { type: 'jobFileSizeLoaded'; payload: { jobId: string; sizeBytes: number } }
  | { type: 'setConversionProfile'; payload: ConversionProfileId };

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
  toasts: [],
  selectedProfileId: DEFAULT_PROFILE_ID
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

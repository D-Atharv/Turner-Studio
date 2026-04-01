import type { Action, AppState, AppToast, UiJob } from './types';

const TERMINAL_STATUSES = new Set<UiJob['status']>(['done', 'failed', 'cancelled']);

const upsertJob = (state: AppState, update: UiJob): AppState => {
  const exists = Boolean(state.jobsById[update.jobId]);

  return {
    ...state,
    jobsById: {
      ...state.jobsById,
      [update.jobId]: update
    },
    jobOrder: exists ? state.jobOrder : [update.jobId, ...state.jobOrder]
  };
};

export const reducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'settingsLoaded':
      return {
        ...state,
        settings: action.payload,
        loadingSettings: false
      };

    case 'settingsUpdated':
      return {
        ...state,
        settings: action.payload
      };

    case 'setSettingsOpen':
      return {
        ...state,
        isSettingsOpen: action.payload
      };

    case 'setEnqueueing':
      return {
        ...state,
        isEnqueueing: action.payload
      };

    case 'setAppError': {
      // Undefined payload (legacy "clear error" call) is a no-op in the queue model
      if (!action.payload) return state;
      const errToast: AppToast = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        variant: 'error',
        message: action.payload
      };
      return { ...state, toasts: [...state.toasts, errToast] };
    }

    case 'pushToast':
      return { ...state, toasts: [...state.toasts, action.payload] };

    case 'dismissToast':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.payload) };

    case 'jobsQueued': {
      return action.payload.reduce((nextState, queued) => {
        return upsertJob(nextState, {
          jobId: queued.jobId,
          inputPath: queued.inputPath,
          status: 'waiting',
          progressPercent: 0
        });
      }, state);
    }

    case 'progress': {
      const existing = state.jobsById[action.payload.jobId];
      if (!existing) {
        return state;
      }

      const boundedPercent = Math.max(0, Math.min(100, action.payload.percent));
      const now = Date.now();
      const nextStatus = existing.status === 'waiting' ? 'converting' : existing.status;

      return upsertJob(state, {
        ...existing,
        progressPercent: boundedPercent,
        status: nextStatus,
        fps: action.payload.fps ?? existing.fps,
        speedMultiplier: action.payload.speedMultiplier ?? existing.speedMultiplier,
        etaSeconds: action.payload.etaSeconds ?? existing.etaSeconds,
        startedAt: existing.startedAt ?? (nextStatus === 'converting' ? now : undefined),
        endedAt: nextStatus === 'converting' ? undefined : existing.endedAt
      });
    }

    case 'statusChanged': {
      const existing = state.jobsById[action.payload.jobId];
      const now = Date.now();
      const isTerminal = TERMINAL_STATUSES.has(action.payload.status);
      const startedAt =
        action.payload.status === 'converting'
          ? existing?.startedAt ?? now
          : existing?.startedAt;

      const nextJob: UiJob = {
        jobId: action.payload.jobId,
        inputPath: action.payload.inputPath || existing?.inputPath || 'Unknown input',
        outputPath: action.payload.outputPath ?? existing?.outputPath,
        status: action.payload.status,
        progressPercent:
          action.payload.status === 'done'
            ? 100
            : action.payload.status === 'waiting'
              ? 0
            : action.payload.status === 'cancelled'
              ? existing?.progressPercent ?? 0
              : existing?.progressPercent ?? 0,
        fps: isTerminal ? undefined : existing?.fps,
        etaSeconds:
          action.payload.status === 'done'
            ? 0
            : action.payload.status === 'converting'
              ? existing?.etaSeconds
              : undefined,
        startedAt,
        endedAt: isTerminal ? now : undefined,
        error: action.payload.error
      };

      if (isTerminal || action.payload.status === 'waiting') {
        nextJob.speedMultiplier = undefined;
      }

      return upsertJob(state, nextJob);
    }

    case 'outputRenamed': {
      const nextJobsById = Object.fromEntries(
        Object.entries(state.jobsById).map(([jobId, job]) => [
          jobId,
          job.outputPath === action.payload.previousPath
            ? { ...job, outputPath: action.payload.nextPath }
            : job
        ])
      );

      return {
        ...state,
        jobsById: nextJobsById
      };
    }

    case 'setPreferredOutputName': {
      const existing = state.jobsById[action.payload.jobId];
      if (!existing || existing.status !== 'waiting') return state;
      return {
        ...state,
        jobsById: {
          ...state.jobsById,
          [action.payload.jobId]: { ...existing, preferredOutputName: action.payload.name.trim() || undefined }
        }
      };
    }

    case 'jobFileSizeLoaded': {
      const existing = state.jobsById[action.payload.jobId];
      if (!existing) return state;
      return {
        ...state,
        jobsById: {
          ...state.jobsById,
          [action.payload.jobId]: { ...existing, fileSizeBytes: action.payload.sizeBytes }
        }
      };
    }

    case 'setConversionProfile':
      return { ...state, selectedProfileId: action.payload };

    default:
      return state;
  }
};

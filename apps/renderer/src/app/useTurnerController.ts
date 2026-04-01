import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { AppSettings } from '@turner/contracts';
import { getInputExtensions } from '@turner/shared';
import { getActiveJob, getRecentProcessed, getSessionStats } from '@/features/dashboard/selectors';
import { fileNameFromPath } from '@/features/jobs/file-paths';
import { reducer } from '@/state/store';
import { INITIAL_STATE, toSettingsPatch, type AppToast, type UiJob } from '@/state/types';
import type { SidebarItemId, SidebarView } from '@/features/shell/navigation';
import { parseIpcError } from './bridge-error';
import { useTurnerBridge } from './useTurnerBridge';

const makeToastId = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const makeToast = (variant: AppToast['variant'], message: string): AppToast => ({
  id: makeToastId(),
  variant,
  message
});

export const useTurnerController = () => {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [activeView, setActiveView] = useState<SidebarView>('converter');
  const turnerApi = window.turner;

  useTurnerBridge(turnerApi, dispatch);

  const jobs = useMemo(
    () => state.jobOrder.map((jobId) => state.jobsById[jobId]).filter((job): job is UiJob => Boolean(job)),
    [state.jobOrder, state.jobsById]
  );

  const sessionStats    = useMemo(() => getSessionStats(jobs), [jobs]);
  const activeJob       = useMemo(() => getActiveJob(jobs), [jobs]);
  const recentProcessed = useMemo(() => getRecentProcessed(jobs), [jobs]);
  const completedJobs   = useMemo(
    () => jobs.filter((job) => job.status === 'done' || job.status === 'failed' || job.status === 'cancelled'),
    [jobs]
  );
  const isBusy = state.isEnqueueing || sessionStats.converting > 0;

  useEffect(() => {
    document.body.classList.toggle('turner-busy', isBusy);
    return () => { document.body.classList.remove('turner-busy'); };
  }, [isBusy]);

  // ── Desktop notifications + success toasts on job completion ─────────────
  // Track job IDs that have already triggered a notification so we only
  // fire once per completed job, even if the component re-renders.
  const notifiedJobIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    const doneJobs = Object.values(state.jobsById).filter(
      (job) => job.status === 'done' && !notifiedJobIds.current.has(job.jobId)
    );

    if (doneJobs.length === 0) return;

    doneJobs.forEach((job) => {
      notifiedJobIds.current.add(job.jobId);

      // In-app success toast
      const outputName = fileNameFromPath(job.outputPath ?? job.inputPath);
      dispatch({
        type: 'pushToast',
        payload: makeToast('success', `Conversion complete — ${outputName}`)
      });

      // Desktop OS notification (Electron renderer supports Web Notification API)
      if (state.settings.notifyOnCompletion && typeof Notification !== 'undefined') {
        const title = 'Conversion Complete';
        const body  = `${outputName} is ready.`;

        if (Notification.permission === 'granted') {
          new Notification(title, { body, silent: false });
        } else if (Notification.permission !== 'denied') {
          void Notification.requestPermission().then((permission) => {
            if (permission === 'granted') {
              new Notification(title, { body, silent: false });
            }
          });
        }
      }
    });
  }, [state.jobsById, state.settings.notifyOnCompletion]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const requireApi = () => {
    if (turnerApi) return turnerApi;
    dispatch({ type: 'setAppError', payload: 'Desktop bridge is unavailable.' });
    return null;
  };

  const enqueue = async (paths: string[]) => {
    const api = requireApi();
    if (!api) return;

    dispatch({ type: 'setEnqueueing', payload: true });

    let jobIds: string[] = [];
    try {
      jobIds = await api.converter.enqueue({
        inputPaths: paths,
        options: { profileId: state.selectedProfileId }
      });
      dispatch({
        type: 'jobsQueued',
        payload: jobIds.map((jobId, index) => ({
          jobId,
          inputPath: paths[index] ?? 'Unknown input path'
        }))
      });
    } catch (error) {
      dispatch({ type: 'setAppError', payload: parseIpcError(error) });
    } finally {
      dispatch({ type: 'setEnqueueing', payload: false });
    }

    // Fetch file sizes in background
    if (typeof api.shell.getFileSize === 'function') {
      jobIds.forEach((jobId, index) => {
        const filePath = paths[index];
        if (!filePath) return;
        void api.shell.getFileSize(filePath)
          .then((sizeBytes) => {
            if (sizeBytes !== null) {
              dispatch({ type: 'jobFileSizeLoaded', payload: { jobId, sizeBytes } });
            }
          })
          .catch(() => { /* size unavailable — ignore */ });
      });
    }
  };

  const browseAndEnqueue = async () => {
    const api = requireApi();
    if (!api) return;

    try {
      const inputExtensions = getInputExtensions(state.selectedProfileId);
      const pickedPaths     = await api.shell.pickWebmFiles(inputExtensions);

      if (pickedPaths.length === 0) return;

      const extSet   = new Set(inputExtensions.map((e) => e.toLowerCase()));
      const accepted = pickedPaths.filter((p) =>
        extSet.has(p.toLowerCase().slice(p.lastIndexOf('.')))
      );
      const rejected = pickedPaths.length - accepted.length;

      if (accepted.length > 0) await enqueue(accepted);

      if (rejected > 0) {
        dispatch({
          type: 'setAppError',
          payload: `${rejected} file(s) ignored — current profile only accepts ${inputExtensions.join(', ')} files.`
        });
      }
    } catch (error) {
      dispatch({ type: 'setAppError', payload: parseIpcError(error) });
    }
  };

  const runBridgeAction = async (action: () => Promise<void>) => {
    try {
      await action();
    } catch (error) {
      dispatch({ type: 'setAppError', payload: parseIpcError(error) });
    }
  };

  const renameOutputFile = async (outputPath: string, nextName: string) => {
    const api = requireApi();
    if (!api) return;

    const trimmedName = nextName.trim();
    if (!trimmedName) return;

    try {
      const renamedPath = await api.shell.renameFile(outputPath, trimmedName);
      dispatch({ type: 'outputRenamed', payload: { previousPath: outputPath, nextPath: renamedPath } });
      dispatch({ type: 'pushToast', payload: makeToast('success', `Renamed to ${fileNameFromPath(renamedPath)}`) });
    } catch (error) {
      dispatch({ type: 'setAppError', payload: parseIpcError(error) });
    }
  };

  const setPreferredOutputName = async (jobId: string, outputName: string) => {
    const api = requireApi();
    if (!api) return;

    try {
      await api.converter.setOutputName(jobId, outputName);
      dispatch({ type: 'setPreferredOutputName', payload: { jobId, name: outputName } });
    } catch (error) {
      dispatch({ type: 'setAppError', payload: parseIpcError(error) });
    }
  };

  const updateSettings = async (nextSettings: AppSettings) => {
    const api = requireApi();
    if (!api) return;
    const patched = await api.settings.update(toSettingsPatch(nextSettings));
    dispatch({ type: 'settingsUpdated', payload: patched });
  };

  return {
    state,
    activeView,
    jobs,
    sessionStats,
    activeJob,
    recentProcessed,
    completedJobs,
    isBusy,
    enqueue,
    browseAndEnqueue,
    updateSettings,
    handleSidebarNavigate: (target: SidebarItemId) => setActiveView(target),
    setSettingsOpen:       (open: boolean) => dispatch({ type: 'setSettingsOpen', payload: open }),
    selectedProfileId:     state.selectedProfileId,
    setConversionProfile:  (profileId: import('@turner/shared').ConversionProfileId) =>
      dispatch({ type: 'setConversionProfile', payload: profileId }),
    // Kept for onDropError compatibility
    setAppError:    (message: string | undefined) => dispatch({ type: 'setAppError', payload: message }),
    dismissToast:   (id: string) => dispatch({ type: 'dismissToast', payload: id }),
    cancelJob:      (jobId: string) => runBridgeAction(() => turnerApi!.converter.cancel(jobId)),
    openFile:       (outputPath: string) => runBridgeAction(() => turnerApi!.shell.openFile(outputPath)),
    showInFolder:   (outputPath: string) => runBridgeAction(() => turnerApi!.shell.showInFolder(outputPath)),
    renameOutputFile,
    setPreferredOutputName,
    pickOutputFolder: async (): Promise<string | null> => {
      const api = requireApi();
      if (!api) return null;

      try {
        return await api.shell.pickOutputFolder();
      } catch (error) {
        dispatch({ type: 'setAppError', payload: parseIpcError(error) });
        return null;
      }
    }
  };
};

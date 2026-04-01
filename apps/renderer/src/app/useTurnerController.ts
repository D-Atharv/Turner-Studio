import { useEffect, useMemo, useReducer, useState } from 'react';
import type { AppSettings } from '@turner/contracts';
import { FILE_EXTENSIONS } from '@turner/shared';
import { getActiveJob, getRecentProcessed, getSessionStats } from '@/features/dashboard/selectors';
import { reducer } from '@/state/store';
import { INITIAL_STATE, toSettingsPatch, type UiJob } from '@/state/types';
import type { SidebarItemId, SidebarView } from '@/features/shell/navigation';
import { parseIpcError } from './bridge-error';
import { useTurnerBridge } from './useTurnerBridge';

export const useTurnerController = () => {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [activeView, setActiveView] = useState<SidebarView>('converter');
  const turnerApi = window.turner;

  useTurnerBridge(turnerApi, dispatch);

  const jobs = useMemo(
    () => state.jobOrder.map((jobId) => state.jobsById[jobId]).filter((job): job is UiJob => Boolean(job)),
    [state.jobOrder, state.jobsById]
  );

  const sessionStats = useMemo(() => getSessionStats(jobs), [jobs]);
  const activeJob = useMemo(() => getActiveJob(jobs), [jobs]);
  const recentProcessed = useMemo(() => getRecentProcessed(jobs), [jobs]);
  const completedJobs = useMemo(
    () => jobs.filter((job) => job.status === 'done' || job.status === 'failed' || job.status === 'cancelled'),
    [jobs]
  );
  const isBusy = state.isEnqueueing || sessionStats.converting > 0;

  useEffect(() => {
    document.body.classList.toggle('turner-busy', isBusy);
    return () => { document.body.classList.remove('turner-busy'); };
  }, [isBusy]);

  const requireApi = () => {
    if (turnerApi) return turnerApi;
    dispatch({ type: 'setAppError', payload: 'Desktop bridge is unavailable.' });
    return null;
  };

  const enqueue = async (paths: string[]) => {
    const api = requireApi();
    if (!api) return;

    dispatch({ type: 'setEnqueueing', payload: true });
    dispatch({ type: 'setAppError', payload: undefined });

    let jobIds: string[] = [];
    try {
      jobIds = await api.converter.enqueue({ inputPaths: paths });
      dispatch({
        type: 'jobsQueued',
        payload: jobIds.map((jobId, index) => ({ jobId, inputPath: paths[index] ?? 'Unknown input path' }))
      });
    } catch (error) {
      dispatch({ type: 'setAppError', payload: parseIpcError(error) });
    } finally {
      dispatch({ type: 'setEnqueueing', payload: false });
    }

    // Fetch file sizes in the background — guarded in case preload hasn't been rebuilt
    if (typeof api.shell.getFileSize === 'function') {
      jobIds.forEach((jobId, index) => {
        const filePath = paths[index];
        if (!filePath) return;
        void api.shell.getFileSize(filePath).then((sizeBytes) => {
          if (sizeBytes !== null) {
            dispatch({ type: 'jobFileSizeLoaded', payload: { jobId, sizeBytes } });
          }
        }).catch(() => { /* size unavailable — ignore */ });
      });
    }
  };

  const browseAndEnqueue = async () => {
    const api = requireApi();
    if (!api) return;

    try {
      const pickedPaths = await api.shell.pickWebmFiles();
      if (pickedPaths.length === 0) {
        return;
      }

      const accepted = pickedPaths.filter((filePath) => filePath.toLowerCase().endsWith(FILE_EXTENSIONS.WEBM));
      const rejected = pickedPaths.length - accepted.length;

      if (accepted.length > 0) {
        await enqueue(accepted);
      }

      if (rejected > 0) {
        dispatch({
          type: 'setAppError',
          payload: `${rejected} file(s) were ignored because only .webm files are supported.`
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

  const renameOutputFile = async (outputPath: string) => {
    const api = requireApi();
    if (!api) return;

    const suggested = outputPath.split(/[\\/]/).pop()?.replace(/\.mp4$/i, '') ?? '';
    const nextName = window.prompt('Enter new output file name', suggested)?.trim();
    if (!nextName) {
      return;
    }

    try {
      const renamedPath = await api.shell.renameFile(outputPath, nextName);
      dispatch({ type: 'outputRenamed', payload: { previousPath: outputPath, nextPath: renamedPath } });
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

  const handleSidebarNavigate = (target: SidebarItemId) => {
    setActiveView(target);
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
    handleSidebarNavigate,
    setSettingsOpen: (open: boolean) => dispatch({ type: 'setSettingsOpen', payload: open }),
    setAppError: (message: string | undefined) => dispatch({ type: 'setAppError', payload: message }),
    cancelJob: (jobId: string) => runBridgeAction(() => turnerApi!.converter.cancel(jobId)),
    openFile: (outputPath: string) => runBridgeAction(() => turnerApi!.shell.openFile(outputPath)),
    showInFolder: (outputPath: string) => runBridgeAction(() => turnerApi!.shell.showInFolder(outputPath)),
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

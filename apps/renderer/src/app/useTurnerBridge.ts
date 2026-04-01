import { useEffect } from 'react';
import type { TurnerApi } from '@turner/contracts';
import { INITIAL_STATE, type Action } from '@/state/types';
import { parseIpcError } from './bridge-error';

type Dispatch = (action: Action) => void;

export const useTurnerBridge = (turnerApi: TurnerApi | undefined, dispatch: Dispatch) => {
  useEffect(() => {
    if (!turnerApi) {
      dispatch({
        type: 'setAppError',
        payload: 'Desktop bridge is unavailable. Launch this UI inside the Turner Electron app (or restart dev mode).'
      });
      dispatch({ type: 'settingsLoaded', payload: INITIAL_STATE.settings });
      return;
    }

    let disposed = false;
    const boot = async () => {
      try {
        const settings = await turnerApi.settings.get();
        if (!disposed) dispatch({ type: 'settingsLoaded', payload: settings });
      } catch (error) {
        if (!disposed) dispatch({ type: 'setAppError', payload: parseIpcError(error) });
      }
    };
    void boot();

    const offProgress = turnerApi.converter.onProgress((event) => {
      dispatch({
        type: 'progress',
        payload: {
          jobId: event.jobId,
          percent: event.percent,
          fps: event.fps,
          speedMultiplier: event.speedMultiplier,
          etaSeconds: event.etaSeconds
        }
      });
    });

    const offStatus = turnerApi.converter.onStatusChanged((event) => {
      dispatch({ type: 'statusChanged', payload: event });
    });

    return () => {
      disposed = true;
      offProgress();
      offStatus();
    };
  }, [turnerApi, dispatch]);
};

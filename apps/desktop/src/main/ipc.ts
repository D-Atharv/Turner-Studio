import { ipcMain, type BrowserWindow } from 'electron';
import {
  IPC_COMMANDS,
  IPC_EVENTS,
  appSettingsPatchSchema,
  convertRequestSchema,
  jobIdSchema,
  outputNameSchema,
  type AppSettingsPatch
} from '@turner/contracts';
import type { JsonSettingsRepository } from '@turner/persistence';
import type { Logger } from '@turner/observability';
import { createAppError } from '@turner/shared';
import type { ConversionQueue } from '../queue/conversion-queue.js';
import { showConversionStatusNotification } from '../adapters/notifications.js';
import { mergeSettingsWithOverrides } from './ipc-settings.js';
import { registerShellHandlers } from './ipc-shell-handlers.js';

const toIpcError = (error: { message: string; code?: string; details?: unknown }): Error => {
  const serializableMessage = JSON.stringify(error);
  return new Error(serializableMessage);
};

export const registerIpcHandlers = ({
  window,
  queue,
  settingsRepository,
  logger
}: {
  window: BrowserWindow;
  queue: ConversionQueue;
  settingsRepository: JsonSettingsRepository;
  logger: Logger;
}): void => {
  let notifyOnCompletion = true;

  void settingsRepository.get().then((result) => {
    if (result.ok) {
      notifyOnCompletion = result.value.notifyOnCompletion;
      return;
    }

    logger.warn('Could not load notification preference from settings', {
      error: result.error
    });
  });

  queue.onProgress((event) => {
    window.webContents.send(IPC_EVENTS.CONVERTER_PROGRESS, event);
  });

  queue.onStatusChanged((event) => {
    window.webContents.send(IPC_EVENTS.CONVERTER_STATUS_CHANGED, event);

    if (notifyOnCompletion && (event.status === 'done' || event.status === 'failed')) {
      showConversionStatusNotification(event, logger);
    }
  });

  ipcMain.handle(IPC_COMMANDS.SETTINGS_GET, async () => {
    const result = await settingsRepository.get();
    if (!result.ok) {
      throw toIpcError(result.error);
    }

    return result.value;
  });

  ipcMain.handle(IPC_COMMANDS.SETTINGS_UPDATE, async (_event, patch: AppSettingsPatch) => {
    const parsedPatch = appSettingsPatchSchema.safeParse(patch);

    if (!parsedPatch.success) {
      throw toIpcError(
        createAppError('VALIDATION_ERROR', 'Invalid settings update payload', {
          details: parsedPatch.error.flatten()
        })
      );
    }

    const result = await settingsRepository.update(parsedPatch.data);
    if (!result.ok) {
      throw toIpcError(result.error);
    }

    notifyOnCompletion = result.value.notifyOnCompletion;

    return result.value;
  });

  ipcMain.handle(IPC_COMMANDS.CONVERTER_ENQUEUE, async (_event, request: unknown) => {
    const parsedRequest = convertRequestSchema.safeParse(request);

    if (!parsedRequest.success) {
      throw toIpcError(
        createAppError('VALIDATION_ERROR', 'Invalid conversion request', {
          details: parsedRequest.error.flatten()
        })
      );
    }

    const settingsResult = await settingsRepository.get();
    if (!settingsResult.ok) {
      throw toIpcError(settingsResult.error);
    }

    const options = mergeSettingsWithOverrides(settingsResult.value, parsedRequest.data.options);
    const queueResult = await queue.enqueue(parsedRequest.data.inputPaths, options);

    if (!queueResult.ok) {
      throw toIpcError(queueResult.error);
    }

    logger.info('Queued conversion jobs', {
      count: queueResult.value.length,
      ids: queueResult.value
    });

    return queueResult.value;
  });

  ipcMain.handle(IPC_COMMANDS.CONVERTER_CANCEL, async (_event, jobId: string) => {
    const parsed = jobIdSchema.safeParse(jobId);

    if (!parsed.success) {
      throw toIpcError(createAppError('VALIDATION_ERROR', 'Invalid job id'));
    }

    const cancelled = queue.cancel(parsed.data);
    if (!cancelled.ok) {
      throw toIpcError(cancelled.error);
    }
  });

  ipcMain.handle(
    IPC_COMMANDS.CONVERTER_SET_OUTPUT_NAME,
    async (_event, payload: { jobId: string; outputName: string }) => {
      const parsedJob = jobIdSchema.safeParse(payload?.jobId);
      const parsedName = outputNameSchema.safeParse(payload?.outputName);
      if (!parsedJob.success || !parsedName.success) {
        throw toIpcError(createAppError('VALIDATION_ERROR', 'Invalid rename payload'));
      }

      const renamed = queue.setOutputName(parsedJob.data, parsedName.data);
      if (!renamed.ok) throw toIpcError(renamed.error);
    }
  );

  registerShellHandlers(window, toIpcError);
};

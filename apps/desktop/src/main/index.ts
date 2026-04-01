import path from 'node:path';
import { app, BrowserWindow } from 'electron';
import { FfmpegMediaEngine } from '@turner/media-engine';
import { createLogger } from '@turner/observability';
import { JsonSettingsRepository } from '@turner/persistence';
import { createMainWindow } from './window.js';
import { registerIpcHandlers } from './ipc.js';
import { ConversionQueue } from '../queue/conversion-queue.js';

// Must be set before app.whenReady() for notifications and window titles to work correctly.
app.setName('Turner Studio');

// Windows: required for taskbar notifications and jump lists.
if (process.platform === 'win32') {
  app.setAppUserModelId('com.turner.studio');
}

const logger = createLogger();

const bootstrap = async (): Promise<void> => {
  const window = await createMainWindow();

  const settingsPath = path.join(app.getPath('userData'), 'settings.json');
  const settingsRepository = new JsonSettingsRepository(settingsPath);
  const conversionQueue = new ConversionQueue(new FfmpegMediaEngine(), logger);

  registerIpcHandlers({
    window,
    queue: conversionQueue,
    settingsRepository,
    logger
  });

  app.on('before-quit', () => {
    conversionQueue.shutdown();
    void settingsRepository.flush();
  });

  window.on('closed', () => {
    conversionQueue.shutdown();
  });
};

void app.whenReady().then(async () => {
  await bootstrap();

  app.on('activate', () => {
    if (app.isReady() && BrowserWindow.getAllWindows().length === 0) {
      void bootstrap();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

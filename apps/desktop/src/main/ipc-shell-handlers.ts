import { dialog, ipcMain, type BrowserWindow } from 'electron';
import { IPC_COMMANDS } from '@turner/contracts';
import { createAppError } from '@turner/shared';
import { openFile, renameFile, showInFolder } from '../adapters/shell.js';

type ToIpcError = (error: { message: string; code?: string; details?: unknown }) => Error;

export const registerShellHandlers = (window: BrowserWindow, toIpcError: ToIpcError): void => {
  ipcMain.handle(IPC_COMMANDS.SHELL_OPEN_FILE, async (_event, targetPath: string) => {
    const result = await openFile(targetPath);
    if (!result.ok) throw toIpcError(result.error);
  });

  ipcMain.handle(IPC_COMMANDS.SHELL_SHOW_IN_FOLDER, async (_event, targetPath: string) => {
    const result = await showInFolder(targetPath);
    if (!result.ok) throw toIpcError(result.error);
  });

  ipcMain.handle(
    IPC_COMMANDS.SHELL_RENAME_FILE,
    async (_event, payload: { targetPath: string; nextName: string }) => {
      const result = await renameFile(payload.targetPath, payload.nextName);
      if (!result.ok) throw toIpcError(result.error);
      return result.value;
    }
  );

  ipcMain.handle(IPC_COMMANDS.SHELL_PICK_WEBM_FILES, async (_event, extensions: string[]) => {
    // Strip leading dots — Electron's dialog filter expects bare extensions ('mp4' not '.mp4')
    const bare = (Array.isArray(extensions) ? extensions : [])
      .map((e) => e.replace(/^\./, ''))
      .filter(Boolean);

    const filters = bare.length > 0
      ? [
          { name: 'Video Files', extensions: bare },
          { name: 'All Files',   extensions: ['*'] }
        ]
      : [{ name: 'All Files', extensions: ['*'] }];

    const picked = await dialog.showOpenDialog(window, {
      properties: ['openFile', 'multiSelections'],
      filters
    });

    return picked.canceled ? [] : picked.filePaths;
  });

  ipcMain.handle(IPC_COMMANDS.SHELL_GET_FILE_SIZE, async (_event, filePath: string) => {
    try {
      const stat = await import('node:fs/promises').then((m) => m.stat(filePath));
      return stat.size;
    } catch {
      return null;
    }
  });

  ipcMain.handle(IPC_COMMANDS.SHELL_PICK_OUTPUT_FOLDER, async () => {
    const picked = await dialog.showOpenDialog(window, {
      properties: ['openDirectory', 'createDirectory']
    });

    if (picked.canceled || picked.filePaths.length === 0) return null;
    return picked.filePaths[0];
  });
};

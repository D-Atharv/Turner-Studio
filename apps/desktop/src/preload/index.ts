import { contextBridge, ipcRenderer } from 'electron';
import {
  type AppSettings,
  type AppSettingsPatch,
  type ConvertProgressEvent,
  type ConvertRequest,
  type ConvertStatusChangedEvent,
  type TurnerApi
} from '@turner/contracts';

const IPC_COMMANDS = {
  CONVERTER_ENQUEUE: 'converter.enqueue',
  CONVERTER_CANCEL: 'converter.cancel',
  CONVERTER_SET_OUTPUT_NAME: 'converter.setOutputName',
  SETTINGS_GET: 'settings.get',
  SETTINGS_UPDATE: 'settings.update',
  SHELL_OPEN_FILE: 'shell.openFile',
  SHELL_SHOW_IN_FOLDER: 'shell.showInFolder',
  SHELL_RENAME_FILE: 'shell.renameFile',
  SHELL_PICK_WEBM_FILES: 'shell.pickWebmFiles',
  SHELL_PICK_OUTPUT_FOLDER: 'shell.pickOutputFolder',
  SHELL_GET_FILE_SIZE: 'shell.getFileSize'
} as const;

const IPC_EVENTS = {
  CONVERTER_PROGRESS: 'converter.progress',
  CONVERTER_STATUS_CHANGED: 'converter.statusChanged'
} as const;

const api: TurnerApi = {
  converter: {
    enqueue: (request: ConvertRequest): Promise<string[]> => {
      return ipcRenderer.invoke(IPC_COMMANDS.CONVERTER_ENQUEUE, request);
    },
    cancel: (jobId: string): Promise<void> => {
      return ipcRenderer.invoke(IPC_COMMANDS.CONVERTER_CANCEL, jobId);
    },
    setOutputName: (jobId: string, outputName: string): Promise<void> => {
      return ipcRenderer.invoke(IPC_COMMANDS.CONVERTER_SET_OUTPUT_NAME, { jobId, outputName });
    },
    onProgress: (listener) => {
      const wrapped = (_event: Electron.IpcRendererEvent, data: ConvertProgressEvent) => listener(data);
      ipcRenderer.on(IPC_EVENTS.CONVERTER_PROGRESS, wrapped);
      return () => ipcRenderer.removeListener(IPC_EVENTS.CONVERTER_PROGRESS, wrapped);
    },
    onStatusChanged: (listener) => {
      const wrapped = (_event: Electron.IpcRendererEvent, data: ConvertStatusChangedEvent) => listener(data);
      ipcRenderer.on(IPC_EVENTS.CONVERTER_STATUS_CHANGED, wrapped);
      return () => ipcRenderer.removeListener(IPC_EVENTS.CONVERTER_STATUS_CHANGED, wrapped);
    }
  },
  settings: {
    get: (): Promise<AppSettings> => ipcRenderer.invoke(IPC_COMMANDS.SETTINGS_GET),
    update: (patch: AppSettingsPatch): Promise<AppSettings> => ipcRenderer.invoke(IPC_COMMANDS.SETTINGS_UPDATE, patch)
  },
  shell: {
    openFile: (targetPath: string): Promise<void> => ipcRenderer.invoke(IPC_COMMANDS.SHELL_OPEN_FILE, targetPath),
    showInFolder: (targetPath: string): Promise<void> =>
      ipcRenderer.invoke(IPC_COMMANDS.SHELL_SHOW_IN_FOLDER, targetPath),
    renameFile: (targetPath: string, nextName: string): Promise<string> =>
      ipcRenderer.invoke(IPC_COMMANDS.SHELL_RENAME_FILE, { targetPath, nextName }),
    pickWebmFiles: (extensions: readonly string[]): Promise<string[]> =>
      ipcRenderer.invoke(IPC_COMMANDS.SHELL_PICK_WEBM_FILES, extensions),
    pickOutputFolder: (): Promise<string | null> => ipcRenderer.invoke(IPC_COMMANDS.SHELL_PICK_OUTPUT_FOLDER),
    getFileSize: (filePath: string): Promise<number | null> =>
      ipcRenderer.invoke(IPC_COMMANDS.SHELL_GET_FILE_SIZE, filePath)
  }
};

contextBridge.exposeInMainWorld('turner', api);

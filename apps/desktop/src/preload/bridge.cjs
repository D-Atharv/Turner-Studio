const { contextBridge, ipcRenderer } = require('electron');

const IPC_COMMANDS = {
  CONVERTER_ENQUEUE: 'converter.enqueue',
  CONVERTER_CANCEL: 'converter.cancel',
  SETTINGS_GET: 'settings.get',
  SETTINGS_UPDATE: 'settings.update',
  SHELL_OPEN_FILE: 'shell.openFile',
  SHELL_SHOW_IN_FOLDER: 'shell.showInFolder',
  SHELL_PICK_WEBM_FILES: 'shell.pickWebmFiles',
  SHELL_PICK_OUTPUT_FOLDER: 'shell.pickOutputFolder'
};

const IPC_EVENTS = {
  CONVERTER_PROGRESS: 'converter.progress',
  CONVERTER_STATUS_CHANGED: 'converter.statusChanged'
};

const api = {
  converter: {
    enqueue: (request) => ipcRenderer.invoke(IPC_COMMANDS.CONVERTER_ENQUEUE, request),
    cancel: (jobId) => ipcRenderer.invoke(IPC_COMMANDS.CONVERTER_CANCEL, jobId),
    onProgress: (listener) => {
      const wrapped = (_event, data) => listener(data);
      ipcRenderer.on(IPC_EVENTS.CONVERTER_PROGRESS, wrapped);
      return () => ipcRenderer.removeListener(IPC_EVENTS.CONVERTER_PROGRESS, wrapped);
    },
    onStatusChanged: (listener) => {
      const wrapped = (_event, data) => listener(data);
      ipcRenderer.on(IPC_EVENTS.CONVERTER_STATUS_CHANGED, wrapped);
      return () => ipcRenderer.removeListener(IPC_EVENTS.CONVERTER_STATUS_CHANGED, wrapped);
    }
  },
  settings: {
    get: () => ipcRenderer.invoke(IPC_COMMANDS.SETTINGS_GET),
    update: (patch) => ipcRenderer.invoke(IPC_COMMANDS.SETTINGS_UPDATE, patch)
  },
  shell: {
    openFile: (targetPath) => ipcRenderer.invoke(IPC_COMMANDS.SHELL_OPEN_FILE, targetPath),
    showInFolder: (targetPath) => ipcRenderer.invoke(IPC_COMMANDS.SHELL_SHOW_IN_FOLDER, targetPath),
    pickWebmFiles: () => ipcRenderer.invoke(IPC_COMMANDS.SHELL_PICK_WEBM_FILES),
    pickOutputFolder: () => ipcRenderer.invoke(IPC_COMMANDS.SHELL_PICK_OUTPUT_FOLDER)
  }
};

contextBridge.exposeInMainWorld('turner', api);

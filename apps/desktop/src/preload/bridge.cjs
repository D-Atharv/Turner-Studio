const { contextBridge, ipcRenderer } = require('electron');

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
};

const IPC_EVENTS = {
  CONVERTER_PROGRESS: 'converter.progress',
  CONVERTER_STATUS_CHANGED: 'converter.statusChanged'
};

const api = {
  converter: {
    enqueue: (request) => ipcRenderer.invoke(IPC_COMMANDS.CONVERTER_ENQUEUE, request),
    cancel: (jobId) => ipcRenderer.invoke(IPC_COMMANDS.CONVERTER_CANCEL, jobId),
    setOutputName: (jobId, outputName) => ipcRenderer.invoke(IPC_COMMANDS.CONVERTER_SET_OUTPUT_NAME, { jobId, outputName }),
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
    renameFile: (targetPath, nextName) => ipcRenderer.invoke(IPC_COMMANDS.SHELL_RENAME_FILE, { targetPath, nextName }),
    pickWebmFiles: (extensions) => ipcRenderer.invoke(IPC_COMMANDS.SHELL_PICK_WEBM_FILES, extensions),
    pickOutputFolder: () => ipcRenderer.invoke(IPC_COMMANDS.SHELL_PICK_OUTPUT_FOLDER),
    getFileSize: (filePath) => ipcRenderer.invoke(IPC_COMMANDS.SHELL_GET_FILE_SIZE, filePath)
  }
};

contextBridge.exposeInMainWorld('turner', api);

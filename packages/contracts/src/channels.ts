export const IPC_COMMANDS = {
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

export const IPC_EVENTS = {
  CONVERTER_PROGRESS: 'converter.progress',
  CONVERTER_STATUS_CHANGED: 'converter.statusChanged'
} as const;

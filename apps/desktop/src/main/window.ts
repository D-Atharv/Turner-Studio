import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BrowserWindow } from 'electron';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createMainWindow = async (): Promise<BrowserWindow> => {
  const preloadPath = path.resolve(__dirname, '../preload/bridge.cjs');

  const window = new BrowserWindow({
    width: 1200,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    autoHideMenuBar: true,
    backgroundColor: '#0f1220',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      sandbox: false,
      nodeIntegration: false
    }
  });

  const rendererUrl = process.env.TURNER_RENDERER_URL;

  if (rendererUrl) {
    await window.loadURL(rendererUrl);
  } else {
    const rendererIndexPath = path.resolve(__dirname, '../../../renderer/dist/index.html');
    await window.loadFile(rendererIndexPath);
  }

  return window;
};

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { app, BrowserWindow } from 'electron';

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
    // Development: load from Vite dev server
    await window.loadURL(rendererUrl);
  } else if (app.isPackaged) {
    // Production (packaged .app / .exe):
    // electron-builder copies apps/renderer/dist/ → <Resources>/renderer/
    // process.resourcesPath is guaranteed by Electron at runtime.
    const rendererIndexPath = path.join(process.resourcesPath, 'renderer', 'index.html');
    await window.loadFile(rendererIndexPath);
  } else {
    // Production build, but not yet packaged (e.g. local `npm run build` test)
    const rendererIndexPath = path.resolve(__dirname, '../../../renderer/dist/index.html');
    await window.loadFile(rendererIndexPath);
  }

  return window;
};

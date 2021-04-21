/* eslint global-require: off, no-console: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build-main`, this file is compiled to
 * `./src/main.prod.js` using webpack. This gives us some performance wins.
 */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import path from 'path';
import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import Activity from './types/activity';
import Segment from './types/segment';
import User from './types/user';

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;
let backgroundWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged ? path.join(process.resourcesPath, 'assets') : path.join(__dirname, '../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  // MainWindow
  mainWindow = new BrowserWindow({
    show: false,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      nodeIntegration: true,
    },
  });
  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadURL(`file://${__dirname}/index.html`);
  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.maximize();
      mainWindow.show();
      mainWindow.focus();
    }
  });
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  mainWindow.webContents.on('new-window', (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });

  // BackgroundWindow
  backgroundWindow = new BrowserWindow({
    show: true,
    width: 1024,
    height: 728,
    webPreferences: {
      nodeIntegration: true,
    },
  });
  backgroundWindow.setMenuBarVisibility(false);
  backgroundWindow.loadURL(`file://${__dirname}/backgroundProcess.html`);
  backgroundWindow.webContents.on('did-finish-load', () => {
    if (!backgroundWindow) {
      throw new Error('"backgroundWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      backgroundWindow.minimize();
    } else {
      backgroundWindow.maximize();
      backgroundWindow.show();
      backgroundWindow.focus();
    }
  });
  backgroundWindow.on('closed', () => {
    backgroundWindow = null;
  });
  backgroundWindow.webContents.on('new-window', (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */
app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.whenReady().then(createWindow).catch(console.log);

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow();
  if (backgroundWindow === null) createWindow();
});

/**
 * IPC
 */
ipcMain.handle(
  'prompt-user-to-select-activity-to-upload',
  async (): Promise<string | undefined> => {
    if (mainWindow === null) {
      return undefined;
    }

    const dialogResult = await dialog.showOpenDialog(mainWindow, {
      title: 'Upload Activity',
      properties: ['openFile'],
      filters: [{ name: 'Activity Files', extensions: ['fit'] }],
    });

    if (dialogResult.canceled) {
      return undefined;
    }
    return dialogResult.filePaths[0];
  }
);

ipcMain.on('get-activity-from-file', (_event, args: { filePath: string; user: User }): void => {
  backgroundWindow?.webContents.send('get-activity-from-file', args);
});

ipcMain.on('get-activity-from-file-result', (_event, activity: Activity): void => {
  mainWindow?.webContents.send('get-activity-from-file-result', activity);
});

ipcMain.on('find-segments-on-activity', (_event, activity: Activity): void => {
  backgroundWindow?.webContents.send('find-segments-on-activity', activity);
});

ipcMain.on('find-segments-on-activity-completed', () => {
  mainWindow?.webContents.send('find-segments-on-activity-completed');
});

ipcMain.on('segment-created', (_event, segment: Segment): void => {
  backgroundWindow?.webContents.send('segment-created', segment);
});

ipcMain.on('segment-processing-completed', (): void => {
  mainWindow?.webContents.send('segment-processing-completed');
});

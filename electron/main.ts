import { app, BrowserWindow, nativeImage, Tray } from 'electron'
import path from 'node:path'
import { enableIPC } from './ipc'
import { enablePreviewProtocol } from './previewProtocol'

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │
const DIST = path.join(__dirname, '../dist')
const VITE_PUBLIC = app.isPackaged ? DIST : path.join(DIST, '../public')


let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(VITE_PUBLIC, 'icon.png'),
    frame: false,
    show: false,
    transparent: true,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#2f3241',
      symbolColor: '#74b1be',
      height: 45
    },
    center: true,
    autoHideMenuBar: true,
    backgroundMaterial: "mica",
    vibrancy: "sidebar",
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      sandbox: false,
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (import.meta.env.DEV) {
    win.loadURL(import.meta.env.VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(DIST, 'index.html'))
  }

  enableIPC()
  enablePreviewProtocol()

}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

let tray: Tray | null;

function createTray() {
  let icon = nativeImage.createFromPath(path.join(VITE_PUBLIC, 'icon.png'));
  icon = icon.resize({ width: 16 });
  icon.setTemplateImage(true);
  tray = new Tray(icon);
  tray.setToolTip('File Manager');
  tray.on('click', () => {
    win?.show();
  });
}

app.whenReady().then(() => {
  createWindow()
  createTray()
})

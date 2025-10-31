const { app, BrowserWindow } = require('electron');
const path = require('path');
const { startServer } = require('./backend/server');

let mainWindow;
let serverInstance;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'frontend', 'login.html'));

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(async () => {
  try {
    serverInstance = await startServer();
    console.log('Servidor backend iniciado');
    createWindow();
  } catch (error) {
    console.error('Error al iniciar servidor:', error);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (serverInstance) {
    serverInstance.close();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

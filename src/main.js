const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const { startServer } = require('./backend/server');

let mainWindow;
let serverInstance;
let appConfig;

function loadConfig() {
  const configPath = path.join(__dirname, '../config/config.json');
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, '../assets/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      cache: false, // Deshabilitar caché
      additionalArguments: [`--app-port=${appConfig.servidor_app.puerto}`]
    }
  });

  // LIMPIAR CACHÉ antes de cargar
  mainWindow.webContents.session.clearCache();

  mainWindow.loadFile(path.join(__dirname, 'frontend', 'login.html'));

  // Agregar tecla F5 para recargar
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F5') {
      mainWindow.webContents.reloadIgnoringCache();
    }
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(async () => {
  try {
    appConfig = loadConfig();
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

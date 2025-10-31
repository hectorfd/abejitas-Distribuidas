const { contextBridge } = require('electron');

const portArg = process.argv.find(arg => arg.startsWith('--app-port='));
const appPort = portArg ? parseInt(portArg.split('=')[1]) : 3002;

contextBridge.exposeInMainWorld('api', {
  getPort: () => {
    return appPort;
  }
});

const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getPort: () => {
    return process.env.PORT || 3000;
  }
});

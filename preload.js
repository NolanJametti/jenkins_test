const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onCallSpike: (callback) => ipcRenderer.on('call-spike', callback)
});

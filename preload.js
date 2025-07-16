const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onCallSpike: (callback) => ipcRenderer.on('call-spike', callback),
  onComeHere: (callback) => ipcRenderer.on('come-here', callback),
  onDismissSpike: (callback) => ipcRenderer.on('dismiss-spike', callback)
});

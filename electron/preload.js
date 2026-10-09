const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('api', {
  save: (o) => ipcRenderer.invoke('save', o),
  open: (o) => ipcRenderer.invoke('open', o),
  pickVideo: () => ipcRenderer.invoke('pickVideo'),
  print: () => ipcRenderer.invoke('print'),
  pdf: (n) => ipcRenderer.invoke('pdf', n)
});

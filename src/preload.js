const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('financeApi', {
  load: () => ipcRenderer.invoke('data:load'),
  save: (data) => ipcRenderer.invoke('data:save', data),
  startBlank: () => ipcRenderer.invoke('data:startBlank'),
  importExcel: () => ipcRenderer.invoke('data:importExcel'),
  exportExcel: (data) => ipcRenderer.invoke('data:exportExcel', data)
});

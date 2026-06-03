const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('financeApi', {
  load: () => ipcRenderer.invoke('data:load'),
  save: (data) => ipcRenderer.invoke('data:save', data),
  startBlank: () => ipcRenderer.invoke('data:startBlank'),
  clearAll: () => ipcRenderer.invoke('data:clearAll'),
  importExcel: () => ipcRenderer.invoke('data:importExcel'),
  exportExcel: (data) => ipcRenderer.invoke('data:exportExcel', data),
  addSalarySheetsFromPaths: (paths) => ipcRenderer.invoke('salarySheets:addFromPaths', paths),
  chooseSalarySheets: () => ipcRenderer.invoke('salarySheets:chooseAndAdd'),
  openSalarySheet: (storedName) => ipcRenderer.invoke('salarySheets:open', storedName),
  salarySheetPreviewUrl: (storedName) => ipcRenderer.invoke('salarySheets:previewUrl', storedName),
  deleteSalarySheet: (storedName) => ipcRenderer.invoke('salarySheets:delete', storedName),
  chooseUnpaidBillFiles: () => ipcRenderer.invoke('unpaidBills:chooseFiles'),
  addUnpaidBills: (entries) => ipcRenderer.invoke('unpaidBills:add', entries),
  openUnpaidBill: (storedName) => ipcRenderer.invoke('unpaidBills:open', storedName),
  unpaidBillPreviewUrl: (storedName) => ipcRenderer.invoke('unpaidBills:previewUrl', storedName),
  deleteUnpaidBill: (storedName) => ipcRenderer.invoke('unpaidBills:delete', storedName)
});

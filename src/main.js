const { app, BrowserWindow, dialog, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const XLSX = require('xlsx');

const publishPreview = process.argv.includes('--publish-preview');
const appDataName = publishPreview ? 'Finance Records Publish Preview' : 'Finance Records';

app.setName('Finance Records');
app.setPath('userData', path.join(app.getPath('appData'), appDataName));

const projectDir = path.join(app.getPath('documents'), 'Finance');
const legacyDataPath = path.join(projectDir, 'finance-data.json');
const dataDir = app.getPath('userData');
const dataPath = path.join(dataDir, 'finance-data.json');
const salarySheetsDir = path.join(dataDir, 'salary-sheets');
const unpaidBillsDir = path.join(dataDir, 'unpaid-bills');
const iconPath = path.join(app.getAppPath(), 'build', 'app-icon.icns');

function resourcePath(...parts) {
  return path.join(process.resourcesPath || app.getAppPath(), ...parts);
}

function monthName(value) {
  if (!value) return '';
  return String(value).replace(/\n/g, ' ').trim();
}

function num(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value === null || typeof value === 'undefined' || value === '') return 0;
  const parsed = Number(String(value).replace(/[¥,\s]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function safeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function emptyData() {
  return {
    meta: {
      version: 1,
      sourceFile: '',
      importedAt: '',
      startedAt: '',
      updatedAt: new Date().toISOString(),
      dataPath
    },
    salary: [],
    monthlyDetails: [],
    overtime: [],
    stockRevenue: [],
    daily: [],
    personalBalances: [],
    salarySheets: [],
    unpaidBills: []
  };
}

function safeFileName(name) {
  return String(name || 'salary-sheet')
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180) || 'salary-sheet';
}

function safeStoredFilePath(baseDir, storedName) {
  if (typeof storedName !== 'string' || !storedName || storedName !== path.basename(storedName)) return null;
  const resolvedBase = path.resolve(baseDir);
  const resolved = path.resolve(resolvedBase, storedName);
  if (!resolved.startsWith(resolvedBase + path.sep)) return null;
  return resolved;
}

function archiveSalarySheets(filePaths) {
  fs.mkdirSync(salarySheetsDir, { recursive: true });
  return (filePaths || [])
    .filter((filePath) => filePath && fs.existsSync(filePath) && fs.statSync(filePath).isFile())
    .map((filePath) => {
      const originalName = path.basename(filePath);
      const ext = path.extname(originalName);
      const base = safeFileName(path.basename(originalName, ext));
      const storedName = `${Date.now()}-${Math.random().toString(16).slice(2)}-${base}${ext}`;
      const destination = path.join(salarySheetsDir, storedName);
      fs.copyFileSync(filePath, destination);
      return {
        id: safeId('salary-sheet'),
        originalName,
        storedName,
        size: fs.statSync(destination).size,
        savedAt: new Date().toISOString()
      };
    });
}

function archiveUnpaidBills(entries) {
  fs.mkdirSync(unpaidBillsDir, { recursive: true });
  return (entries || [])
    .filter((entry) => entry?.path && fs.existsSync(entry.path) && fs.statSync(entry.path).isFile())
    .map((entry) => {
      const originalName = path.basename(entry.path);
      const ext = path.extname(originalName);
      const base = safeFileName(entry.title || path.basename(originalName, ext));
      const storedName = `${Date.now()}-${Math.random().toString(16).slice(2)}-${base}${ext}`;
      const destination = path.join(unpaidBillsDir, storedName);
      fs.copyFileSync(entry.path, destination);
      return {
        id: safeId('unpaid-bill'),
        title: String(entry.title || path.basename(originalName, ext)).trim(),
        originalName,
        storedName,
        size: fs.statSync(destination).size,
        savedAt: new Date().toISOString()
      };
    });
}

function salarySheetPath(storedName) {
  return safeStoredFilePath(salarySheetsDir, storedName);
}

function unpaidBillPath(storedName) {
  return safeStoredFilePath(unpaidBillsDir, storedName);
}

function importExcel(filePath) {
  const workbook = XLSX.readFile(filePath, { cellDates: true });
  const sheets = {};
  workbook.SheetNames.forEach((name) => {
    sheets[name] = XLSX.utils.sheet_to_json(workbook.Sheets[name]);
  });
  return { fileName: path.basename(filePath), sheets };
}

function importBackup(filePath) {
  const imported = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const archives = imported?._archives || {};
  const data = Object.assign(emptyData(), imported || {});
  delete data._archives;
  data.meta = Object.assign({}, emptyData().meta, imported?.meta || {}, {
    sourceFile: filePath,
    importedAt: new Date().toISOString(),
    dataPath
  });
  data.salary = Array.isArray(data.salary) ? data.salary : [];
  data.monthlyDetails = Array.isArray(data.monthlyDetails) ? data.monthlyDetails : [];
  data.overtime = Array.isArray(data.overtime) ? data.overtime : [];
  data.stockRevenue = Array.isArray(data.stockRevenue) ? data.stockRevenue : [];
  data.daily = Array.isArray(data.daily) ? data.daily : [];
  data.personalBalances = Array.isArray(data.personalBalances) ? data.personalBalances : [];
  data.salarySheets = Array.isArray(data.salarySheets) ? data.salarySheets : [];
  data.unpaidBills = Array.isArray(data.unpaidBills) ? data.unpaidBills : [];
  if (!data.meta.startedAt) data.meta.startedAt = data.meta.importedAt;
  restoreArchiveFiles(salarySheetsDir, archives.salarySheets);
  restoreArchiveFiles(unpaidBillsDir, archives.unpaidBills);
  saveData(data);
  return data;
}

function loadData() {
  if (!publishPreview && !fs.existsSync(dataPath) && fs.existsSync(legacyDataPath)) {
    fs.mkdirSync(dataDir, { recursive: true });
    fs.copyFileSync(legacyDataPath, dataPath);
  }
  const seededDataPath = resourcePath('seed-data', 'finance-data.json');
  if (!fs.existsSync(dataPath) && fs.existsSync(seededDataPath)) {
    fs.mkdirSync(dataDir, { recursive: true });
    fs.copyFileSync(seededDataPath, dataPath);
  }
  if (fs.existsSync(dataPath)) {
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    data.meta = Object.assign({}, data.meta || {}, { dataPath });
    data.salarySheets = data.salarySheets || [];
    data.unpaidBills = data.unpaidBills || [];
    if (!data.meta.startedAt) data.meta.startedAt = data.meta.importedAt || data.meta.updatedAt || new Date().toISOString();
    if (!data.meta.updatedAt) data.meta.updatedAt = data.meta.startedAt;
    return data;
  }
  const data = emptyData();
  return data;
}

function saveData(data) {
  fs.mkdirSync(dataDir, { recursive: true });
  data.meta = Object.assign({}, data.meta || {}, { updatedAt: new Date().toISOString() });
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

function clearAllData() {
  if (fs.existsSync(dataPath)) fs.unlinkSync(dataPath);
  fs.rmSync(salarySheetsDir, { recursive: true, force: true });
  fs.rmSync(unpaidBillsDir, { recursive: true, force: true });
  const data = emptyData();
  data.meta.startedAt = new Date().toISOString();
  saveData(data);
  return data;
}

function exportExcel(sheets, outputPath) {
  const wb = XLSX.utils.book_new();
  (sheets || []).forEach(({ name, rows, widths }) => {
    const sheet = XLSX.utils.json_to_sheet(rows || []);
    if (widths) sheet['!cols'] = widths;
    XLSX.utils.book_append_sheet(wb, sheet, name);
  });
  XLSX.writeFile(wb, outputPath);
  return outputPath;
}

function collectArchiveFiles(baseDir, records) {
  return (records || [])
    .map((record) => {
      const filePath = safeStoredFilePath(baseDir, record.storedName);
      if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return null;
      return {
        storedName: record.storedName,
        contentBase64: fs.readFileSync(filePath).toString('base64')
      };
    })
    .filter(Boolean);
}

function restoreArchiveFiles(baseDir, archiveFiles) {
  if (!Array.isArray(archiveFiles)) return;
  fs.rmSync(baseDir, { recursive: true, force: true });
  fs.mkdirSync(baseDir, { recursive: true });
  archiveFiles.forEach((file) => {
    const filePath = safeStoredFilePath(baseDir, file?.storedName);
    if (!filePath || typeof file.contentBase64 !== 'string') return;
    fs.writeFileSync(filePath, Buffer.from(file.contentBase64, 'base64'));
  });
}

function exportBackup(data, outputPath) {
  const backup = Object.assign(emptyData(), data || {});
  backup.meta = Object.assign({}, emptyData().meta, data?.meta || {}, {
    updatedAt: new Date().toISOString(),
    dataPath: ''
  });
  backup._archives = {
    salarySheets: collectArchiveFiles(salarySheetsDir, backup.salarySheets),
    unpaidBills: collectArchiveFiles(unpaidBillsDir, backup.unpaidBills)
  };
  fs.writeFileSync(outputPath, JSON.stringify(backup, null, 2));
  return outputPath;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1320,
    height: 900,
    minWidth: 1080,
    minHeight: 720,
    title: 'Finance Records',
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true
    }
  });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (event, url) => {
    const appUrl = pathToFileURL(path.join(__dirname, 'renderer', 'index.html')).toString();
    if (url !== appUrl) event.preventDefault();
  });
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

ipcMain.handle('data:load', () => loadData());
ipcMain.handle('data:save', (_event, data) => {
  saveData(data);
  return data;
});
ipcMain.handle('data:startBlank', () => {
  const data = emptyData();
  data.meta.startedAt = new Date().toISOString();
  saveData(data);
  return data;
});
ipcMain.handle('data:clearAll', () => clearAllData());
ipcMain.handle('data:importExcel', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Import finance workbook',
    defaultPath: app.getPath('documents'),
    filters: [{ name: 'Excel', extensions: ['xlsx', 'xls'] }],
    properties: ['openFile']
  });
  if (result.canceled || !result.filePaths[0]) return null;
  return importExcel(result.filePaths[0]);
});
ipcMain.handle('data:exportExcel', async (_event, payload) => {
  const { data, sheets } = payload || {};
  const result = await dialog.showSaveDialog({
    title: 'Export finance records',
    defaultPath: path.join(projectDir, `FinanceRecords-${new Date().toISOString().slice(0, 10)}.xlsx`),
    filters: [{ name: 'Excel', extensions: ['xlsx'] }]
  });
  if (result.canceled || !result.filePath) return null;
  if (data) saveData(data);
  return exportExcel(sheets, result.filePath);
});
ipcMain.handle('data:importBackup', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Import finance records backup',
    defaultPath: app.getPath('documents'),
    filters: [{ name: 'Finance Records Backup', extensions: ['json'] }],
    properties: ['openFile']
  });
  if (result.canceled || !result.filePaths[0]) return null;
  return importBackup(result.filePaths[0]);
});
ipcMain.handle('data:exportBackup', async (_event, data) => {
  const result = await dialog.showSaveDialog({
    title: 'Export finance records backup',
    defaultPath: path.join(projectDir, `FinanceRecords-Backup-${new Date().toISOString().slice(0, 10)}.json`),
    filters: [{ name: 'Finance Records Backup', extensions: ['json'] }]
  });
  if (result.canceled || !result.filePath) return null;
  saveData(data);
  return exportBackup(data, result.filePath);
});
ipcMain.handle('salarySheets:addFromPaths', (_event, filePaths) => archiveSalarySheets(filePaths));
ipcMain.handle('salarySheets:chooseAndAdd', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Save salary sheets',
    defaultPath: projectDir,
    filters: [
      { name: 'Documents', extensions: ['xlsx', 'xls', 'numbers', 'pdf', 'csv', 'txt'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    properties: ['openFile', 'multiSelections']
  });
  if (result.canceled || !result.filePaths.length) return [];
  return archiveSalarySheets(result.filePaths);
});
ipcMain.handle('salarySheets:open', async (_event, storedName) => {
  const filePath = salarySheetPath(storedName);
  if (!filePath || !fs.existsSync(filePath)) return 'File not found';
  const error = await shell.openPath(filePath);
  return error || '';
});
ipcMain.handle('salarySheets:previewUrl', (_event, storedName) => {
  const filePath = salarySheetPath(storedName);
  if (!filePath || !fs.existsSync(filePath)) return '';
  return pathToFileURL(filePath).toString();
});
ipcMain.handle('salarySheets:delete', (_event, storedName) => {
  const filePath = salarySheetPath(storedName);
  if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  return true;
});
ipcMain.handle('unpaidBills:chooseFiles', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Save unpaid bill documents',
    defaultPath: projectDir,
    filters: [
      { name: 'Bills', extensions: ['pdf', 'png', 'jpg', 'jpeg', 'heic', 'webp', 'xlsx', 'xls', 'numbers', 'txt'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    properties: ['openFile', 'multiSelections']
  });
  if (result.canceled || !result.filePaths.length) return [];
  return result.filePaths;
});
ipcMain.handle('unpaidBills:add', (_event, entries) => archiveUnpaidBills(entries));
ipcMain.handle('unpaidBills:open', async (_event, storedName) => {
  const filePath = unpaidBillPath(storedName);
  if (!filePath || !fs.existsSync(filePath)) return 'File not found';
  const error = await shell.openPath(filePath);
  return error || '';
});
ipcMain.handle('unpaidBills:previewUrl', (_event, storedName) => {
  const filePath = unpaidBillPath(storedName);
  if (!filePath || !fs.existsSync(filePath)) return '';
  return pathToFileURL(filePath).toString();
});
ipcMain.handle('unpaidBills:delete', (_event, storedName) => {
  const filePath = unpaidBillPath(storedName);
  if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  return true;
});

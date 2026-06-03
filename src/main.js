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

function cell(sheet, address) {
  return sheet[address] ? sheet[address].v : null;
}

function sheetRows(sheet) {
  return XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: null });
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

function parseYearSummary(workbook, year) {
  const sheet = workbook.Sheets[String(year)];
  if (!sheet) return [];
  const rows = sheetRows(sheet);
  const plannedByMonth = {};
  for (let r = 1; r < rows.length; r += 1) {
    const row = rows[r] || [];
    const month = monthName(row[3]);
    if (month && month !== 'Total') {
      plannedByMonth[month] = num(row[4]);
    }
  }
  const result = [];
  for (let r = 1; r < rows.length; r += 1) {
    const row = rows[r] || [];
    const month = monthName(row[9]);
    if (!month || month === 'Total') continue;
    const salary = num(row[10]);
    const actualSavings = num(row[11]);
    result.push({
      id: safeId('salary'),
      year: Number(year),
      month,
      salary,
      plannedSavings: plannedByMonth[month] || 0,
      actualSavings,
      savingsRate: salary ? actualSavings / salary : 0,
      cumulativeCapital: num(row[12]),
      note: ''
    });
  }
  return result;
}

function parseMonthlyDetails(workbook, sheetName, year) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];
  const rows = sheetRows(sheet);
  const result = [];
  for (let r = 0; r < rows.length; r += 1) {
    const label = monthName((rows[r] || [])[0]);
    if (!/月$/.test(label)) continue;
    const block = rows.slice(r, Math.min(rows.length, r + 23));
    const findValue = (name) => {
      for (const row of block) {
        for (let c = 0; c < row.length; c += 1) {
          if (String(row[c] || '').toLowerCase() === name.toLowerCase()) {
            return num(row[c + 1]);
          }
        }
      }
      return 0;
    };
    const basic = findValue('Basic');
    const allowance = findValue('Allowance');
    const overtimePay = findValue('Overtime');
    const transportation = findValue('Transportation') || findValue('Trasportation');
    const insurance = findValue('Insurance');
    const pension = findValue('Nenkin');
    const employmentInsurance = findValue('Koyo Hoken');
    const residentTax = findValue('JUMINZEI');
    const incomeTax = findValue('Income Tax');
    const totalDeduction = insurance + pension + employmentInsurance + residentTax + incomeTax;
    const grossTotal = basic + allowance + overtimePay + transportation;
    result.push({
      id: safeId('detail'),
      year,
      month: label.replace('月', ''),
      basic,
      allowance,
      overtimePay,
      transportation,
      grossTotal,
      insurance,
      pension,
      employmentInsurance,
      residentTax,
      incomeTax,
      totalDeduction,
      received: grossTotal - totalDeduction
    });
  }
  return result;
}

function parseStock(workbook) {
  const result = [];
  Object.keys(workbook.Sheets).filter((name) => /Stock Revenue/i.test(name)).forEach((sheetName) => {
    const yearMatch = sheetName.match(/\d{4}/);
    const year = yearMatch ? Number(yearMatch[0]) : null;
    const rows = sheetRows(workbook.Sheets[sheetName]);
    for (let r = 1; r < rows.length; r += 1) {
      const row = rows[r] || [];
      const month = monthName(row[0]);
      if (!month || month === 'TOTAL' || month === 'After Tax') continue;
      result.push({
        id: safeId('stock'),
        year,
        month,
        targetCumulative: num(row[1]),
        actualCumulative: num(row[2]),
        monthlyRevenue: num(row[3]),
        surplus: num(row[4]),
        verdict: monthName(row[5])
      });
    }
  });
  return result;
}

function parseDaily(workbook) {
  const sheet = workbook.Sheets.Daily;
  if (!sheet) return [];
  const rows = sheetRows(sheet);
  const result = [];
  for (let r = 1; r < rows.length; r += 1) {
    const month = monthName((rows[r] || [])[0]);
    if (!month) continue;
    for (let c = 1; c < (rows[0] || []).length; c += 1) {
      const day = num((rows[0] || [])[c]);
      const value = (rows[r] || [])[c];
      if (!day || value === null || value === '') continue;
      result.push({
        id: safeId('daily'),
        year: 2026,
        month,
        day,
        amount: typeof value === 'number' ? value : 0,
        status: typeof value === 'number' ? 'Realized' : String(value),
        note: typeof value === 'number' ? '' : String(value)
      });
    }
  }
  return result;
}

function parseOvertime(workbook) {
  const sheet = workbook.Sheets['OT Tracker'];
  if (!sheet) return [];
  const rows = sheetRows(sheet);
  const result = [];
  for (let r = 1; r < rows.length; r += 1) {
    const month = monthName((rows[r] || [])[0]);
    if (!month) continue;
    for (let c = 1; c < (rows[0] || []).length; c += 1) {
      const day = num((rows[0] || [])[c]);
      const value = (rows[r] || [])[c];
      if (!day || value === null || value === '') continue;
      result.push({
        id: safeId('ot'),
        month,
        day,
        hours: typeof value === 'number' ? value * 24 : 0,
        note: typeof value === 'number' ? '' : String(value)
      });
    }
  }
  return result;
}

function parsePersonalBalances(workbook) {
  const sheetName = ['Debts', 'Debt Records', 'Bills', 'Personal Balances']
    .find((name) => workbook.Sheets[name]);
  const sheet = sheetName ? workbook.Sheets[sheetName] : null;
  if (!sheet) return [];
  const rows = sheetRows(sheet);
  const result = [];
  for (let r = 2; r < rows.length; r += 1) {
    const row = rows[r] || [];
    if (!row[1] && !row[2]) continue;
    if (String(row[1] || '').toLowerCase() === 'total') continue;
    result.push({
      id: safeId('balance'),
      group: monthName(row[0]) || 'Debt',
      dateOrLabel: row[1] instanceof Date ? row[1].toISOString().slice(0, 10) : monthName(row[1]),
      amount: num(row[2]),
      note: ''
    });
  }
  return result;
}

function importExcel(filePath) {
  const workbook = XLSX.readFile(filePath, { cellDates: true });
  const data = emptyData();
  data.meta.sourceFile = filePath;
  data.meta.importedAt = new Date().toISOString();
  data.meta.startedAt = data.meta.importedAt;
  data.salary = [2024, 2025, 2026].flatMap((year) => parseYearSummary(workbook, year));
  data.monthlyDetails = [
    ...parseMonthlyDetails(workbook, 'Details', 2024),
    ...parseMonthlyDetails(workbook, '2025 Details', 2025),
    ...parseMonthlyDetails(workbook, '2026 Details', 2026)
  ];
  data.overtime = parseOvertime(workbook);
  data.stockRevenue = parseStock(workbook);
  data.daily = parseDaily(workbook);
  data.personalBalances = parsePersonalBalances(workbook);
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

function exportExcel(data, outputPath) {
  const wb = XLSX.utils.book_new();
  const addSheet = (name, rows) => XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), name);
  addSheet('Salary', data.salary || []);
  addSheet('Monthly Details', data.monthlyDetails || []);
  addSheet('Overtime', data.overtime || []);
  addSheet('Stock Revenue', data.stockRevenue || []);
  addSheet('Daily', data.daily || []);
  addSheet('Debts', data.personalBalances || []);
  addSheet('Salary Sheets Archive', data.salarySheets || []);
  addSheet('Unpaid Bills Archive', data.unpaidBills || []);
  XLSX.writeFile(wb, outputPath);
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
ipcMain.handle('data:exportExcel', async (_event, data) => {
  const result = await dialog.showSaveDialog({
    title: 'Export finance records',
    defaultPath: path.join(projectDir, `FinanceRecords-${new Date().toISOString().slice(0, 10)}.xlsx`),
    filters: [{ name: 'Excel', extensions: ['xlsx'] }]
  });
  if (result.canceled || !result.filePath) return null;
  saveData(data);
  return exportExcel(data, result.filePath);
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

let state = null;
let activeView = 'dashboard';
let dialogContext = null;

const schemas = {
  salary: [
    ['year', 'Year', 'number'], ['month', 'Month'], ['salary', 'Salary', 'number'],
    ['plannedSavings', 'Planned Savings', 'number'], ['actualSavings', 'Actual Savings', 'number'],
    ['cumulativeCapital', 'Cumulative Capital', 'number'], ['note', 'Note']
  ],
  monthlyDetails: [
    ['year', 'Year', 'number'], ['month', 'Month'], ['basic', 'Basic', 'number'], ['allowance', 'Allowance', 'number'],
    ['overtimePay', 'Overtime Pay', 'number'], ['transportation', 'Transportation', 'number'],
    ['grossTotal', 'Gross Total', 'number'], ['insurance', 'Insurance', 'number'], ['pension', 'Nenkin', 'number'],
    ['employmentInsurance', 'Koyo Hoken', 'number'], ['residentTax', 'Juminzei', 'number'],
    ['incomeTax', 'Income Tax', 'number'], ['totalDeduction', 'Total Deduction', 'number'], ['received', 'Received', 'number']
  ],
  overtime: [
    ['year', 'Year', 'number'], ['month', 'Month'], ['day', 'Day', 'number'],
    ['hours', 'OT Hours', 'number'], ['miscHours', 'Misc OT', 'number'], ['rate', 'Rate', 'number'],
    ['amount', 'Amount', 'number'], ['note', 'Note']
  ],
  stockRevenue: [
    ['year', 'Year', 'number'], ['month', 'Month'], ['targetCumulative', 'Target Cumulative', 'number'],
    ['actualCumulative', 'Actual Cumulative', 'number'], ['monthlyRevenue', 'Monthly', 'number'],
    ['surplus', 'Surplus', 'number'], ['verdict', 'Verdict']
  ],
  daily: [
    ['year', 'Year', 'number'], ['month', 'Month'], ['day', 'Day', 'number'],
    ['amount', 'Amount', 'number'], ['status', 'Status'], ['note', 'Note']
  ],
  personalBalances: [
    ['group', 'Group'], ['dateOrLabel', 'Date / Label'], ['amount', 'Amount', 'number'], ['note', 'Note']
  ]
};

const titles = {
  dashboard: 'Dashboard',
  salary: 'Salary & Savings',
  details: 'Monthly Details',
  overtime: 'Overtime',
  stocks: 'Stock Revenue',
  daily: 'Daily Records',
  balances: 'Personal Balances',
  data: 'Data & Backup'
};

const collections = ['salary', 'monthlyDetails', 'overtime', 'stockRevenue', 'daily', 'personalBalances'];
const monthOptions = [
  ['Jan', 'Jan'], ['Feb', 'Feb'], ['Mar', 'Mar'], ['Apr', 'Apr'], ['May', 'May'], ['Jun', 'Jun'],
  ['Jul', 'Jul'], ['Aug', 'Aug'], ['Sep', 'Sep'], ['Oct', 'Oct'], ['Nov', 'Nov'], ['Dec', 'Dec']
];

function yen(value) {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(Number(value || 0));
}

function pct(value) {
  const n = Number(value || 0);
  return `${Math.round(n * 1000) / 10}%`;
}

function id(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

function setSaveState(text) {
  document.getElementById('saveState').textContent = text;
}

function hasRecords() {
  return collections.some((collection) => (state[collection] || []).length > 0);
}

function searchText() {
  return (document.getElementById('globalSearch')?.value || '').trim().toLowerCase();
}

function matchesSearch(record) {
  const q = searchText();
  if (!q) return true;
  return Object.values(record || {}).some((value) => String(value ?? '').toLowerCase().includes(q));
}

function filterRecords(records) {
  return (records || []).filter(matchesSearch);
}

function showSetupIfNeeded() {
  const overlay = document.getElementById('setupOverlay');
  overlay.hidden = hasRecords() || Boolean(state.meta?.startedAt);
}

async function save() {
  setSaveState('Saving...');
  await window.financeApi.save(state);
  setSaveState('Saved');
  setTimeout(() => setSaveState('Ready'), 1200);
}

function yearsFrom(records) {
  return [...new Set((records || []).map((item) => Number(item.year)).filter(Boolean))].sort((a, b) => a - b);
}

function fillSelect(idName, values, current, allLabel) {
  const select = document.getElementById(idName);
  select.innerHTML = '';
  if (allLabel) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = allLabel;
    select.appendChild(opt);
  }
  values.forEach((value) => {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = value;
    select.appendChild(opt);
  });
  if (current !== undefined && current !== null) select.value = current;
}

function fillSelectPairs(idName, pairs, current, allLabel) {
  const select = document.getElementById(idName);
  select.innerHTML = '';
  if (allLabel) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = allLabel;
    select.appendChild(opt);
  }
  pairs.forEach(([value, label]) => {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = label;
    select.appendChild(opt);
  });
  if (current !== undefined && current !== null) select.value = current;
}

function currentYear() {
  const years = yearsFrom(state.salary);
  return Number(document.getElementById('dashboardYear').value || years[years.length - 1] || new Date().getFullYear());
}

function sum(records, key) {
  return (records || []).reduce((total, item) => total + Number(item[key] || 0), 0);
}

function latestCapital(records) {
  return (records || []).reduce((latest, item) => Number(item.cumulativeCapital || 0) || latest, 0);
}

function monthIndex(month) {
  const value = String(month || '').trim();
  const idx = monthOptions.findIndex(([key]) => key.toLowerCase() === value.toLowerCase());
  if (idx >= 0) return idx + 1;
  const parsed = Number(value.replace(/[^0-9]/g, ''));
  return Number.isFinite(parsed) && parsed >= 1 && parsed <= 12 ? parsed : 0;
}

function normalizeMonth(month) {
  const idx = monthIndex(month);
  return idx ? monthOptions[idx - 1][0] : String(month || '');
}

function defaultOtRate() {
  const rates = (state.overtime || []).map((item) => Number(item.rate)).filter((rate) => rate > 0);
  return rates[rates.length - 1] || 2018;
}

function normalizeOvertimeRecord(record) {
  const hours = Number(record.hours || 0);
  const miscHours = Number(record.miscHours || 0);
  const rate = Number(record.rate || 0) || defaultOtRate();
  return {
    ...record,
    year: Number(record.year || currentYear()),
    month: normalizeMonth(record.month),
    hours,
    miscHours,
    rate,
    amount: Number(record.amount || 0) || Math.round((hours + miscHours) * rate * 100) / 100
  };
}

function selectedOtYear() {
  const years = yearsFrom(state.overtime);
  return Number(document.getElementById('otYearFilter')?.value || years[years.length - 1] || currentYear());
}

function selectedOtMonth() {
  return document.getElementById('otMonthFilter')?.value || monthOptions[new Date().getMonth()][0];
}

function renderKpis() {
  const year = currentYear();
  const salary = state.salary.filter((item) => Number(item.year) === year);
  const stock = state.stockRevenue.filter((item) => Number(item.year) === year);
  const balances = state.personalBalances;
  const totalSalary = sum(salary, 'salary');
  const actualSavings = sum(salary, 'actualSavings');
  const stockLatest = stock.reduce((latest, item) => Number(item.actualCumulative || 0) || latest, 0);
  const balanceTotal = sum(balances, 'amount');
  const kpis = [
    ['Total Salary', yen(totalSalary), ''],
    ['Actual Savings', yen(actualSavings), actualSavings >= 0 ? 'positive' : 'negative'],
    ['Stock Revenue', yen(stockLatest), stockLatest >= 0 ? 'positive' : 'negative'],
    ['Personal Balance', yen(balanceTotal), '']
  ];
  document.getElementById('kpis').innerHTML = kpis.map(([label, value, cls]) =>
    `<div class="kpi ${cls}"><span>${label}</span><strong>${value}</strong></div>`
  ).join('');
}

function renderInsights() {
  const year = currentYear();
  const salary = state.salary.filter((item) => Number(item.year) === year);
  const details = state.monthlyDetails.filter((item) => Number(item.year) === year);
  const daily = state.daily.filter((item) => Number(item.year) === year);
  const actualSavings = sum(salary, 'actualSavings');
  const plannedSavings = sum(salary, 'plannedSavings');
  const received = sum(details, 'received');
  const spending = Math.max(0, received - actualSavings);
  const positiveDays = daily.filter((item) => Number(item.amount) > 0).length;
  const insights = [
    ['Savings Gap', yen(actualSavings - plannedSavings), actualSavings >= plannedSavings ? 'On or above plan' : 'Below plan'],
    ['Estimated Spending', yen(spending), 'Received minus saved'],
    ['Tracked Days', `${positiveDays}`, 'Daily entries with amount']
  ];
  document.getElementById('insights').innerHTML = insights.map(([label, value, hint]) => `
    <div class="insight">
      <span>${label}</span>
      <strong>${value}</strong>
      <small>${hint}</small>
    </div>
  `).join('');
}

function drawBarChart(canvas, labels, series) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  const pad = 38;
  const max = Math.max(1, ...series.flatMap((s) => s.values.map((v) => Math.abs(Number(v || 0)))));
  const barGroup = (w - pad * 2) / Math.max(labels.length, 1);
  ctx.strokeStyle = '#d8e2e7';
  ctx.beginPath();
  ctx.moveTo(pad, h - pad);
  ctx.lineTo(w - pad, h - pad);
  ctx.stroke();
  labels.forEach((label, i) => {
    const x = pad + i * barGroup + 6;
    const barWidth = Math.max(8, (barGroup - 18) / series.length);
    series.forEach((s, j) => {
      const value = Number(s.values[i] || 0);
      const bh = Math.abs(value) / max * (h - pad * 2);
      ctx.fillStyle = s.color;
      ctx.fillRect(x + j * barWidth, h - pad - bh, barWidth - 2, bh);
    });
    ctx.fillStyle = '#60717b';
    ctx.font = '11px sans-serif';
    ctx.fillText(String(label).slice(0, 6), x, h - 10);
  });
  series.forEach((s, i) => {
    ctx.fillStyle = s.color;
    ctx.fillRect(pad + i * 110, 10, 12, 12);
    ctx.fillStyle = '#263238';
    ctx.fillText(s.label, pad + i * 110 + 18, 20);
  });
}

function renderCharts() {
  const year = currentYear();
  const salary = state.salary.filter((item) => Number(item.year) === year);
  drawBarChart(document.getElementById('salaryChart'), salary.map((item) => item.month), [
    { label: 'Salary', color: '#277da1', values: salary.map((item) => item.salary) },
    { label: 'Savings', color: '#43aa8b', values: salary.map((item) => item.actualSavings) }
  ]);
  const stock = state.stockRevenue.filter((item) => Number(item.year) === year);
  drawBarChart(document.getElementById('stockChart'), stock.map((item) => item.month), [
    { label: 'Target', color: '#f9c74f', values: stock.map((item) => item.targetCumulative) },
    { label: 'Actual', color: '#4caf50', values: stock.map((item) => item.actualCumulative) }
  ]);
}

function renderDashboard() {
  const years = yearsFrom(state.salary);
  fillSelect('dashboardYear', years, currentYear());
  renderKpis();
  renderCharts();
  renderInsights();
}

function formatValue(key, value) {
  if (['salary', 'plannedSavings', 'actualSavings', 'cumulativeCapital', 'basic', 'allowance', 'overtimePay', 'transportation', 'grossTotal', 'insurance', 'pension', 'employmentInsurance', 'residentTax', 'incomeTax', 'totalDeduction', 'received', 'targetCumulative', 'actualCumulative', 'monthlyRevenue', 'surplus', 'amount', 'rate'].includes(key)) {
    return yen(value);
  }
  if (key === 'savingsRate') return pct(value);
  if (key === 'hours') return `${Math.round(Number(value || 0) * 100) / 100}`;
  return value ?? '';
}

function renderTable(containerId, collection, fields, records) {
  const rows = records.map((item) => `
    <tr>
      ${fields.map(([key, , type]) => `<td class="${type === 'number' ? 'number' : ''}">${formatValue(key, item[key])}</td>`).join('')}
      <td><div class="row-actions"><button data-edit="${collection}" data-id="${item.id}">Edit</button><button class="delete" data-delete="${collection}" data-id="${item.id}">Delete</button></div></td>
    </tr>
  `).join('');
  const html = `
    <div class="table-wrap">
      <table>
        <thead><tr>${fields.map(([, label]) => `<th>${label}</th>`).join('')}<th>Actions</th></tr></thead>
        <tbody>
          ${rows || `<tr><td colspan="${fields.length + 1}" class="empty-cell">No records found.</td></tr>`}
        </tbody>
      </table>
    </div>`;
  document.getElementById(containerId).innerHTML = html;
}

function renderSalary() {
  const years = yearsFrom(state.salary);
  const selected = document.getElementById('salaryYearFilter').value || years[years.length - 1] || '';
  fillSelect('salaryYearFilter', years, selected, 'All years');
  const records = filterRecords(selected ? state.salary.filter((item) => String(item.year) === String(selected)) : state.salary);
  renderTable('salaryTable', 'salary', schemas.salary, records);
}

function renderDetails() {
  const years = yearsFrom(state.monthlyDetails);
  const selected = document.getElementById('detailsYearFilter').value || years[years.length - 1] || '';
  fillSelect('detailsYearFilter', years, selected, 'All years');
  const records = filterRecords(selected ? state.monthlyDetails.filter((item) => String(item.year) === String(selected)) : state.monthlyDetails);
  renderTable('detailsTable', 'monthlyDetails', schemas.monthlyDetails, records);
}

function renderOvertime() {
  state.overtime = (state.overtime || []).map(normalizeOvertimeRecord);
  const years = yearsFrom(state.overtime);
  const year = selectedOtYear();
  const month = normalizeMonth(selectedOtMonth());
  fillSelect('otYearFilter', years.length ? years : [year], year);
  fillSelectPairs('otMonthFilter', monthOptions, month);
  fillSelectPairs('otMonth', monthOptions, document.getElementById('otMonth')?.value || month);
  document.getElementById('otYear').value = document.getElementById('otYear').value || year;
  document.getElementById('otRate').value = document.getElementById('otRate').value || defaultOtRate();

  const recordsForMonth = state.overtime
    .filter((item) => Number(item.year) === Number(year) && normalizeMonth(item.month) === month)
    .sort((a, b) => Number(a.day || 0) - Number(b.day || 0));
  renderOtSummary(year, month, recordsForMonth);
  renderTable('overtimeTable', 'overtime', schemas.overtime, filterRecords(recordsForMonth));
}

function renderStocks() {
  const years = yearsFrom(state.stockRevenue);
  const selected = document.getElementById('stockYearFilter').value || years[years.length - 1] || '';
  fillSelect('stockYearFilter', years, selected, 'All years');
  const records = filterRecords(selected ? state.stockRevenue.filter((item) => String(item.year) === String(selected)) : state.stockRevenue);
  renderTable('stockTable', 'stockRevenue', schemas.stockRevenue, records);
}

function renderDaily() {
  const months = [...new Set(state.daily.map((item) => item.month))];
  const selected = document.getElementById('dailyMonthFilter').value || '';
  fillSelect('dailyMonthFilter', months, selected, 'All months');
  const records = filterRecords(selected ? state.daily.filter((item) => item.month === selected) : state.daily);
  renderTable('dailyTable', 'daily', schemas.daily, records);
}

function renderBalances() {
  renderTable('balanceTable', 'personalBalances', schemas.personalBalances, filterRecords(state.personalBalances));
}

function renderOtSummary(year, month, records) {
  const detail = (state.monthlyDetails || []).find((item) =>
    Number(item.year) === Number(year) && normalizeMonth(item.month) === normalizeMonth(month)
  ) || {};
  const otHours = sum(records, 'hours');
  const miscHours = sum(records, 'miscHours');
  const totalHours = otHours + miscHours;
  const rate = records.find((item) => Number(item.rate) > 0)?.rate || defaultOtRate();
  const otAmount = sum(records, 'amount') || Math.round(totalHours * rate * 100) / 100;
  const basic = Number(detail.basic || 0);
  const allowance = Number(detail.allowance || 0);
  const transportation = Number(detail.transportation || 0);
  const insurance = Number(detail.insurance || 0);
  const pension = Number(detail.pension || 0);
  const employmentInsurance = Number(detail.employmentInsurance || 0);
  const residentTax = Number(detail.residentTax || 0);
  const incomeTax = Number(detail.incomeTax || 0);
  const grossTotal = basic + allowance + otAmount + transportation;
  const deductionTotal = insurance + pension + employmentInsurance + residentTax + incomeTax;
  const received = grossTotal - deductionTotal;
  document.getElementById('otSummaryTitle').textContent = `${month} ${year} OT Summary`;
  document.getElementById('otSummary').innerHTML = `
    <div class="ot-sheet">
      <div class="ot-list">
        <div class="ot-line"><span>OT</span><strong>${totalHours.toFixed(2)}</strong></div>
        <div class="ot-subline"><span>Daily OT</span><strong>${otHours.toFixed(2)}</strong></div>
        <div class="ot-subline"><span>Misc OT</span><strong>${miscHours.toFixed(2)}</strong></div>
        <div class="ot-total-line"><span>Total</span><strong>${totalHours.toFixed(2)}</strong><b>${yen(otAmount)}</b></div>
        <div class="ot-received"><span>Amount received</span><strong>${yen(received)}</strong></div>
      </div>
      <div class="ot-payroll">
        <div><span>Rate</span><strong>${yen(rate)}</strong></div>
        <div><span>Basic</span><strong>${yen(basic)}</strong></div>
        <div><span>Allowance</span><strong>${yen(allowance)}</strong></div>
        <div><span>Overtime</span><strong>${yen(otAmount)}</strong></div>
        <div><span>Transportation</span><strong>${yen(transportation)}</strong></div>
        <hr>
        <div class="total"><span>Total</span><strong>${yen(grossTotal)}</strong></div>
        <div><span>Insurance</span><strong>${yen(insurance)}</strong></div>
        <div><span>Nenkin</span><strong>${yen(pension)}</strong></div>
        <div><span>Koyo Hoken</span><strong>${yen(employmentInsurance)}</strong></div>
        <hr>
        <div><span>JUMINZEI</span><strong>${yen(residentTax)}</strong></div>
        <div><span>Income Tax</span><strong>${yen(incomeTax)}</strong></div>
        <div class="total"><span>Total Deduction</span><strong>${yen(deductionTotal)}</strong></div>
      </div>
    </div>
  `;
}

function renderData() {
  document.getElementById('dataPathText').textContent = state.meta?.dataPath || 'finance-data.json';
  document.getElementById('startedAtText').textContent = state.meta?.startedAt ? new Date(state.meta.startedAt).toLocaleString() : '-';
  document.getElementById('updatedAtText').textContent = state.meta?.updatedAt ? new Date(state.meta.updatedAt).toLocaleString() : '-';
  document.getElementById('sourceFileText').textContent = state.meta?.sourceFile || 'None';
}

function render() {
  showSetupIfNeeded();
  renderDashboard();
  renderSalary();
  renderDetails();
  renderOvertime();
  renderStocks();
  renderDaily();
  renderBalances();
  renderData();
}

function switchView(view) {
  activeView = view;
  document.querySelectorAll('.view').forEach((el) => el.classList.toggle('active', el.id === view));
  document.querySelectorAll('#nav button').forEach((btn) => btn.classList.toggle('active', btn.dataset.view === view));
  document.getElementById('viewTitle').textContent = titles[view];
}

function openEditor(collection, record) {
  dialogContext = { collection, id: record && record.id };
  document.getElementById('dialogTitle').textContent = record ? 'Edit record' : 'Add record';
  const fields = schemas[collection];
  document.getElementById('dialogFields').innerHTML = fields.map(([key, label, type]) => `
    <div class="field ${key === 'note' ? 'full' : ''}">
      <label for="field-${key}">${label}</label>
      <input id="field-${key}" name="${key}" type="${type === 'number' ? 'number' : 'text'}" step="any" value="${record && record[key] !== undefined ? String(record[key]).replace(/"/g, '&quot;') : ''}">
    </div>
  `).join('');
  document.getElementById('recordDialog').showModal();
}

function saveDialogRecord() {
  const { collection, id: recordId } = dialogContext;
  const fields = schemas[collection];
  const values = { id: recordId || id(collection) };
  fields.forEach(([key, , type]) => {
    const value = document.getElementById(`field-${key}`).value;
    values[key] = type === 'number' ? Number(value || 0) : value;
  });
  if (collection === 'overtime') {
    values.month = normalizeMonth(values.month);
    values.amount = Math.round((Number(values.hours || 0) + Number(values.miscHours || 0)) * Number(values.rate || 0) * 100) / 100;
  }
  if (recordId) {
    state[collection] = state[collection].map((item) => item.id === recordId ? values : item);
  } else {
    state[collection].push(values);
  }
  render();
  save();
}

function deleteRecord(collection, recordId) {
  if (!confirm('Delete this record?')) return;
  state[collection] = state[collection].filter((item) => item.id !== recordId);
  render();
  save();
}

async function importExcelWithConfirmation() {
  if (hasRecords() && !confirm('Importing Excel will replace the current app records. Continue?')) return;
  const imported = await window.financeApi.importExcel();
  if (imported) {
    state = imported;
    render();
    setSaveState('Imported');
  }
}

function addQuickOtEntry(event) {
  event.preventDefault();
  const hours = Number(document.getElementById('otHours').value || 0);
  const miscHours = Number(document.getElementById('otMiscHours').value || 0);
  const rate = Number(document.getElementById('otRate').value || 0);
  const record = {
    id: id('ot'),
    year: Number(document.getElementById('otYear').value || currentYear()),
    month: normalizeMonth(document.getElementById('otMonth').value),
    day: Number(document.getElementById('otDay').value || 0),
    hours,
    miscHours,
    rate,
    amount: Math.round((hours + miscHours) * rate * 100) / 100,
    note: document.getElementById('otNote').value || ''
  };
  state.overtime.push(record);
  document.getElementById('otYearFilter').value = record.year;
  document.getElementById('otMonthFilter').value = record.month;
  document.getElementById('otDay').value = '';
  document.getElementById('otHours').value = '';
  document.getElementById('otMiscHours').value = '0';
  document.getElementById('otNote').value = '';
  render();
  save();
}

function bindEvents() {
  document.getElementById('nav').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-view]');
    if (button) switchView(button.dataset.view);
  });
  document.body.addEventListener('click', (event) => {
    const add = event.target.closest('[data-add]');
    if (add) openEditor(add.dataset.add, null);
    const edit = event.target.closest('[data-edit]');
    if (edit) {
      const item = state[edit.dataset.edit].find((record) => record.id === edit.dataset.id);
      openEditor(edit.dataset.edit, item);
    }
    const del = event.target.closest('[data-delete]');
    if (del) deleteRecord(del.dataset.delete, del.dataset.id);
  });
  ['dashboardYear', 'salaryYearFilter', 'detailsYearFilter', 'stockYearFilter', 'dailyMonthFilter', 'otYearFilter', 'otMonthFilter'].forEach((idName) => {
    document.getElementById(idName).addEventListener('change', render);
  });
  document.getElementById('otQuickForm').addEventListener('submit', addQuickOtEntry);
  document.getElementById('saveNow').addEventListener('click', save);
  document.getElementById('globalSearch').addEventListener('input', render);
  document.getElementById('importExcel').addEventListener('click', importExcelWithConfirmation);
  document.getElementById('setupImportExcel').addEventListener('click', importExcelWithConfirmation);
  document.getElementById('dataImportExcel').addEventListener('click', importExcelWithConfirmation);
  document.getElementById('startBlank').addEventListener('click', async () => {
    state = await window.financeApi.startBlank();
    render();
    setSaveState('Started');
  });
  document.getElementById('exportExcel').addEventListener('click', async () => {
    const output = await window.financeApi.exportExcel(state);
    if (output) setSaveState(`Exported: ${output}`);
  });
  document.getElementById('dataExportExcel').addEventListener('click', async () => {
    const output = await window.financeApi.exportExcel(state);
    if (output) setSaveState(`Exported: ${output}`);
  });
  document.getElementById('cancelDialog').addEventListener('click', () => document.getElementById('recordDialog').close());
  document.getElementById('recordForm').addEventListener('submit', (event) => {
    event.preventDefault();
    saveDialogRecord();
    document.getElementById('recordDialog').close();
  });
}

async function init() {
  state = await window.financeApi.load();
  bindEvents();
  render();
  switchView('dashboard');
  setSaveState('Ready');
}

init();

import { monthIndex, monthOptions, normalizeMonth } from './finance-calendar.mjs';

export function normalizeExpenseRecord(record) {
  const dateMatch = String(record?.date || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateMatch) {
    const monthNumber = Number(dateMatch[2]);
    return {
      ...record,
      date: dateMatch[0],
      year: Number(dateMatch[1]),
      month: monthOptions[monthNumber - 1]?.[0] || normalizeMonth(record.month),
      day: Number(dateMatch[3])
    };
  }
  const year = Number(record?.year || 0);
  const monthNumber = monthIndex(record?.month);
  const day = Math.max(1, Math.min(31, Number(record?.day || 1)));
  const date = year && monthNumber
    ? `${String(year).padStart(4, '0')}-${String(monthNumber).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    : '';
  return { ...record, date, year, month: normalizeMonth(record?.month), day };
}

export function migrateLoadedData(data, { empty, collections, makeId }) {
  const next = { ...empty, ...(data || {}) };
  next.meta = { ...empty.meta, ...(data?.meta || {}) };
  collections.forEach((collection) => {
    const records = Array.isArray(next[collection]) ? next[collection] : [];
    next[collection] = records
      .filter((record) => record && typeof record === 'object' && !Array.isArray(record))
      .map((record) => (record.id ? record : { ...record, id: makeId(collection) }));
  });
  next.salary = next.salary.map((record) => ({
    ...record,
    takeHome: Number(record.takeHome ?? record.actualSavings ?? 0)
  }));
  next.expenses = next.expenses.map(normalizeExpenseRecord);
  return next;
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { migrateLoadedData } from '../src/renderer/backup-migration.mjs';

const collections = [
  'salary', 'monthlyDetails', 'overtime', 'stockRevenue', 'daily', 'expenses',
  'personalBalances', 'salarySheets', 'unpaidBills'
];

function migrate(data) {
  const empty = { meta: { version: 1 } };
  collections.forEach((name) => { empty[name] = []; });
  return migrateLoadedData(data, {
    empty,
    collections,
    makeId: (name) => `${name}-generated`
  });
}

test('legacy salary becomes take-home and missing expenses remain empty', () => {
  const data = migrate({ salary: [{ year: 2026, month: 'Jan', actualSavings: 221000 }] });
  assert.equal(data.salary[0].takeHome, 221000);
  assert.deepEqual(data.expenses, []);
});

test('legacy split expense dates become ISO dates', () => {
  const data = migrate({ expenses: [{ year: 2026, month: 'January', day: 6, amount: 78000 }] });
  assert.equal(data.expenses[0].date, '2026-01-06');
  assert.equal(data.expenses[0].month, 'Jan');
});

test('an existing take-home value wins over the legacy savings field', () => {
  const data = migrate({ salary: [{ year: 2026, month: 'Feb', takeHome: 288000, actualSavings: 120000 }] });
  assert.equal(data.salary[0].takeHome, 288000);
});

test('rows without ids are named and invalid records are dropped', () => {
  const data = migrate({ salary: [null, 'bad', ['bad'], { year: 2026, month: 'Mar' }] });
  assert.equal(data.salary.length, 1);
  assert.equal(data.salary[0].id, 'salary-generated');
});

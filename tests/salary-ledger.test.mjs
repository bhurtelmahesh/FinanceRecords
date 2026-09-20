import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSalaryLedger } from '../src/renderer/salary-ledger.mjs';

test('bonuses share June and December expenses exactly once', () => {
  const ledger = buildSalaryLedger([
    { id: 'jun', year: 2026, month: 'Jun', salary: 300000, takeHome: 240000 },
    { id: 'summer', year: 2026, month: 'Bonus', salary: 500000, takeHome: 400000 },
    { id: 'dec', year: 2026, month: 'Dec', salary: 300000, takeHome: 240000 },
    { id: 'winter', year: 2026, month: 'Bonus 2', salary: 600000, takeHome: 480000 }
  ], [
    { year: 2026, month: 'Jun', amount: 100000 },
    { year: 2026, month: 'Dec', amount: 120000 }
  ]);
  assert.deepEqual(ledger.map(({ id, expenseTotal, actualSavings }) => ({ id, expenseTotal, actualSavings })), [
    { id: 'jun', expenseTotal: 100000, actualSavings: 140000 },
    { id: 'summer', expenseTotal: 0, actualSavings: 400000 },
    { id: 'dec', expenseTotal: 120000, actualSavings: 120000 },
    { id: 'winter', expenseTotal: 0, actualSavings: 480000 }
  ]);
  assert.equal(ledger.at(-1).cumulativeCapital, 1140000);
});

test('expense-only months remain calculated rows', () => {
  const ledger = buildSalaryLedger([
    { id: 'jan', year: 2026, month: 'Jan', salary: 300000, takeHome: 240000 },
    { id: 'mar', year: 2026, month: 'Mar', salary: 300000, takeHome: 240000 }
  ], [{ year: 2026, month: 'Feb', amount: 90000 }]);
  const feb = ledger.find((row) => row.month === 'Feb');
  assert.equal(feb.derivedFromExpenses, true);
  assert.equal(feb.actualSavings, -90000);
  assert.equal(ledger.at(-1).cumulativeCapital, 390000);
});

test('monthly expenses are deducted once even when imported rows have no ids', () => {
  const ledger = buildSalaryLedger([
    { year: 2026, month: 'Jun', salary: 300000, takeHome: 240000 },
    { year: 2026, month: 'Bonus', salary: 500000, takeHome: 400000 }
  ], [{ year: 2026, month: 'Jun', amount: 100000 }]);
  assert.deepEqual(ledger.map(({ expenseTotal, actualSavings }) => ({ expenseTotal, actualSavings })), [
    { expenseTotal: 100000, actualSavings: 140000 },
    { expenseTotal: 0, actualSavings: 400000 }
  ]);
});

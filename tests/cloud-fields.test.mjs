import assert from 'node:assert/strict';
import test from 'node:test';
import { cloudCollections, cloudRecordFields, forCloud } from '../src/renderer/cloud-fields.mjs';

test('desktop sync uses the same seven record collections as the web app', () => {
  assert.deepEqual(cloudCollections, ['salary', 'monthlyDetails', 'overtime', 'stockRevenue', 'daily', 'expenses', 'personalBalances']);
  assert.ok(cloudRecordFields.expenses.includes('date'));
  assert.ok(cloudRecordFields.salary.includes('takeHome'));
});

test('a record keeps allowed fields and reports desktop-only fields', () => {
  const { record, dropped } = forCloud('salary', {
    id: 'salary-1', year: 2026, month: 'Jan', salary: 300000, derivedFromDetail: true, stray: 1
  });
  assert.deepEqual(record, { id: 'salary-1', year: 2026, month: 'Jan', salary: 300000 });
  assert.deepEqual(dropped.sort(), ['derivedFromDetail', 'stray']);
});

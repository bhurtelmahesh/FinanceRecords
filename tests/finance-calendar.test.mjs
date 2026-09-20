import test from 'node:test';
import assert from 'node:assert/strict';
import { effectiveSalaryMonth, isBonusMonth, monthHasElapsed, monthIndex, normalizeMonth } from '../src/renderer/finance-calendar.mjs';

test('months are normalized consistently', () => {
  assert.equal(normalizeMonth('january'), 'Jan');
  assert.equal(normalizeMonth('  MAR '), 'Mar');
  assert.equal(normalizeMonth('9'), 'Sep');
  assert.equal(monthIndex('December'), 12);
  assert.equal(monthIndex('nonsense'), 0);
});

test('bonuses use June and December as effective months', () => {
  const records = [
    { id: 'summer', year: 2026, month: 'Bonus' },
    { id: 'winter', year: 2026, month: 'Bonus 2' }
  ];
  assert.ok(isBonusMonth('賞与'));
  assert.equal(effectiveSalaryMonth(records[0], records), 'Jun');
  assert.equal(effectiveSalaryMonth(records[1], records), 'Dec');
  assert.ok(monthHasElapsed(records[0], 2026, records, new Date('2026-07-15T00:00:00Z')));
  assert.ok(!monthHasElapsed(records[1], 2026, records, new Date('2026-07-15T00:00:00Z')));
});

test('an ordinary month is measured against the calendar', () => {
  const now = new Date('2026-09-19T00:00:00Z');
  assert.ok(monthHasElapsed({ year: 2026, month: 'Sep' }, 2026, [], now));
  assert.ok(!monthHasElapsed({ year: 2026, month: 'Oct' }, 2026, [], now));
  assert.ok(monthHasElapsed({ year: 2025, month: 'Dec' }, 2025, [], now));
  assert.ok(!monthHasElapsed({ year: 2027, month: 'Jan' }, 2027, [], now));
});

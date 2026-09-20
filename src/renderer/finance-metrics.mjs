export function expenseTotalForPeriod(expenses, year, month, normalizeMonth = (value) => value) {
  const wantedMonth = normalizeMonth(month);
  return (expenses || [])
    .filter((item) => Number(item.year) === Number(year) && normalizeMonth(item.month) === wantedMonth)
    .reduce((total, item) => total + Number(item.amount || 0), 0);
}

export function calculateSavings(takeHome, expenseTotal) {
  return Number(takeHome || 0) - Number(expenseTotal || 0);
}

export function stockPerformanceTone(actual, target, hasRecord = true) {
  if (!hasRecord) return { gap: 0, performance: 0, hue: 205 };
  const gap = Number(actual || 0) - Number(target || 0);
  const targetScale = Math.max(Math.abs(Number(target || 0)), 1);
  const performance = Math.max(-1, Math.min(1, (gap / targetScale) / 0.25));
  return { gap, performance, intensity: Math.abs(performance), hue: gap < 0 ? 0 : 125 };
}

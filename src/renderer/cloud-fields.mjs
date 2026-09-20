export const cloudRecordFields = {
  salary: ['id', 'year', 'month', 'salary', 'takeHome', 'plannedSavings', 'expenseTotal', 'actualSavings', 'cumulativeCapital', 'savingsRate', 'note'],
  monthlyDetails: ['id', 'year', 'month', 'basic', 'allowance', 'overtimePay', 'transportation', 'grossTotal', 'insurance', 'pension', 'employmentInsurance', 'residentTax', 'incomeTax', 'totalDeduction', 'received'],
  overtime: ['id', 'year', 'month', 'day', 'hours', 'miscHours', 'rate', 'amount', 'note'],
  stockRevenue: ['id', 'year', 'month', 'targetCumulative', 'actualCumulative', 'monthlyRevenue', 'surplus', 'verdict'],
  daily: ['id', 'year', 'month', 'day', 'amount', 'status', 'note'],
  expenses: ['id', 'date', 'year', 'month', 'day', 'category', 'amount', 'note'],
  personalBalances: ['id', 'group', 'dateOrLabel', 'amount', 'note']
};

export const cloudMetaFields = ['version', 'startedAt', 'importedAt', 'sourceFile', 'updatedAt'];
export const cloudCollections = Object.keys(cloudRecordFields);

export function forCloud(collectionName, record) {
  const allowed = cloudRecordFields[collectionName] || [];
  const kept = {};
  const dropped = [];
  Object.keys(record || {}).forEach((key) => {
    if (allowed.includes(key)) kept[key] = record[key];
    else dropped.push(key);
  });
  return { record: kept, dropped };
}

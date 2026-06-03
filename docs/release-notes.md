# Finance Records Release Notes

## Version 1.0.0

Finance Records is a desktop finance tracker for macOS. It brings salary, savings, overtime, stock revenue, daily records, debt records, and document archives into one app.

### Main Features

- Dashboard with total net income, actual savings, stock win total, and outstanding debt KPIs.
- Charts for net income vs savings and stock win target progress.
- Monthly Savings page for annual/monthly income and savings tracking.
- Salary Details page for salary, deductions, resident tax, income tax, and net received values.
- Overtime page with daily overtime entry, extra overtime, hourly-rate calculation, and payroll-style monthly summary.
- Stock Revenue page with target cumulative, actual win cumulative, monthly win, target comparison, and result mark.
- Daily Records page with month/day grid entry, weekend marking, invalid-day blocking, monthly totals, and annual total.
- Debt Records page for lender, due date/name, debt amount, notes, and unpaid bill file archive.
- Backup & Import page for workbook import/export, demo data, clear all data, and salary sheet file archive.
- File archive support for salary sheets and unpaid bills.
- Preview support for PDF/image files and Open support for all stored files.
- Clear All Data flow warns users to export a backup before deleting data.

### Storage And Backup

- Records are saved in the app data folder on the Mac.
- Salary sheet files are copied into the app data folder.
- Unpaid bill files are copied into the app data folder and named from the original file name.
- Excel export creates a backup workbook.
- Import replaces current records with the selected workbook data.

### App Store / Publishing Readiness

- Production app icon added.
- Renderer security hardened with context isolation, disabled Node integration, sandboxing, navigation blocking, and Content Security Policy.
- User data files are excluded from the packaged app.
- Demo data and publish-preview support are available for screenshots and checks.

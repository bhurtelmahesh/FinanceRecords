# Finance Records Release Notes

## Unreleased

Brings across the web app's dashboard and search improvements.

- Dashboard charts are redrawn as lines on round-number axes. Salary shows gross income and take-home, with take-home turning red below half of gross; Stock shows actual against target, green above and red below, with the gap shaded. Months still to come are dashed, bonuses have their own column, and hovering a month shows its figures.
- The charts zoom like a trading chart: scroll or pinch to zoom in on a few months, drag to move along the year, double-click or Reset to see the whole year. Zoomed in, the axis fits the months in view.
- A bonus now counts as projected until the month it is paid, so an unpaid December bonus no longer shows in the "so far" totals, the projected tags or the workbook Summary sheet.
- Search covers the Help page as well as the records, and opens a Help result at the matching entry.
- Menu items look like buttons at rest and take a clear hover colour. Help spans the window and explains how to read and zoom the charts.

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

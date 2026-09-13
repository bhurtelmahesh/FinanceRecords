# Finance Records User Manual

## 1. Getting Started

When Finance Records opens for the first time, choose one of the setup actions.

- **Start Blank**: Starts with empty records.
- **Import Workbook**: Imports an existing workbook and replaces current app records.

After setup, records are saved in the app automatically when changes are made. The top-right status shows whether the app is ready, saving, or saved.

## 2. Dashboard

The Dashboard gives a summary of the selected year. Each figure is a button that opens the section it comes from.

Functions:

- **Year selector**: Changes the year shown in the dashboard charts and figures.
- **Salary · Gross Income**: Gross pay for the months that have already happened, including any bonus already paid. While months are still to come, the caption gives the projected full-year figure.
- **Salary · Take-home Saved**: The same split for what reached you after deductions.
- **Stock · Win Total**: The latest Actual Win Cumulative recorded that year, with that month's target in the caption.
- **Outstanding Debt**: All debt records added together, with the number of records and lenders.
- **Salary chart**: Gross income (blue) and take-home (green) for each month and bonus. Take-home turns red, marked ▼, in any month it falls below half of gross pay. Each bonus has its own shaded column. The axis runs from about ¥50k below the lowest month to ¥50k above the highest, rather than from zero.
- **Stock chart**: Actual win cumulative against the target (gold). Actual is green, marked ▲, on or above target and red, marked ▼, below it, with the gap between the two lines shaded to match.
- Months still to come are drawn dashed with hollow markers. Hover over a month to see its figures.

A bonus counts as received from the month it is paid: the year's first bonus from June, a later one from December. Until then it is projected, like a month that has not happened yet.

Zooming the charts:

- Scroll or pinch over a chart, or use the magnifier buttons, to zoom in on the months around the pointer.
- Drag sideways to move along the year while zoomed in.
- Double-click the chart or press **Reset** to see the whole year again. Changing the year does the same.
- Zoomed in, the axis fits the months in view, so small differences are easier to see.

## 3. Monthly Savings

Use Monthly Savings to view and edit income and savings records.

Functions:

- **Year filter**: Shows records for one year or all years.
- **Add Manual Income**: Adds a new monthly savings record.
- **Edit**: Updates an existing row.
- **Delete**: Removes a row.

Main fields:

- Year
- Month
- Net Income
- Savings Goal
- Actual Savings
- Cumulative Capital

## 4. Salary Details

Use Salary Details to manage payroll information for each month.

Functions:

- **Year filter**: Shows salary detail records for one year or all years.
- **Add Salary Detail**: Adds a salary detail row.
- **Edit**: Updates salary, deduction, and received amount details.
- **Delete**: Removes a salary detail row.

Main fields:

- Basic
- Allowance
- Overtime Pay
- Transportation
- Gross Total
- Health Insurance
- Pension
- Employment Insurance
- Residence Tax
- Income Tax
- Total Deduction
- Net Received

## 5. Overtime

Use Overtime to enter daily overtime and calculate overtime pay.

Functions:

- **Daily Overtime Entry**: Adds overtime by year, month, day, hours, extra overtime, hourly rate, and note.
- **Add Daily OT**: Saves the entered overtime record.
- **Year/month filter**: Changes the monthly overtime summary.
- **Edit Salary Detail**: Opens the salary detail record for the selected overtime month.
- **Edit/Delete row**: Updates or removes individual overtime entries.

Calculation:

- Overtime amount is calculated from total overtime hours multiplied by hourly rate.
- Total overtime hours are daily OT plus extra OT.
- Monthly payroll summary reflects overtime amount, salary values, deductions, and amount received.

## 6. Stock Revenue

Use Stock Revenue to track target and actual stock win progress.

Functions:

- **Year selector**: Shows stock revenue records for the selected year.
- **Target Cumulative**: Enter the planned cumulative target.
- **Actual Win Cumulative**: Enter the actual cumulative win value.
- **Monthly Win**: Calculated from actual cumulative changes.
- **Vs Target**: Calculated from actual cumulative minus target cumulative.
- **Result**: Shows pass/fail mark based on target comparison.

Color rule:

- Positive money values are shown in red.
- Negative money values are shown in green.

## 7. Daily Records

Use Daily Records to enter daily money records in a month/day grid.

Functions:

- **Year filter**: Selects the year.
- **Month filter**: Shows all months or one month.
- **Editable day cells**: Enter values directly into weekday cells.
- **Monthly Total**: Sums each month.
- **Annual Total**: Sums all monthly totals.

Grid behavior:

- Saturday and Sunday cells are marked and not editable.
- Invalid dates, such as February 31, are disabled.
- Positive values are red.
- Negative values are green.

## 8. Debt Records

Use Debt Records to manage unpaid debts and bill documents.

Functions:

- **Add Debt Record**: Adds lender, due date/name, debt amount, and note.
- **Edit**: Updates an existing debt record.
- **Delete**: Removes a debt record.
- **Add Bill Files**: Selects unpaid bill files from the Mac.
- **Drop unpaid bills here**: Drag and drop bill files into the archive.
- **Saved bill files**: Shows all uploaded bill files.
- **Preview**: Opens a preview inside the app for image/PDF files.
- **Open**: Opens any saved file using the Mac's normal file-opening behavior.
- **Delete**: Removes the saved file from the archive.

Bill upload flow:

1. Add or drop a bill file.
2. The app saves it using the file name as the bill title.
3. The file appears under **Saved bill files**.
4. Use Preview or Open to view the file later.

## 9. Backup & Import

Use Backup & Import for workbook backup, restore, demo data, clear all data, and salary sheet archive.

Functions:

- **Import Workbook**: Imports a workbook and replaces current records.
- **Export Excel Backup**: Saves current app data into an Excel backup.
- **Load Demo Data**: Loads sample records.
- **Clear All Data**: Deletes current records and archived salary/bill files from the app data folder.
- **Add Files**: Selects salary sheet files from the Mac.
- **Drop salary sheets here**: Drag and drop salary sheet files into the archive.
- **Saved salary files**: Shows all uploaded salary files.
- **Preview**: Opens a preview inside the app for image/PDF files.
- **Open**: Opens any saved file using the Mac's normal file-opening behavior.
- **Delete**: Removes the saved file from the archive.

Salary sheet upload flow:

1. Add or drop a salary sheet file.
2. The file appears under **Saved salary files**.
3. Use Preview or Open to view the file later.

Important:

- Before using **Clear All Data**, export a backup and keep it somewhere safe.
- Importing a workbook replaces current app records.

## 10. Search

Use the top-right search box to search every record and the Help page at once.

Functions:

- Results appear as you type words or numbers, grouped by section, with Help listed last.
- Choose a result to open its section with the matching row highlighted. A Help result opens Help at the matching entry.
- Press Escape or clear the search box to close the results.

## 11. Save

Use the **Save** button to manually save current records.

The app also saves after most edits. The save status appears near the Save button.

## 12. File Viewing Summary

Already uploaded files can be viewed from these places:

- Salary files: **Backup & Import → Salary Sheet Archive → Saved salary files**
- Bill files: **Debt Records → Unpaid Bills Archive → Saved bill files**

Available actions:

- **Preview**: Available for image/PDF files.
- **Open**: Available for all saved files.
- **Delete**: Removes the saved file.

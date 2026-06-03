# Finance Records

macOS finance records app for income, savings, debt, overtime, stock wins, daily records, and document archives.

## Open The App

Run:

```bash
npm start
```

Or double-click:

```text
start-finance.command
```

## Build The App

Create an unpacked local build:

```bash
npm run pack
```

Create a ZIP for direct Mac distribution:

```bash
npm run dist
```

Create a Mac App Store build after adding Apple signing assets:

```bash
npm run dist:mas
```

## What It Includes

- Dashboard with salary, savings, stock revenue, and debt KPIs
- Financial snapshot insights
- Salary and savings records
- Monthly salary details with allowances, overtime, deductions, and received amount
- Overtime records
- Stock revenue target and actual tracking
- Daily records
- Debt records
- Salary sheet archive
- Unpaid bills archive with PDF/image preview
- Optional Excel workbook import
- Optional Excel export backup from the current app data
- Start blank option for new users
- Demo data option for screenshots and evaluation
- Clear all data option with backup warning
- Search across records

## Data Storage

The app saves local records in:

```text
~/Library/Application Support/Finance Records/finance-data.json
```

During development, if an older `finance-data.json` exists in this project folder, the app copies it into the app data folder on first launch.

For release screenshots or clean testing, run:

```bash
npm run publish:preview
```

This uses a separate empty app data folder and does not load development records.

## App Store Preparation

App Store metadata drafts and submission notes are in:

```text
docs/app-store/
```

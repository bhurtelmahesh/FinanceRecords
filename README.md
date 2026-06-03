# Finance Records

Independent local macOS finance records app. It can import your old `Salary.xlsx` once, but day-to-day use is inside the app.

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

Create a DMG/ZIP for direct Mac distribution:

```bash
npm run dist
```

Create a Mac App Store build after adding Apple signing assets:

```bash
npm run dist:mas
```

## What It Includes

- Dashboard with salary, savings, stock revenue, and personal balance KPIs
- Financial snapshot insights
- Salary and savings records
- Monthly salary details with allowances, overtime, deductions, and received amount
- Overtime records
- Stock revenue target and actual tracking
- Daily records
- Personal balance records
- Optional Excel import from `Salary.xlsx`
- Optional Excel export backup from the current app data
- Start blank option for new users
- Search across records

## Data Storage

The app saves local records in:

```text
~/Library/Application Support/Finance Records/finance-data.json
```

Your original `Salary.xlsx` can remain in the same folder, but the app does not depend on Excel after import.

During development, if an older `finance-data.json` exists in this project folder, the app copies it into the app data folder on first launch.

## App Store Preparation

App Store metadata drafts and submission notes are in:

```text
docs/app-store/
```

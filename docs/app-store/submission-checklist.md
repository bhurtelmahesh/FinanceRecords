# Finance Records - App Store Readiness Checklist

## Done In Project

- Production app icon added.
- Electron Builder packaging config added.
- Mac App Store target added.
- Sandbox entitlements added for MAS builds.
- Direct distribution target added for DMG/ZIP builds.
- User data files excluded from packaged app: `finance-data.json`, archived documents, and exported backups.
- App database moved to Electron `userData` storage.
- Clean publishing preview command added for screenshots and release checks.
- Demo data and clear-all controls added for publish/screenshot preparation.
- Clear-all flow warns users to export a backup before deleting records.
- Renderer security hardened with context isolation, disabled Node integration, renderer sandbox, web security, blocked popup windows, blocked unexpected navigation, and a Content Security Policy.
- App Store metadata draft added.
- Privacy policy draft added.

## Required From Apple Developer Account

- Apple Developer Program membership.
- Bundle ID: `com.mahesh.finance-records`.
- Mac App Store signing certificate.
- Mac App Store provisioning profile saved as `embedded.provisionprofile` in the project root.
- App Store Connect app record.
- Privacy policy URL.
- Support URL.
- Final App Store screenshots.
- Final support contact in metadata and privacy policy.
- Final privacy answers in App Store Connect. Current app design: no analytics, no tracking, no external data transmission during normal use.

## Pre-Upload Checks

- Run syntax checks:

```bash
node -c src/main.js
node -c src/preload.js
node -c src/renderer/renderer.js
```

- Run local package check:

```bash
npm run pack
```

- Open the packaged app and verify:
  - dashboard charts render
  - Save works
  - Import Workbook and Export Backup work through file dialogs
  - salary sheet archive accepts files
  - unpaid bill archive accepts files and previews image/PDF files
  - Load Demo Data works
  - Clear All Data warns about backup and clears records
  - no personal records are included in a fresh publishing preview

## Build Commands

Development:

```bash
npm start
```

Unsigned package check:

```bash
npm run pack
```

Direct Mac distribution:

```bash
npm run dist
```

Mac App Store build:

```bash
npm run dist:mas
```

Unsigned MAS structure check:

```bash
npm run dist:mas-dev
```

## App Store Review Notes

Use the review notes from `app-store-metadata.md`.

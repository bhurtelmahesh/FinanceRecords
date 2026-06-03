# Finance Records - App Store Readiness Checklist

## Done In Project

- Production app icon added.
- Electron Builder packaging config added.
- Mac App Store target added.
- Sandbox entitlements added for MAS builds.
- Direct distribution target added for DMG/ZIP builds.
- Personal files excluded from packaged app: `Salary.xlsx`, `finance-data.json`, and exported backups.
- App database moved to Electron `userData` storage.
- Existing development data migration added from `Documents/Finance/finance-data.json`.
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


## Why

The digest page v2 design (LAB-3287 item 19) has a Past issues card. LAB-3294 records each member's sent issues (backend #3730, notification service #157), so the page can list them and open an older one.

## What Changes

- "Past issues" side card, ported from the digest-web prototype's PastIssuesCard.
- `/digest` reads `issue` and passes it to the page read and to More / Less.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `digest`: Past issues.

## Impact

`app/digest/page.tsx`, `components/page/digest/` (new `DigestPastIssuesCard`), `services/digest/`.

## Why

The digest page v2 (LAB-3292, item 13 of LAB-3287) shows "Upcoming events", as in the digest-web prototype's DigestEvents.

## What Changes

- New section "Upcoming events" from the page read's new `events` field; hidden when empty. A backend without the field reads as empty.
- Rows open the event drawer (signed in, flag on) or the event in All Events, as on Home's rail; "See all N events".
- New events `digest-event-clicked`, `digest-events-see-all-clicked`; the drawer's `source` gains `digest`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `digest`: Upcoming events; Digest page events.
- `events`: Event drawer analytics (`digest` source).

## Impact

`components/page/digest/DigestEvents.tsx`, `DigestPage.tsx`, `services/digest/*`, `analytics/digest.analytics.ts`, `analytics/events.analytics.ts`, `utils/constants.ts`.

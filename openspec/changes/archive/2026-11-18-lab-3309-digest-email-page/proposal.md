## Why

The digest email footer (Manage preferences, Switch to weekly / daily, Unsubscribe) opens `/settings/email`, which needs sign-in. A signed-out reader lands on the home page and waits several seconds for the sign-in dialog, so the links look broken, and unsubscribing needs an account sign-in (LAB-3309). The email's signed link already works without sign-in on `/digest`; the backend now lets it read and change the reader's digest email settings (LAB-3310).

## What Changes

- New page `/digest/email?t=<link token>`: the reader's digest email, on or off and daily or weekly, without sign-in.
- The footer links open it with an action (`link_type=unsubscribe`, `switch_frequency` with `to`, or `manage`). The action becomes the page's main button; nothing changes until it is pressed, because mail scanners open links on their own.
- After a change the page confirms it and offers Undo. "All email preferences" leads to `/settings/email` (sign-in), and "Read your digest" back to `/digest?t=`.
- Expired, broken and unavailable links get their own message, like the digest page.
- New PostHog events for the page; the link token is already stripped from every recorded URL.

## Capabilities

### Modified Capabilities

- `digest`: a second page under `/digest` for the reader's digest email settings, and its events.

## Impact

- `app/digest/email/page.tsx`, `components/page/digest/email/` (page, styles), `services/digest/digest.service.ts` and `digest.types.ts` (read and change calls), `analytics/digest.analytics.ts`, `utils/constants.ts` (event names).
- Depends on the backend endpoints of LAB-3310. The notification service starts linking here in LAB-3311.

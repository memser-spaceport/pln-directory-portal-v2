# Proposal

## Why

LAB-3271 (https://linear.app/protocollabs/issue/LAB-3271): in the event drawer, "Yes, I'm going" sits in the going card after the description. A long description pushes it out of view. The drawer does not show the event's own page beside the date. Home event rows do not say how many people are going. Signed-out visitors cannot open the drawer.

## What Changes

- "Yes, I'm going" moves from the going card to a sticky footer in the event step (`EventDrawerView`). The footer goes away once the viewer is going.
- `EventSummary` shows the event's `websiteUrl` as a link row under the date and the address, in a new tab. No `http`/`https` page, no row.
- Home rows open the drawer for signed-out visitors too (flag on). Signed out, "Yes, I'm going" and the people count close the drawer and open the sign-in modal (`useLoginRedirect`).
- `IHomeEvent` gets an optional `goingCount`. The rail shows "N going" when it is 1 or more. The backend adds `goingCount: number | null` to `GET /v1/irl/events/upcoming` (Felix, memser-spaceport/pln-directory-portal#3725; `null` for invite-only events). Until it deploys, or for `null`, the rail shows no count.

## Impact

- Code: `components/page/events/EventDrawer/` (`EventDrawerView`, `EventDrawer`, `EventSummary`, `RsvpCard`, `EventDrawer.module.scss`), `components/page/home/HomeV2/EventsSection.tsx`, `services/events/events.service.ts`, `services/events/hooks/useUpcomingEvents.ts`, `types/home.types.ts`.
- No new analytics events. No auth code changes: sign-in uses the existing `useLoginRedirect`.

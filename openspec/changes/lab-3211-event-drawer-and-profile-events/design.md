# Design

## Context

See proposal.md (Why) for motivation. The current state that shapes the approach:

- **No event drawer exists in this repo.**
  - The "EVENT DETAILS / Host / Agenda" panel members know is the external pln-events app, inside the `/events/all` iframe (`components/page/events/schedule-section`).
  - Home rows are links to `/events/all?embedPath=/embed/calendar#<slug>` (`HomeV2/EventsSection.tsx`).
  - The drawer is new code. The prototype `prototypes/entries/member-events-going/` (`GatheringModal.tsx`, `EventDetails.tsx`) is its source of truth for layout, copy and states.
- **Reusable production parts:**
  - `components/common/Drawer`: portal, framer-motion slide-in, Escape on `document`.
  - `components/common/Modal` (portals to `body`), `ConfirmDialog`, `DetailsSection`.
  - The presentational parts of `components/core/UpdatesPanel/IrlGatheringModal/`: `PlanningSection`, `DatePickerView`, `TopicsPickerView`, `EventsPickerView`, `AdditionalDetailsSection`, `GatheringDetails`, the `useIrlGatheringModal` picker hook and the `IrlGatheringFormData` types. They render from props; the prototype already imports them.
  - We do **not** reuse `useIrlGatheringSubmit`: it saves `events: []` (gathering-level) and uses PUT, which replaces the member's whole event set.
- **Permission:** `useIrlGoingAccess()` gives `canWrite` (`irlg.going.write` or `directory.admin.full`). Most founders have it; investors (`investor_pl`) only have read, and job aspirants have neither.
- **Today's profile data:**
  - The member profile renders IRL contributions from `member.eventGuests` (`member-irl-contributions.tsx`, inside `MemberDetailsPage.tsx`).
  - The team page renders `team-irl-contributions.tsx` from `team.eventGuests` + `team.associations`.
  - Neither has upcoming/past, visibility, faces or Demo Day. The new endpoints from the BE change provide them.
- **Home's rail** is server-fetched in `app/home/page.tsx` (`getUpcomingEvents` → `IHomeEvent`) and only exists in Home v2 (`SHOW_HOME_V2`).

## Goals / Non-Goals

**Goals:**
- One `EventDrawer` component used by the member profile, team profile, Home rail and the owner's Add event picker.
- Attendance saved per event, without ever replacing the member's other rows.
- The profiles' past events stay in the server HTML (public, useful to crawlers); upcoming events never are.

**Non-Goals:**
- A global drawer mounted in the root layout, or URL state (`?event=`).
- Changing `IrlGatheringModal`'s own flow, or `/events/irl`.

## Decisions

### D1. A build-time flag module, mocked in tests

`utils/event-drawer.ts` exports `SHOW_EVENT_DRAWER = process.env.NEXT_PUBLIC_SHOW_EVENT_DRAWER === 'true'`, like `utils/home-v2.ts`. Turbopack inlines it, so tests mock the module, not `process.env`. The flag is added to `.env.example`. *Alternative:* a server-side UI flag. Rejected: this is a rollout switch for a whole UI, and the repo's pattern for those is a `NEXT_PUBLIC_SHOW_*` flag.

### D2. Each page owns its drawer state; one shared component

`<EventDrawer eventUid source initialStep onClose onGoing />` is rendered by each host (member Events section, team Events section, Home `EventsSection`, owner picker) from local `useState`, as the prototype does. The host shows the toast via `onGoing({ eventName, showOnProfile })`, because the toast copy and link differ per page (Home adds "View profile").

*Alternative:* a Zustand store and one host mounted in the root layout via `ClientDynamics`. Rejected for v1: no deep links are planned, and a root mount costs every page the drawer's chunk. Revisit with Option B, which needs prev/next across lists.

### D3. Client service and React Query hooks under `services/events/`

The service is `event-drawer.service.ts`, with query keys in `services/events/constants.ts`:

| Hook | Call | Key |
|---|---|---|
| `useEventDetail(uid)` | `GET /v1/irl/events/:uid` | `[EVENT_DETAIL, uid]` |
| `useEventAttendees(locationUid, eventUid, search)` | strict guests list, infinite | `[EVENT_ATTENDEES, eventUid, search]` |
| `useMemberEvents(memberUid)` | `GET /v1/members/:uid/events` | `[MEMBER_EVENTS, memberUid, viewerUid]` |
| `useTeamEvents(teamUid)` | `GET /v1/teams/:uid/events` | `[TEAM_EVENTS, teamUid, viewerUid]` |
| `useUpcomingEvents` (exists) | `GET /v1/irl/events/upcoming?days=365&limit=50` | existing, reused by the Add event picker |

Authenticated calls go through `customFetch`. Every hook is gated on `!!currentUser` where the call needs a viewer, so `customFetch`'s reload-on-401 can't loop.

The mutations are:
- `useMarkGoing`: POST create with `events: [{uid, roles}]` and `showOnProfile`.
- `useRemoveGoing`: per-event delete.
- `useSetShowOnProfile`: the toggle.
- `useSavePlans`: see D4.

Each invalidates `EVENT_DETAIL`, `EVENT_ATTENDEES`, `MEMBER_EVENTS` for the viewer and `TEAM_EVENTS`.

### D4. Saving plans is a diff, never PUT

On Save, the drawer compares the gathering's events the member was going to with the ones now ticked:
- **Added** events → create (one call, `events: [...]`).
- **Removed** events → per-event delete.
- **Kept** events whose role changed, or a change to the shared details (dates, topics, Telegram, office hours, notes) → `PATCH /v1/irl/locations/:uid/guests/me` (BE D12), which updates roles and shared details in place.

This keeps `showOnProfile` and rows at other gatherings untouched. PUT would delete and recreate every event row in the window, resetting `showOnProfile` to its default.

### D5. Past events in server HTML, upcoming on the client

`app/members/[id]/page.tsx` and `app/teams/[id]/page.tsx` fetch `…/events` once on the server **without** the viewer's token, so the response holds past events only. They pass `past` to the section as a prop. On the client, `useMemberEvents` / `useTeamEvents` fetch with the viewer's token and take over once resolved. They don't use React Query `initialData`, because of the "first observer wins" trap: the server list is rendered directly until the query has data. This keeps the existing "Server HTML carries only public data" requirement true.

### D6. Placement waits for the viewer's data

`MemberDetailsPage` renders the section in the high slot (under Office Hours) when `isOwner || visibleUpcoming.length > 0`, and in the old slot otherwise. For a signed-in non-owner, the section can move up once `useMemberEvents` resolves. This is accepted: the alternative of always placing it high shows an empty-looking section above contact details for most members.

### D7. Escape and stacking follow the prototype

While a picker, the attendee list or the ConfirmDialog is open, the Drawer gets a no-op `onClose`. Only the top layer handles Escape and backdrop clicks. Pickers and the attendee list are rendered as **siblings** of `<Drawer>`, not inside it: the Drawer's container is a transformed `motion.div`, and a `position: fixed` child inside a transformed ancestor is positioned against that ancestor.

### D8. Copy and states come from the prototype

The prototype's strings are used as written:
- "Are you going to <event>?", "Let others know if you are attending."
- "Show on my profile", "Signed-in members will see <event> on your profile."
- "No" / "Yes, I'm going", "Skip" / "Cancel" / "Save"
- "N People going", "N going to <event>", "Search by name or team", "Nobody going matches that search."
- "Add an event you're going to", "Search by event or city", "No upcoming events match that search."
- "No upcoming events on your profile yet.", "Only visible to you", "You're going too"
- "Remove <event>?", "Removed <event>."
- "<event> is on your profile.", "You're going to <event>."

Tests use these strings as sentinels.

### D9. Analytics

Event names go in a new `EVENT_DRAWER_ANALYTICS` block in `utils/constants.ts` (`ON_*` keys), with functions in `analytics/events.analytics.ts` (`useEventsAnalytics`). The event names are in the `events` and `profiles` spec deltas. Home keeps `home-event-clicked`.

### D10. The past card's city

City = the event location's text up to its first comma, or no city when the text is empty. The BE change returns a `city` field with this rule applied; the FE does not re-derive it.

### Assumed backend contract (confirm against the BE change `lab-3211-per-event-attendance`)

```ts
// GET /v1/irl/events/:uid  (auth optional; viewerGoing only when signed in)
interface EventDetail {
  uid: string; name: string; slugURL: string; externalId: string | null;
  startDate: string; endDate: string; type: 'IN_PERSON' | 'VIRTUAL' | 'INVITE_ONLY' | null;
  logoUrl: string | null; bannerUrl: string | null; description: string | null;
  websiteUrl: string | null; registrationUrl: string | null;
  // from additionalInfo, filled by the sync (LAB-3214); empty when unknown
  format: 'IN_PERSON' | 'VIRTUAL' | 'HYBRID' | null;
  access: 'PAID' | 'FREE_WITH_RSVP' | 'INVITE_ONLY' | null;
  tags: { name: string; color?: string }[];
  hosts: { name: string; logoUrl?: string }[];
  address: string | null; region: string | null;
  agenda: { day: string; items: { time: string; title: string; about?: string }[] }[];
  location: { uid: string; name: string; city: string; timezone: string | null; flag: string | null;
              resources: { type: string; name: string; link: string }[]; scheduleUrl: string | null;
              events: { uid: string; name: string; startDate: string; endDate: string; websiteUrl: string | null }[] };
  goingCount: number;
  faces: { uid: string; name: string; imageUrl: string | null }[]; // up to 3
  viewer: { going: boolean; showOnProfile: boolean; roles: ('Host'|'Speaker'|'Sponsor')[] } | null;
}

// GET /v1/irl/locations/:locationUid/guests?eventUid=<uid>&strict=true&search=&page=&limit=
//   rows: { memberUid, member{name,imageUrl}, team{name}|null, role|null, eventRoles: ('Host'|'Speaker'|'Sponsor')[] }, plus total

// POST /v1/irl/locations/:locationUid/guests  { ..., events: [{uid,isHost,isSpeaker,isSponsor}], showOnProfile }
// POST /v1/irl/locations/:locationUid/events/guests  { membersAndEvents: [{ memberUid, events: [eventUid] }] }  -> deletes only those
// PATCH /v1/irl/events/:uid/me  { showOnProfile }  (toggle, BE D2)
// PATCH /v1/irl/locations/:uid/guests/me  { topics?, reason?, telegramId?, officeHours?, teamUid?, additionalInfo?, events?: [{uid, isHost?, isSpeaker?, isSponsor?, *SubEvents?}] }  (plans, BE D12)
// update details at a location (roles of kept events, dates, topics, telegram, officeHours, reason) — exact path per BE change

// GET /v1/members/:uid/events   and   GET /v1/teams/:uid/events
interface ProfileEvent {
  uid: string; name: string; startDate: string; endDate: string;
  locationUid: string | null; city: string | null;
  roles: ('Host'|'Speaker'|'Sponsor')[];
  goingCount: number; faces: { uid: string; name: string; imageUrl: string | null }[];
  viewerGoing: boolean;
  showOnProfile?: boolean;              // member endpoint, owner only
  teamGoingCount?: number;              // team endpoint: "N from <team>"
}
interface ProfileEvents {
  upcoming: ProfileEvent[];             // [] for signed-out viewers
  past: ProfileEvent[];
  demoDay?: { title: string; slug: string; date: string } | null; // team endpoint only
}

// GET /v1/irl/events/upcoming adds locationUid: string | null per event
```

## Risks / Trade-offs

- [The drawer's Escape listener is on `document`, and so is the Modal's. A child modal doesn't stop the drawer from closing.] → D7: the no-op `onClose` while a layer is open, plus a test that Escape in a picker leaves the drawer open.
- [A fixed-position layer inside the transformed drawer is misplaced.] → D7: siblings, not children.
- [`Drawer` chrome can center bare text nodes.] → Wrap every text in an element. Check in the browser at 375px and 1280px, since DOM tests can't see it.
- [The `react-hooks/refs` lint rule fails on `ref.current` read in render.] → Use state for any measured value.
- [DS token fallbacks are what actually paints.] → When porting the prototype's SCSS, keep each `var(--token, fallback)` fallback as written.
- [The global `useQuery` jest mock ignores `select`.] → Hook tests assert raw data, or mock the service, not the hook.
- [Placement jump for signed-in viewers (D6).] → Accepted. The section is mid-page, so the shift is below the fold on desktop.
- [BE contract drift: the FE is written against the assumed shapes above.] → Tasks 1.x land the service layer first, and it's checked against the BE branch on the `lab-3211` feature env before the UI tasks.
- [Members without `irlg.going.write` (investors, job aspirants) can't mark attendance.] → By decision. They see the event and attendees. Widening RBAC is a separate scope call.
- [Prototype vs ticket on footer buttons.] → The ticket says "no Save or Cancel buttons". The prototype (2026-11-11) has "No / Yes, I'm going" and then "Skip|Cancel / Save" in the plans step, because the plans need a submit. We follow the prototype, as the ticket says to on conflicts, and flag it to Polina in design review.

## Migration Plan

- Ship dark: `NEXT_PUBLIC_SHOW_EVENT_DRAWER` is unset everywhere except the `lab-3211` feature env (`directory_portal` extra env).
- The BE change must be on `lab-3211` (BE) before the env is deployed.
- Rollback = unset the flag and redeploy. The old IRL contributions block and team Contributions tiles are still in the code behind the flag.
- Once the flag is on in prod and stable, a follow-up removes `member-irl-contributions.tsx`, `team-irl-contributions.tsx` and the flag.

## Open Questions

- Resolved: toggle = `PATCH /v1/irl/events/:uid/me`, plans = `PATCH /v1/irl/locations/:uid/guests/me` (BE change `lab-3211-per-event-attendance`, D2 and D12).

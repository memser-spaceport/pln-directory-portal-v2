# Proposal

## Why

Members can no longer say they are going to an event. IRL Gatherings (`/events/irl`) became admin-only in LAB-3117, and the only other way in, the notification-driven gathering modal, saves the answer for the whole city (`events: []`), not for an event. Members also can't see who is going to an event, and profiles don't show what a member or team is going to.

LAB-3211 builds the events changes from the design prototypes: one event drawer, an Events section on the member and team profiles, and the Home rail opening that drawer. Goal: [LAB-3211](https://linear.app/protocollabs/issue/LAB-3211). Subtasks: LAB-3216 (drawer), LAB-3217 (member profile, viewer view), LAB-3218 (owner controls), LAB-3219 (team profile), LAB-3220 (Home rail). The backend side is the BE change `lab-3211-per-event-attendance` (LAB-3213, LAB-3214, LAB-3215).

## What Changes

Everything below is behind a new build-time flag, `NEXT_PUBLIC_SHOW_EVENT_DRAWER`. With the flag off, every page behaves as today.

- **Event drawer (option A).** A new right-hand drawer, 778px wide, opened by an event uid. It shows the PL events app's event panel:
  - "EVENT DETAILS" with mode and access, the picture, title, date and address, tags, Host, Description and Agenda.
  - The gathering's links, the event's attendees, and "Are you going to <event>?" with "Show on my profile", ticked by default.
  - "Yes, I'm going" saves that one event. The drawer then asks for the member's plans: dates, topics, the gathering's other events and their roles, and the existing contact details. The date, topics and events pickers open as modals above the drawer.
  - "N People going" opens a searchable list of that event's attendees.
  - Members without `irlg.going.write` see the drawer without the question. Signed-out visitors are asked to log in.
- **Member profile Events section.** It replaces the IRL contributions block.
  - **Upcoming:** "You're going to" / "<Name> is going to", shown only to signed-in viewers. Each card has the date tile, title, dates and city, the member's role, faces, "N going" and "You're going too". A card opens the drawer.
  - **Contributions:** past events as the same tiles.
  - 4 cards per group, then "Show all N".
  - The section sits under Office Hours while there is something upcoming, otherwise in the old slot.
- **Member profile owner controls.**
  - "Add event" opens a picker of upcoming events, and choosing one opens the drawer.
  - A ⋯ menu on each upcoming card: Edit details, Hide from my profile / Show on my profile, and Remove (with a confirm).
  - "Only visible to you" on hidden events, and an empty state when nothing is upcoming.
- **Team profile Events section.** It replaces the Contributions tiles.
  - **Upcoming:** the events the team's members are going to, with "N from <team>" and the team's roles.
  - **Contributions:** the team's past events, with Demo Day first (gradient ring and pill, linking to its Demo Day page).
- **Home v2 Upcoming events rail.** A signed-in member's row opens the drawer instead of linking to All Events. Once going, the row reads "Going", and a toast links to the member's profile.
- **Analytics.** New PostHog events cover:
  - the drawer opening (with its source)
  - going / not going and the show-on-profile toggle
  - plans saved and the attendee list opened
  - Add event, hide/show and remove

## Capabilities

### New Capabilities

- `events`: the event drawer. Opening one event anywhere in the Directory, marking attendance for that event, choosing whether it shows on the profile, adding plans, and listing who is going.

### Modified Capabilities

- `profiles`: member and team profiles get an Events section (upcoming and past), with owner controls on the member profile. It replaces the IRL contributions block and the team Contributions tiles while the flag is on.
- `home`: the signed-in Home's Upcoming events rows open the event drawer and show "Going". The requirement's All Events link is corrected to the path the code uses (`/embed/calendar#<slug>`, not `/embed/program#<slug>`).

## Impact

- **New code:**
  - an event drawer under `components/page/events/` (or `components/core/` if the root layout must mount it)
  - an `events` client service + React Query hooks for the new endpoints
  - Events sections under `components/page/member-details/` and `components/page/team-details/`
- **Reused:**
  - the presentational parts of `components/core/UpdatesPanel/IrlGatheringModal/` (PlanningSection, the pickers, AdditionalDetailsSection, GatheringDetails) and its form types
  - `components/common/Drawer`, `Modal`, `ConfirmDialog`, `DetailsSection`
  - `useIrlGoingAccess`
- **Changed:**
  - `MemberDetailsPage.tsx` (section and placement)
  - `app/teams/[id]/page.tsx` (section)
  - `components/page/home/HomeV2/EventsSection.tsx` + `IHomeEvent` (`locationUid`)
  - `services/events/events.service.ts` (`getUpcomingEvents` maps `locationUid`)
  - `utils/constants.ts`, `analytics/events.analytics.ts`
  - `.env.example` (new flag)
- **APIs used** (from the BE change):
  - `GET /v1/irl/events/:uid`
  - the strict per-event guests list
  - per-event create and delete
  - the show-on-profile toggle
  - `GET /v1/members/:uid/events`, `GET /v1/teams/:uid/events`
  - `locationUid` on `/v1/irl/events/upcoming`
- **Feature env:** `lab-3211` needs `NEXT_PUBLIC_SHOW_EVENT_DRAWER=true` (and `NEXT_PUBLIC_SHOW_HOME_V2=true` to see the rail).

## Out of scope

- Option B (the 560px redesigned drawer with toolbar, prev/next and in-drawer sub-views).
- Deep links or URL state for the drawer (no `?event=`), and Copy link.
- Controls inside the `/events/all` iframe (the external events app).
- The notification-driven `IrlGatheringModal`, the admin-only `/events/irl` page and its attendee table: they stay as they are.
- Granting `irlg.going.write` to more members (investors, job aspirants). RBAC is unchanged.
- The signed-out Home rail: it keeps linking to All Events.
- Demo Day on the member profile (only the team profile gets the Demo Day tile).

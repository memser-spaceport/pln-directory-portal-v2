# Tasks

Each group is one subtask branch (`lab-3211-<sub#>`, cut from `lab-3211`) and one PR into `lab-3211`. Groups 2–5 need group 1 merged first. Groups 3 and 4 can run in parallel after group 2.

## 1. LAB-3216 (part 1): flag, contract and data layer

- [x] 1.1 Add `utils/event-drawer.ts` (`SHOW_EVENT_DRAWER`) and `NEXT_PUBLIC_SHOW_EVENT_DRAWER=` to `.env.example`. Verify with a jest test that mocks the module both ways.
- [x] 1.2 Add the `services/events/event-drawer.service.ts` functions and response types per design.md's contract, after checking the shapes against the BE change on BE `lab-3211`. Record any differences in design.md. Verify with unit tests on URL building and mapping, including empty `tags` / `agenda` / `hosts`.
- [x] 1.3 Add the query keys and hooks `useEventDetail`, `useEventAttendees` (infinite, search), `useMyGatheringPlans`, the `MEMBER_EVENTS` / `TEAM_EVENTS` keys (the `useMemberEvents` / `useTeamEvents` hooks moved to 3.2 and 5.2: their BE endpoints are LAB-3215, not built yet) and the mutations `useMarkGoing`, `useRemoveGoing`, `useSetShowOnProfile`, `useSavePlans` (D4 diff). Verify with tests: each mutation invalidates the keys in D3, the hooks are disabled without a current user where they need one, and `useSavePlans` sends create for added, delete for removed and update for kept events, and never PUT.
- [x] 1.4 Add `EVENT_DRAWER_ANALYTICS` to `utils/constants.ts` and the capture functions to `analytics/events.analytics.ts`. Verify with a test that each function captures the spec's event name and params.

## 2. LAB-3216 (part 2): the event drawer

- [x] 2.1 Build `EventDrawer` (778px, full width on narrow screens) on `components/common/Drawer`: Back bar plus the event panel ported from `prototypes/entries/member-events-going/EventDetails.tsx` and its SCSS, with empty blocks left out and a "no longer available" state. Verify with RTL tests for the "Event with agenda and tags", "Event without agenda or tags" and "Event no longer available" scenarios.
- [x] 2.2 Add the gathering block (`GatheringDetails`) and Attendees (faces + "N People going" from the strict count). Verify with a test for the "Count for one event" scenario using a mocked service.
- [x] 2.3 Add the attendee list above the drawer (sibling layer): "N going to <event>", "You" first, role tags, search, empty-search copy, rows linking to `/members/<uid>` in a new tab. Verify with a test for the "Searching the list" scenario and that `event-attendees-opened` fires.
- [x] 2.4 Add the ask step: question, "Show on my profile" (ticked by default) with its hint, "No" / "Yes, I'm going", gated on `useIrlGoingAccess().canWrite`. Verify with tests for "Going, shown on the profile", "Going, not shown on the profile", "Other events at the same gathering are kept", "Saving fails" and "Member without attendance permission".
- [x] 2.5 Add the plans step by reusing `PlanningSection`, the three pickers (as modals, siblings of the drawer), `AdditionalDetailsSection` and the checkbox. The footer is "Skip" after a yes, otherwise "Cancel", then "Save". It opens directly when the viewer is already going or `initialStep="plans"`. Verify with tests for "Adding another event of the gathering", "Skipping the plans" and "Unticking an event".
- [x] 2.6 Wire Escape and the backdrop (D7): the drawer's `onClose` is a no-op while a layer is open. Verify with a test for "Escape in the date picker", and in the browser that a picker sits centered over the drawer, not inside it.
- [x] 2.7 Fire `event-drawer-opened`, `event-going-marked`, `event-not-going-marked`, `event-show-on-profile-toggled` (`from: drawer`) and `event-plans-saved` with the spec's params. Verify with tests.
- [ ] 2.8 Check the drawer against the prototype at 1280px and 375px in the browser (local, flag on). Compare the screenshots with `/prototypes/member-events-going` and fix the differences.

## 3. LAB-3217: member profile Events section, viewer view

- [ ] 3.1 Build `MemberEventsSection` (DetailsSection, grey cards, 2-column grid, 1 column on mobile) from `MemberEventsSection.tsx`: title and group-label rules, upcoming cards (date tile, meta, roles, faces, "N going", "You're going too"), past cards (month/year, city, roles, no link), and 4 per group with "Show all N". Verify with tests for "Only past events", "Both groups", "Viewer going to the same event", "Past event with a role" and "Seven past events".
- [ ] 3.2 Add `useMemberEvents` (key `MEMBER_EVENTS`, gated on a current user) once BE LAB-3215 exists. Wire the data per D5: the server fetches past events without a token in `app/members/[id]/page.tsx`, and the client switches to `useMemberEvents` once it resolves. The upcoming card's title opens `EventDrawer` with `source: member-profile`, and the host shows the D8 toast. Verify with a test that the server render has no upcoming events (signed-out scenario), and with "Card opens the drawer".
- [ ] 3.3 In `MemberDetailsPage.tsx`, behind `SHOW_EVENT_DRAWER`, render the section in the high slot (under Office Hours) when `isOwner || visibleUpcoming > 0`, otherwise in the IRL contributions slot. Keep `IrlMemberContribution` when the flag is off. Verify with tests for "Flag off", "Member with upcoming plans" and "Member with past events only".
- [ ] 3.4 Verify the "Hidden event" scenario with a mocked response for a non-owner viewer, and update `openspec/specs/profiles` only through this change.

## 4. LAB-3218: owner controls on the member profile

- [ ] 4.1 Add "Add event" (header when there are upcoming events; empty state "No upcoming events on your profile yet." otherwise), gated on `canWrite`. It opens the "Add an event you're going to" picker (`useUpcomingEvents`, client-side search by event or city, "Going" mark), and choosing one opens `EventDrawer` with `source: add-event`. Verify with tests for "Owner adds an event" and "Owner with nothing upcoming".
- [ ] 4.2 Add the ⋯ menu (base-ui Menu, as the prototype): Edit details (drawer at the plans step), Hide / Show (`useSetShowOnProfile`, no confirm, "Only visible to you" pill), Remove (`ConfirmDialog` with the spec copy, `useRemoveGoing`, toast "Removed <event>."). Verify with tests for "Owner hides an event" and "Owner removes an event".
- [ ] 4.3 Fire `profile-event-add-clicked`, `event-show-on-profile-toggled` (`from: profile-menu`) and `profile-event-removed`. Verify with a test for the analytics scenario.

## 5. LAB-3219: team profile Events section

- [ ] 5.1 Build `TeamEventsSection` from the prototype's `TeamEventsSection.tsx`, reusing group 3's cards: upcoming with "N from <team>", the team's faces and role pills, and no Add event, menu or empty state; past with Demo Day first (gradient ring, "Demo Day" pill, link to `/demoday/<slug>`), then newest first, with no pill for plain participation. Verify with tests for "Team with both groups", "Three teammates going" and "Team that took part in a Demo Day".
- [ ] 5.2 Add `useTeamEvents` (key `TEAM_EVENTS`) once BE LAB-3215 exists. Wire the data per D5 in `app/teams/[id]/page.tsx` (past + Demo Day on the server, upcoming on the client for signed-in viewers), behind `SHOW_EVENT_DRAWER`, in place of `TeamIrlContributions`. Upcoming cards open `EventDrawer` with `source: team-profile`. Verify with a test for "Signed-out visitor on a team profile", and that the flag off keeps `TeamIrlContributions`.

## 6. LAB-3220: Home v2 rail opens the drawer

- [ ] 6.1 Add `locationUid` to `IHomeEvent` and map it in `getUpcomingEvents`. Verify with the existing upcoming-events mapping test, extended.
- [ ] 6.2 In `HomeV2/EventsSection.tsx`, with the flag on and signed in, make each row a button that opens `EventDrawer` (`source: home`) and still fires `home-event-clicked`. Replace the arrow with "Going" for events in the viewer's `useMemberEvents(currentUser.uid).upcoming`, and show the toast with "View profile" linking to `/members/<uid>`. Signed out, keep the links. Verify with tests for "Signed-in row opens the drawer", "Going from the rail" and "Signed out with the flag on".

## 7. Checks on lab-3211

- [ ] 7.1 Run `npm run lint`, `npx tsc --noEmit` and `npm run test` in the worktree. All pass, or failures are shown to also fail on `origin/develop`.
- [ ] 7.2 Run `npx -y @fission-ai/openspec@1.14.1 validate lab-3211-event-drawer-and-profile-events --json` and confirm it reports valid.
- [ ] 7.3 On the `lab-3211` feature env (`NEXT_PUBLIC_SHOW_EVENT_DRAWER=true`, `NEXT_PUBLIC_SHOW_HOME_V2=true`), walk through every Scenarios item of LAB-3211 with a dev account that has `irlg.going.write`, and one without it.

## Workflow follow-up

- Archive this change (`/opsx:archive`) in the PR of the last subtask that merges into `lab-3211`, so `openspec/specs/` changes with the code.
- Polina reviews the drawer footer (prototype "Skip/Cancel + Save" vs the ticket's "no Save/Cancel") on the feature env.

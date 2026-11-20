# Tasks

Groups map to the Tasks under LAB-3278: group 1 = LAB-3339, groups 2 and 3 = LAB-3282, group 4 = LAB-3340, group 6 = LAB-3341. Start from `lab-3278`, cut from `develop` after `lab-3247` is merged. The UX source for groups 2 to 4 is the old portal repo `pl-events-submission` (design Context); build with this repo's components (design D1).

## 1. All Events page on the list endpoint, all-day display

- [x] 1.1 Call `GET /v1/irl/events` on the dev API and check each item has: uid, name, dates, `allDay`, time zone, format, access, tags, featured, picture, host names, city, going count and up to 3 faces; record any missing field on LAB-3281 before coding
- [x] 1.2 Replace the per-event calls in `services/events/all-events.service.ts` with the paged list call, mapped to the same `AllEventsItem`; verify with `__tests__/services/events/all-events.service.test.ts` (two pages, empty list, failed request)
- [x] 1.3 Add `allDay`, `featured` and the access and topic values to `AllEventsItem` and the fixtures; verify `tsc` passes with no change in the view components' props
- [x] 1.4 Add the Featured filter to `all-events.filters.ts`, the filters store and the rail, next to Access type, Focus area and Host (on the page since `lab-3247`); verify with `all-events.filters.test.ts` (each filter, fewer-than-2 rule, URL round trip)
- [x] 1.5 Add one date-line helper with the all-day rule and use it in the list card, tile, calendar cards, map card and the drawer; verify with a unit test for a timed event, a one-day all-day event and a three-day all-day event
- [x] 1.6 Use one neutral wash for calendar cards; verify the Week board locally

## 2. Submit form

- [x] 2.1 Add `NEXT_PUBLIC_EVENTS_LOCAL_SUBMIT` to `.env.example` and a `utils/` constant; verify the three routes answer not found with the flag off
- [x] 2.2 Add to `services/events/`: `submitEvent` (with `draft`), `updateEvent` (with `submit`), `deleteEvent`, `getMyEvents`, `searchPlaces`, `resolvePlace`, `parseAgenda`, with types from the backend contract and TanStack Query hooks; verify with service tests for 201 `APPROVED`, 201 `PENDING`, 201 `DRAFT`, 400, 429 and a network error
- [x] 2.3 Decide the editor (design D3): check `components/form/FormEditor` against the old toolbar and the `/Agenda` command; record the choice and, if a dependency is added, the reason in the PR
- [x] 2.4 Build the form shell `EventForm` with the section order of the old form, the Enter rule and the scroll to the first error; verify with a component test for the order and for Enter in a single-line field
- [x] 2.5 Build the access option, logo and name sections (limits and messages from the spec); verify with tests for a 6 MB file, a non-square file, replace, delete and a 150-character name
- [x] 2.6 Build the format section with the venue search, the resolved place, the map, Instruction and the meeting link, and the time zone switch on a resolved place; verify with tests for each format, the clear on format change, free text with no pick, and a debounced search where the last answer wins
- [x] 2.7 Build the start and end pickers and the time zone picker with the rules in the spec; verify with tests for the reset to 12:00 AM, the 23:45 rule, the disabled times on one day, and the default zone
- [x] 2.8 Add the wall-clock-to-instant mapping and its reverse (design D5); verify with unit tests in two time zones and across a daylight-saving change
- [x] 2.9 Build the description editor and the agenda box (hint, sample card, text area, parsed view by day, "Add/Edit", "Remove all" with its question) and the agenda checks; verify with tests for a parsed agenda, each parse message, a session outside the event, and a time zone change that keeps clock times
- [x] 2.10 Build the tags section and the host and co-hosts section; verify with tests for the default chip, a custom tag, a duplicate custom tag, and the "Host (N)" count
- [x] 2.11 Build the registration link (optional; a link with no scheme is accepted); verify with tests for a link with no scheme and for "Enter a valid registration link"
- [x] 2.12 Add the form checks with the texts from the spec for "Submit Event" and for "Save as draft"; verify with one test per message and a test that a draft needs only name, dates and time zone
- [x] 2.13 Add "Clear form" with its question and toast, and "Preview" on the drawer's view component; verify with tests for cancel, confirm, and Preview from a half-filled form
- [x] 2.14 Add `app/events/submit/page.tsx`; a signed-out visitor is asked to sign in and returns to the page; verify the member's form and the sign-in state
- [x] 2.15 Add the send flow: logo upload at send time, one request, disabled button, the toasts "Event Created Successfully" and "Draft Event Created Successfully", the redirect to the edit page, the failure toast and the 429 message, and the `all-events` revalidation; verify with a test per outcome and one for a double press
- [x] 2.16 Point "Submit an event" in `AllEventsHeader` and `irl-events.tsx` at `/events/submit` when the flag is on; verify the old link is used with the flag off

## 3. Analytics

- [x] 3.1 Add the six event names to `utils/constants.ts` and functions to `analytics/events.analytics.ts`; verify with a test that no property holds an email or event text

## 4. Edit page, My Submissions, drawer link

- [x] 4.1 Add `app/events/edit/[uid]/page.tsx`: load the event, the "no longer available" state, the read-only view with the status label and "Edit" (design D6, D8); verify with tests for submitter, admin, another member, an unknown uid and a rejected event
- [x] 4.2 Fill `EventForm` from the event, add Website Link and Social Handles with the handle normalization, and the buttons by status ("Save as draft", "Submit", "Save Changes"); verify with tests for a draft, a submitted and an approved event, each social platform, a handle with no platform and a wrong second handle
- [x] 4.3 Add the save flow with the toasts from the spec and the return to the read-only view; verify with tests for a saved draft, a submitted draft, an approved event that stays approved, a failed check that unlocks the form and a failed request
- [x] 4.4 Add "Delete Event" with its question, toast and redirect to My Submissions, hidden for the submitter of an approved event; verify with tests for confirm, cancel, an approved event as submitter and as admin
- [x] 4.5 Add `app/events/mine/page.tsx`: rows with status, "Last Modified", buttons by status, month groups, search on Enter, Upcoming / Past, the empty text, the error state and the sign-in return; verify with a component test per rule in the spec
- [x] 4.6 Add the "My Submissions" link to the All Events header for signed-in members and the "Edit" link and status line to the drawer; verify with tests for submitter, admin, another member and a signed-out visitor

## 5. Check on the feature env

- [ ] 5.1 Deploy `lab-3278` (API and v2) to the feature env with `EVENTS_LOCAL_SUBMIT_ENABLED=true` and `NEXT_PUBLIC_EVENTS_LOCAL_SUBMIT=true`; verify a forum member's event is "Approved" and shows on the All Events page
- [ ] 5.2 Verify a member without forum access gets "Submitted" and the event is not on the All Events page; verify a signed-out visitor is asked to sign in on `/events/submit` and returns to it
- [ ] 5.3 Verify a draft, its edit, its submit and its delete; verify another member sees no "Edit" and cannot open the edit address
- [ ] 5.4 Open the dev portal (`submitv2.events.dev.os.pl.xyz`) next to the feature env and compare the submit form, the edit page and My Submissions section by section: fields, order, rules and texts; record each difference that is not in design D7
- [ ] 5.5 Verify the three pages at 375 px and with the keyboard only; ask Polina for a review
- [x] 5.6 Run `npm run lint` and `npm run test`
- [x] 5.7 Run `openspec validate events-on-labos-stack --json`

## 6. Removal of the old event apps' links

- [ ] 6.1 Delete `utils/irl-submit-url.ts`, its test and `components/page/events/schedule-section/`; verify `tsc` passes
- [ ] 6.2 Remove "Open PL Events", the events banner link and the IRL page's calendar and "Manage events" links to the old apps; verify a grep finds no use of `PL_EVENTS_BASE_URL`, `IRL_SUBMIT_FORM_URL` or `PL_EVENTS_SUBMISSION_URL`
- [ ] 6.3 Remove the three variables from `next.config.mjs` and `.env.example`, and both flags with their off branches; verify the app builds with none of them set
- [ ] 6.4 Run `npm run lint`, `npm run test` and `openspec validate events-on-labos-stack --json`, then archive this change in the same PR

## Workflow follow-up

- The deploy config (Vercel env, `pl-infra-pipeline` feature-env workflow) loses the three variables in LAB-3330.
- Prod flag switch and redeploy are steps of the cutover checklist in LAB-3327.
- The redirects from the old portal's addresses (`/events/add`, `/events`) to `/events/submit` and `/events/mine` are set in LAB-3330.

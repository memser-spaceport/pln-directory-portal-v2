# Events on the LabOS stack (frontend)

## Why

Goal [LAB-3278](https://linear.app/protocollabs/issue/LAB-3278) makes LabOS the owner of events. The backend part is the OpenSpec change `events-on-labos-stack` in `pln-directory-portal`. This change is the frontend part.

Today a member who wants to add an event leaves LabOS: "Submit an event" opens the old submission portal (`pl-events-submission`, irl.os.pl.xyz). That portal and the old events site (`events.plnetwork.io`) are switched off by the Goal. Their submitter screens move into LabOS.

The rule for this change: **the UX stays the same, the look becomes LabOS.** The submit form, the edit page and the "My Submissions" list keep the old portal's fields, order, rules and texts. They are built with this repo's form components, styles and tokens, not with the old portal's CSS. Only the screens Polina prototyped (the All Events page and the event drawer, prototype `events-page-redesign`) have a new design, and they are already built on `lab-3247`.

## What Changes

- **Submit form in LabOS.** `/events/submit` is the old "Submit Event" form: access option, registration link with import from Luma, logo, name, format with venue search, map and meeting link, dates and time zone, rich-text description with agenda, tags, host and co-hosts, "Save as draft", "Submit Event", "Clear form" and "Preview". It sends `POST /v1/irl/events`.
- **Edit page.** `/events/edit/<uid>` is the old edit page: it opens read-only, "Edit" unlocks it, it adds Website Link and Social Handles, and it has "Save as draft", "Submit" or "Save Changes", and "Delete Event".
- **My Submissions.** `/events/mine` is the old "My Submissions" tab: status per event (Draft, Submitted, Approved, Rejected), search, Upcoming / Past, month groups, Modify / View / Delete.
- **Differences from the old portal, all decided by the Goal:**
  - Signed-out people can submit, with a contact email. The old portal needed a sign-in by email code. They get no drafts and no My Submissions.
  - The backend decides the status: a member with forum access is "Approved" at once, everyone else is "Submitted". The form shows the status it gets.
  - Saving an approved event keeps it approved.
- **The event drawer links to the edit page** for the submitter and a directory admin, and shows the status of an event that is not approved to them only.
- **All-day events** (from partner apps) show dates without a time.
- **The All Events page reads the list endpoint.** One `GET /v1/irl/events` call replaces the per-event calls. The Featured filter is added; Access type, Focus area and Host are already on the page.
- **BREAKING: links to the old event apps are removed.** The iframe fallback of `/events/all`, "Open PL Events", "Manage events" and every use of `IRL_SUBMIT_FORM_URL`, `PL_EVENTS_SUBMISSION_URL` and `PL_EVENTS_BASE_URL` go away, with the flags `NEXT_PUBLIC_SHOW_EVENTS_PAGE_V2` and `NEXT_PUBLIC_EVENTS_LOCAL_SUBMIT`.

## Capabilities

### New Capabilities

None. All behaviour belongs to the existing `events` capability.

### Modified Capabilities

- `events`: adds the submit form, the edit page, My Submissions, the drawer's edit link and status, and all-day display. Changes the page header (submit stays in LabOS, no link to the events app), the filters, and the flag requirement of the All Events page.
- `irl-gatherings`: "Submit an event" opens the LabOS form. "Manage events" is removed.

## Impact

- **Routes:** new `/events/submit`, `/events/edit/[uid]`, `/events/mine`.
- **Code:** `services/events/` (submit, draft, edit, delete, mine, lookups, list loader), `components/page/events/` (form sections, edit page, My Submissions, drawer link, header), `components/page/irl/events/irl-events.tsx`, `components/page/events/schedule-section/` (deleted with the iframe), `utils/irl-submit-url.ts` (deleted), `next.config.mjs` env list, `.env.example`, `analytics/events.analytics.ts`, `utils/constants.ts`.
- **Dependencies:** a rich-text editor (the old portal uses Tiptap) and a time zone list, only if the repo has no equivalent; design D3 decides.
- **Backend it depends on:** submit, draft, edit, delete, mine and the status on the event read (LAB-3325); the list endpoint (LAB-3281); the form lookups for venues, agenda parsing and Luma import (LAB-3343).
- **Design:** no new design is needed for the form, the edit page and My Submissions; they follow the old portal's UX with LabOS components. Polina reviews before prod. LAB-3280 stays for anything she wants to change later.
- **Order:** this change builds on `lab-3247` once it is in `develop`. The removal step ships only after the backend cutover (LAB-3327).

## Out of scope

Not moved from the old portal, because they are admin tools and the Goal moves approval to the PL Infra Events app:

- The admin tabs All, Pending and Closed, with Approve and Reject and their popups ("Confirm Event Contributors", "This location will be auto-assigned").
- The admin "Event Contributors" tab of the form (members and teams as hosts, speakers, sponsors, attendees).
- IRL gathering and location management, Switch IRL gathering, gathering resources.
- Users management (admins and the event-creator whitelist). Forum access replaces the whitelist.
- Luma batch import (`/events/luma-import`). The one-event "Fetch from Luma" in the form is kept.
- The portal's own sign-in (email code, "Continue with LabOS").

Also out of scope:

- A message to the submitter when their event is approved or rejected.
- Past events on the All Events page.
- The LabOS sign-in handoff route for the old portal (`/sign-in/authorize`). Its removal is a separate security decision.
- Backend, the PL Infra Events app and infrastructure. They have their own tickets under LAB-3278.

# Design

## Context

- The backend change `events-on-labos-stack` (repo `pln-directory-portal`) adds `POST /v1/irl/events` (with `draft`), `GET /v1/irl/events`, `GET /v1/irl/events/mine`, `PATCH` (with `submit`) and `DELETE /v1/irl/events/:uid`, the status on `GET /v1/irl/events/:uid` for the submitter and a directory admin, and the form lookups (`/v1/irl/events/places`, `/places/resolve`, `/agenda/parse`). Every one of these routes needs a signed-in member. The backend decides whether a submission is `APPROVED` or `PENDING`.
- The UX source is the old portal, repo `pl-events-submission` (branch `release/LAB-3113-labos-sign-in`, commit `11696aa`): `components/core/event-form/add-event-form.tsx`, `components/page/add-edit-event/*`, `components/manage-events/MyEventCard.tsx`, `ManageEvents.tsx`. Its fields, rules and texts were read field by field for this change; the spec quotes its texts.
- The native All Events page is on the goal branch `lab-3247` (List, Calendar, Map, filters, drawer link). Its loader `services/events/all-events.service.ts` calls `/v1/irl/events/upcoming` and then `/v1/irl/events/:uid` once per event, cached for five minutes under the tag `all-events`.
- "Submit an event" is `getSubmitEventUrl()` (`utils/irl-submit-url.ts`): a link to the old portal, used in the All Events header, the iframe fallback (`schedule-section`) and the IRL Gatherings page (`irl-events.tsx`), which also links "Manage events" to the portal.
- Polina's prototypes (`prototypes/entries/events-page-redesign`, `event-drawer-redesign`, branch `events-update`) cover the page and the drawer only.
- This repo has `react-hook-form` with schema resolvers, `components/form/*` (fields, selects, tags input, date range picker, `FormEditor`), `components/common/Modal`, `react-dropzone`, `react-toastify`, `date-fns-tz`, a `SafeHtml` renderer, and a Google Maps loader on `lab-3247` (`components/page/events/all-events/map/loadGoogleMaps.ts`).

## Goals / Non-Goals

**Goals:**

- A submitter finds the same form, the same rules and the same words as in the old portal.
- Every screen is built from this repo's components and tokens. No CSS or component is copied from the old portal.
- The All Events page keeps its item shape, so the List, Calendar and Map views do not change.
- A rollout that can be switched per environment and reverted until the old apps are removed.

**Non-Goals:**

- The old portal's admin tools (listed in the proposal).
- A redesign of the form. Changes to its UX go through LAB-3280.
- Carrying over old bugs (D7).

## Decisions

### D1. Same UX, LabOS components

| Old portal part | Built with |
|---|---|
| Text inputs, dropdowns, tag chips | `components/form/*` |
| Rich-text description | `components/form/FormEditor` if it has the old toolbar's tools; D3 |
| Date and time pickers, time zone list | repo date components; time list and zone list as small new parts in the form folder |
| Logo tile | `react-dropzone` with the old limits (PNG or JPEG, 4 MB, square within 10 px) |
| Confirm dialogs, Preview popup | `components/common/Modal` |
| Toasts | `react-toastify`, with the old texts |
| Read-only event view and Preview | the event drawer's view component (`EventDrawerView`), fed with form values |
| Map under the venue | the Google Maps loader from `lab-3247`; no map when the build has no Maps key |

Layout follows the old order of sections (spec requirement "The form keeps the old portal's sections and order"). Spacing, colours and type come from LabOS.

### D2. Three pages

`/events/submit`, `/events/edit/[uid]` and `/events/mine`, as the old `/events/add`, `/events/edit/{id}` and the "My Submissions" tab of `/events`. The old portal's addresses redirect to them at cutover (`/events/add` → `/events/submit`, `/events` → `/events/mine`). One `EventForm` component serves submit and edit, as `AddEditEventForm` did.

### D3. Rich text and the agenda command

The description is stored as HTML. The editor is `components/form/FormEditor` (Quill) with its toolbar set to bold, italic, strikethrough, underline, link, H1, H2, bullet and numbered lists and four alignments. No dependency is added. Quill has no slash menu, so the form watches the description: when its text holds `/agenda` as a word, the form removes it and opens the agenda box. The hint "Type /Agenda to Add Agenda" is also a button, so the box opens without typing. The description is shown through `SafeHtml` everywhere; the backend also sanitizes it on write.

### D4. Lookups go through the backend

Venue suggestions, place details with time zone and agenda parsing call the backend lookup routes, with the member's token. The browser holds no Google server key and no model key. Calls are debounced (300 ms, the last one wins), which fixes the old form's request per keystroke.

### D5. Field mapping

The form's submit function is the only place that maps form values to the backend body.

| Form | Body |
|---|---|
| Access option | `accessOption` (`OPEN`, `PAID`, `INVITE`) |
| Registration link, Website link, Meeting link | `registrationUrl`, `websiteUrl`, `meetingUrl` |
| Logo | `logoUid`, uploaded with the existing image upload when the form is sent |
| Name | `name` |
| Format | `format` (`IN_PERSON`, `VIRTUAL`, `HYBRID`) |
| Venue location, Instruction | `address` (text, city, state, country, latitude, longitude, `locationUrl`, `locationInstructions`) |
| Start, End, Time zone | `startDate`, `endDate` (instants from the wall-clock values in the picked zone, `date-fns-tz`), `timezone` |
| Description | `description` (HTML) |
| Agenda | `agenda` (`sessions`, the pasted text) |
| Tags | `tags` |
| Host, host email, co-hosts | `hostName`, `hostEmail`, `coHosts` |
| Social handles | `contactInfos`, normalized to addresses as the old form did |
| Save as draft | `draft: true`; on the edit page "Submit" sends `submit: true` |
| (always) | `allDay: false`: the form makes timed events only |

### D6. Status labels

| Backend status | Label |
|---|---|
| `DRAFT` | Draft |
| `PENDING` | Submitted |
| `APPROVED` | Approved |
| `REJECTED` | Rejected |

The old portal's raw value `PENDING` meant a draft. The labels above are what its users saw.

### D7. What is deliberately different from the old portal

| Old behaviour | Here | Why |
|---|---|---|
| The portal's own sign-in by email code | The LabOS sign-in; a signed-out visitor is asked to sign in and returns to the form | Scope decision of 2026-11-19: the submitter must be able to edit the event later |
| "Fetch from Luma" filled the form from a Luma link | Not built | Scope decision of 2026-11-19; a later option |
| Status chosen by the button, approval by an admin | The backend sets Approved or Submitted | Goal LAB-3278 |
| "Save Changes" re-sent an approved event as submitted | An approved event stays approved | Backend rule; no approval queue in LabOS |
| The edit page had no status | The read-only view shows the status label | The submitter must see "Approved" or "Submitted" after submit |
| Co-host, registration and website link checks ran on edit only | They run on submit too | A bug |
| "Clear form" on the edit page lost the event id, so the next save failed | The event stays; only the fields are reset | A bug |
| A wrong second social handle blocked the save with no message | The message shows on the wrong row | A bug |
| A rejected event had "Edit" in the header but no save button in the footer | A rejected event is read-only for its submitter | The list calls it "View" |
| Agenda parsing ran in the browser with a model key | The backend parses | The key must not be in the bundle |
| The admin "Event Contributors" tab and gathering inference | Not built | Admin tools, out of scope |
| A draft skipped every check but name, dates and time zone | A draft also checks the links, emails and co-host names it has | The backend refuses a wrong link, email or an unnamed co-host in a draft too |
| No message when the end was before the start | "End date must be after start date" under the dates | The backend refuses it; the pickers make it rare |
| "Edit" in the page header toggled the form | "Edit" unlocks the form and "Cancel" returns to the read-only view | The read-only view is the drawer's view, not a locked form |

### D8. Who may open the edit page

The page loads the event with the member's token. The backend returns an event that is not approved only to its submitter and a directory admin, and a draft only to its submitter. For an approved event the page also checks that the event is in the member's own submissions (`GET /v1/irl/events/mine`) or that `isAdminUser(userInfo)` is true; otherwise it shows the "no longer available" state. The same check shows "Edit" in the drawer. The backend enforces every write.

### D9. The page loads from the list endpoint

`loadAllEvents` reads `GET /v1/irl/events?limit=100`, page by page until `total` is reached, and maps each item to the same `AllEventsItem`. Views, the filters store and URL handling stay; Featured is one more filter on the loaded list (Access type, Focus area and Host are there since `lab-3247`). The call stays signed out and cached; "going" still comes from `useMyUpcomingEventUids`. Calendar cards use one neutral wash, because tag colours came from the old events app.

After a submit, an edit or a delete, a server action revalidates the `all-events` tag. An approval made in the curator's app does not, so a newly approved event can take up to five minutes to show.

### D10. One rollout flag

`NEXT_PUBLIC_EVENTS_LOCAL_SUBMIT` (build flag, off by default):

| Flag | "Submit an event" | `/events/submit`, `/events/edit/*`, `/events/mine` | Drawer "Edit", "My Submissions" link |
|---|---|---|---|
| off | old portal link, as today | not found | hidden |
| on | `/events/submit` | on | shown |

It is turned on per environment when the backend flag `EVENTS_LOCAL_SUBMIT_ENABLED` is on there. It is a build flag, so turning it on needs a redeploy. The list loader (D9) and all-day display need no flag.

### D12. What the frontend reads and sends

The shapes below are the backend's (confirmed with the backend change on 2026-11-19). Reads stay tolerant: a missing value is empty. Every route answers 404 while the API flag `EVENTS_LOCAL_SUBMIT_ENABLED` is off, and every route but the list and the event read answers 401 with no session.

| Call | Shape |
|---|---|
| `GET /v1/irl/events?page=&limit=100` | `{ page, limit, total, items }`. Item: `uid`, `name`, `startDate`, `endDate` (always instants, also for an all-day event), `allDay`, `timezone`, `format`, `accessOption`, `tags` (names), `isFeatured`, `logo`, `banner`, `host { name, logo }`, `coHosts [{ name }]`, `gathering { uid, city, country }`, `venue { address, latitude, longitude }`, `goingCount` (null for invite-only), `faces` (up to 3) |
| `POST /v1/irl/events` | Body: the shared event body, plus `draft: true` for a draft. `locationUrl` is top-level, not inside `address`. Answer 201 `{ uid, status }` |
| `PATCH /v1/irl/events/:uid` | Any subset of the body; `null` clears; `submit: true` sends a draft. Answer `{ uid, status }` |
| `DELETE /v1/irl/events/:uid` | `{ uid, deleted: true }`; 403 for a submitter's approved event |
| `GET /v1/irl/events/mine` | An array of `uid`, `name`, `startDate`, `endDate`, `allDay`, `timezone`, `status`, `reviewNote`, `logo`, `location`, `createdAt`, `updatedAt` |
| `GET /v1/irl/events/:uid` for the submitter or a directory admin | The event read, plus top-level `status`, `reviewNote`, `updatedAt`, `logoUid`, `format`, `accessOption`, `tags`, `hostName`, `hostEmail`, `coHosts [{ name, email }]`, `contactInfos`, `agenda`, `address { address, city, state, country, latitude, longitude, locationUrl, locationInstructions }`. Everyone gets `timezone`, `allDay`, `registrationUrl`, `meetingUrl`. A draft is 404 for everyone but its submitter; an event that is not approved is 404 for other members |
| `GET /v1/irl/events/places?query=` | An array of `{ text, placeId }`, at most 5 |
| `GET /v1/irl/events/places/resolve?placeId=` or `?address=` | `{ placeId, address, city, state, country, latitude, longitude, locationUrl, timezone }`; 404 for no match |
| `POST /v1/irl/events/agenda/parse` | Body `{ text, startDate, endDate, timezone }`. Answer `{ sessions: [{ name, description, start_date, end_date, timezone }], message }`; 503 when the model is down |
| `POST /v1/images` | `{ image: { uid } }`, as today |

A 400 carries `message` as one line, "field: text; field: text". The form does not show it: its own checks run first, and a 400 that still comes back shows the general failure message.

A link typed with no scheme ("lu.ma/abc") is sent with `https://` in front, because the backend takes only `http` and `https` addresses and the old form accepted both.

The form sends `allDay: false` on every write. An all-day event from a partner app that a directory admin edits in this form becomes a timed event.

### D11. Removal

After the backend cutover (LAB-3327) and with the All Events page on in prod: delete `utils/irl-submit-url.ts`, `components/page/events/schedule-section/`, "Open PL Events", the events banner link and the IRL page's links to the old apps; remove `IRL_SUBMIT_FORM_URL`, `PL_EVENTS_SUBMISSION_URL` and `PL_EVENTS_BASE_URL`; remove both flags and their off branches.

## Risks / Trade-offs

- [The form is large: about twenty field groups, an editor, an agenda, three lookups] → it is split into sections that map one to one to the old components, and built in two PRs (form and submit; edit page and My Submissions).
- [`lab-3247` is not in `develop` yet] → this change starts from `lab-3278` cut after `lab-3247` merges. The spec delta modifies requirements that `lab-3247` adds.
- [A build flag needs a redeploy on cutover day] → the cutover checklist (LAB-3327) includes the v2 redeploy and its rollback.
- [The texts are quoted from a code read, not from the running portal] → task 5.4 compares the built screens with the dev portal side by side before the review.

## Migration Plan

1. **List loader and all-day display.** Needs backend step 1 (LAB-3281). No visible change except the new filters.
2. **Submit form, behind the flag.** Needs LAB-3325 and LAB-3343.
3. **Edit page and My Submissions, behind the flag.** Tested on the feature env `lab-3278` with both flags on.
4. **Cutover day (LAB-3327).** Flag on in prod, redeploy. Rollback: flag off, redeploy.
5. **Removal.** After the cutover is stable: D11, and archive this change in that PR.

## Open Questions

None.

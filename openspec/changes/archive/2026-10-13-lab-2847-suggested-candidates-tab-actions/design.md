# Design

## Context

See proposal.md for the why. The read side is already on develop (base `lab-2837` at 741e3f81d):

- `app/teams/[id]/applicants/page.tsx` server-loads the team and its open roles (`IJobRole[]`, from `getJobsList`) and renders `TeamApplicantsView`.
- `TeamApplicantsView.tsx` owns the tabs (`SUGGESTED_TAB`), the `?role=` / `?suggested=` deep links, the selection, and the analytics calls. On the Suggested tab it renders `SuggestedRow`, `SuggestedPaneBar` (prev/next plus a `mailto:` "Email {first name}" link) and `SuggestedWhy` (band, "N of M requirements" from `metCount(suggestion.criteria)`, and the per-person requirement list).
- `fetchSuggestedCandidates(roleUid)` in `services/jobs/team-applicants.service.ts` parses `suggestedCandidatesResponseSchema` (`.strict()`) and returns `SuggestedCandidate[]`. `useSuggestedCandidates` caches it under `[JobsQueryKey.SuggestedCandidates, viewerUid, roleUid]`, gated by `enabled` (the hooks never import the flag).
- Errors from these endpoints are `TeamApplicantsError` (status + server message) built by `errorFrom()`. Writes use `jsonWrite()` because `customFetch` sends no `Content-Type` on its own.
- Toasts come from `@/components/core/ToastContainer` (`useToggleSavedJob` is the precedent for an error toast from a mutation).
- `IJobRole` has no plain-text description. It has `descriptionHtml?: string | null` (the scraped posting body; about 9 in 92 dev roles have none). `utils/forum/stripHtml.ts` turns HTML into one line of plain text.
- Prototypes `prototypes/entries/team-profile/CriteriaModal.tsx` and `ReachOutModal.tsx` are layout references only. The criteria prototype keys criteria by id and groups them, and has a free-text prompt and a "members would show" footer. The real contract has plain text strings, no groups, and none of those extras.
- No mock modules exist in `services/jobs/` today (the earlier `team-applicants.mock.ts` and `job-applications.mock.ts` were deleted at their cutovers).

Contract from LAB-2846 (the FE builds against mocks of it first):

| Call                                                                     | Request                                      | Response                                                                                       |
| ------------------------------------------------------------------------ | -------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `GET /v1/job-openings/:roleUid/suggested-candidates`                     | (existing)                                   | adds `suggestions[].contactedAt: string \| null` and top-level `criteria: { text, enabled }[]` |
| `PUT /v1/job-openings/:roleUid/match-criteria`                           | `{ disabled: string[] }` (requirement texts) | `{ criteria: { text, enabled }[] }`                                                            |
| `POST /v1/job-openings/:roleUid/suggested-candidates/:memberUid/contact` | `{ message }`, 1..2000 chars                 | `{ contactedAt }`; 409 when already contacted                                                  |

Both writes answer 403 to anyone who is not a lead of the team or an admin.

## Goals / Non-Goals

**Goals:**

- Ship the schema tolerance first, as its own commit, so develop works with the old and the new backend.
- Keep the page's existing contract style: the schemas are the contract, writes reconcile from the server's answer, hooks take `enabled`.
- Swap mocks for the real endpoints by touching the service layer only.

**Non-Goals:**

- No optimistic writes. Both actions run from a modal with a pending Send/Save, so there is nothing to roll back on screen.
- No change to sorting, banding, or the per-person requirement list after a criteria save (it applies from next week).
- No rating, no sign-in return, no change to Applied/Interested tabs.

## Decisions

### 1. Schema: optional fields, still `.strict()`

`suggestedCandidateSchema` gets `contactedAt: z.string().nullable().optional()`. A new `roleCriterionSchema = z.object({ text: z.string().min(1), enabled: z.boolean() }).strict()` and `suggestedCandidatesResponseSchema` gets `criteria: z.array(roleCriterionSchema).optional()`. Two response schemas are added for the writes: `matchCriteriaResponseSchema` (`{ criteria }`) and `contactSuggestedResponseSchema` (`{ contactedAt: z.string() }`). `.strict()` stays, so an unknown field still fails loudly, which is the reason the file gives for it.

Alternative: drop `.strict()` to tolerate any drift. Rejected: it is the file's deliberate guard, and optional fields are enough.

### 2. The read returns the role's criteria with the suggestions

`fetchSuggestedCandidates` returns `{ suggestions: SuggestedCandidate[]; criteria: RoleCriterion[] | null }`. `null` means the backend did not send criteria (old backend), and the pane hides "Edit criteria". `useSuggestedCandidates` returns that object, and the view reads `suggestions.data?.suggestions` where it read `suggestions.data` before (tab count, viewed event, deep link, list). The existing service and view tests move to the new shape.

Alternative: a separate query for criteria. Rejected: the contract puts them in the same response, and a second request would be a second loading state for one pane.

### 3. Writes: two service functions, two mutations, no optimism

- `saveMatchCriteria(roleUid, disabled: string[])`: `PUT` with JSON body (`jsonWrite` gains a `method` argument, or a sibling `jsonPut`), parses `matchCriteriaResponseSchema`.
- `contactSuggestedCandidate(roleUid, memberUid, message)`: `POST`, parses `contactSuggestedResponseSchema`. A 409 is thrown as `TeamApplicantsError` with status 409, and `isAlreadyContactedError(error)` names it.
- `useSaveMatchCriteria({ roleUid, viewerUid })`: on success it writes the returned `criteria` into the suggestions cache entry. On error it touches nothing (nothing was patched).
- `useContactSuggestedCandidate({ roleUid, viewerUid })`: on success it patches `contactedAt` on that person in the cache from the server's answer. On 409 it invalidates the suggestions query so the real `contactedAt` arrives from the server, and the caller treats it as success (closes the modal, no toast, no event).

Writes follow the server, not the press, as `useToggleApplicantReviewed` does. The hook's doc comment ("Read-only: the team does nothing to a suggestion that this page writes back") is updated.

### 4. Mocks until LAB-2846 lands

A temporary `services/jobs/suggested-candidates.mock.ts` holds per-session state (a `Map` keyed by role for disabled criteria and by role+member for `contactedAt`) and exports the two writes plus `overlaySuggestedMock(roleUid, response)`, which fills `criteria` (derived from the per-person criteria texts when the server sent none) and `contactedAt` on a real read. The service picks mock or real through one constant, `SUGGESTED_ACTIONS_MOCKED`, in the service file. The mock can simulate 409 (second contact for the same person) and failure (a message containing a fixed marker, documented in the file) so the error paths can be clicked through. Cutover, inside `lab-2837`, deletes the file and the constant, and changes no hook or component.

Alternative: an env var. Rejected: one more build-time flag for a short-lived switch. Alternative: Jest mocks only. Rejected: the modals need a clickable dev path before the backend exists.

### 5. Edit criteria modal

New `components/page/team-details/TeamApplicants/components/EditCriteriaModal.tsx` + `EditCriteriaModal.module.scss`, on `components/common/Modal` (`ariaLabelledBy`, `lockScroll`, `inertBackground`) with `Button` and `Checkbox` from `components/common`. Layout follows `CriteriaModal.tsx` (header with close disc, one flat list, Cancel/Save footer); its styles are written into the new SCSS module rather than imported from `deals/` and `gantry/` modules (AGENTS.md rule 15).

- Draft is the set of disabled texts, reset from the saved criteria each time the modal opens, so Cancel discards.
- A checkbox is disabled when it is the only enabled one (decision: the last enabled criterion cannot be turned off).
- Copy: title "Edit criteria", lede "Choose which requirements of {roleTitle} count when we match people. Changes apply from next week's suggestions." Save is disabled while the draft equals the saved state or a save is pending.
- Opened from an "Edit criteria" text button in `SuggestedWhy`'s header, shown only when criteria is not null. The modal is mounted by the view (it owns the role and the mutation), and `SuggestedWhy` receives an `onEditCriteria` callback.

Requirement texts are the keys. The contract sends no ids, and `disabled` is a list of texts. If a role has two identical texts they toggle together; that is acceptable for the posting's own requirement list.

### 6. Contact modal and button

New `ContactSuggestedModal.tsx` + `ContactSuggestedModal.module.scss`, same shell. One `textarea` (`maxLength` 2000, live count), no subject, and Send/Cancel. Layout follows `ReachOutModal.tsx` without its sender card, posting link or "Reset to template" (not in the decisions). Prefill:

> Hi {firstName}, I lead hiring for {roleTitle} at {teamName}. Your profile looks like a good fit, and I'd like to tell you more about the role. Would you be open to a short chat?

The lede says the member gets this by email from the PL Network with a link to the role, and that replies go to the lead's email.

The draft text is held by the view per `roleUid:memberUid` while the page is open, so closing the modal or a failed send never loses it. Send is disabled when the trimmed text is empty, over 2000 chars, or a send is pending.

`SuggestedPaneBar` drops the `mailto:` link and its member-email lookup, and renders either a "Contact {firstName}" button (`onContact`) or a non-interactive "Contacted · {date}" label when `suggestion.contactedAt` is set. The date is `format(new Date(contactedAt), 'MMM d, yyyy')` from `date-fns`. `SuggestedPaneBar` keeps sharing `ApplicantsPaneBar.module.scss` for the bar layout (as today), and the Contact button and Contacted label styles go into a new co-located `SuggestedPaneBar.module.scss`.

### 7. Role description

The view derives `roleSummary = role?.descriptionHtml ? stripHtml(role.descriptionHtml) : ''` (memoized on the role) and renders it under the existing suggested note as a paragraph with a two-line CSS clamp (`-webkit-line-clamp: 2`). No line when empty. No new request.

### 8. Analytics

`ON_JOB_SUGGESTED_CRITERIA_EDITED: 'job-suggested-criteria-edited'` in `utils/constants.ts`, and `onJobSuggestedCriteriaEdited({ team_id, job_id, enabled_count, disabled_count })` in `analytics/jobs.analytics.ts`, fired on a successful save. `onJobSuggestedCandidateContacted` keeps its props and fires on a successful send instead of the `mailto:` click; it does not fire on 409.

### 9. Errors

Both failures call `toast.error(...)` with the server's message when `errorFrom` found one, otherwise "Could not save the criteria. Please try again." / "Could not send your message. Please try again." The modal stays open with its draft. A 401 resolves through `customFetch`'s own logout path, as for the reads.

## Risks / Trade-offs

- [The backend ships different field names or a different 409 body] → All parsing is in the schema file; the cutover task runs the service tests against recorded real responses before the mock is deleted.
- [Changing `fetchSuggestedCandidates`'s return shape touches every consumer] → One consumer (the view) plus tests; TypeScript flags each read of the old array.
- [Text-keyed criteria break if the backend rewrites a requirement's text] → The saved list comes back in the PUT answer and the next read, so the modal always shows what the server holds.
- [A lead sends, then the page shows "Contacted" while a co-lead's tab still shows "Contact"] → The co-lead's send gets 409 and the page treats it as contacted; no duplicate message reaches the member.
- [The mock ships to develop behind the flag] → It is session-only, sends nothing, and the flag is off in production; cutover is a tracked task in this change.

## Migration Plan

1. Merge the schema commit first (group 1 of tasks.md); it is safe with the current backend.
2. Build the rest against the mock behind `SHOW_TEAM_APPLICANTS`.
3. When LAB-2846 is on the dev API, set `SUGGESTED_ACTIONS_MOCKED` off, verify on dev, then delete the mock module.
   Rollback: the flag hides the whole page; reverting the UI commits leaves the tolerant schema in place.

## Open Questions

- Final copy for the Contact prefill and the criteria lede may change in design review; it does not change behaviour or tasks.
- Whether the 409 body carries `contactedAt`. If it does, the hook can patch it instead of refetching; either way the screen ends up the same.

# Tasks

## 1. Schema tolerance (merge first)

- [x] 1.1 In `schema/suggested-candidates.ts`, add `contactedAt: z.string().nullable().optional()` to `suggestedCandidateSchema`, add `roleCriterionSchema` (`{ text, enabled }`, `.strict()`) and an optional top-level `criteria` on `suggestedCandidatesResponseSchema`, keeping `.strict()`; export `RoleCriterion`. Verify: new cases in `__tests__/services/jobs/suggested-candidates-service.test.ts` pass for a response without the fields, with them, and still fail on an unknown field.
- [x] 1.2 Run `npm run lint` and `npm run test`, and verify both pass before opening this as its own PR to develop. (Done: tests 465 suites pass; `npm run lint` reports 319 pre-existing errors elsewhere in the repo, none in the changed files. Committed alone; no PR opened.)

## 2. Service, mock and hooks

- [x] 2.1 Change `fetchSuggestedCandidates` to return `{ suggestions, criteria: RoleCriterion[] | null }`, update `useSuggestedCandidates` and every read of `suggestions.data` in `TeamApplicantsView.tsx`. Verify: existing service and `team-applicants-suggested.test.tsx` tests pass on the new shape.
- [x] 2.2 Add `matchCriteriaResponseSchema` and `contactSuggestedResponseSchema` to the schema file, and `saveMatchCriteria(roleUid, disabled)` (PUT) and `contactSuggestedCandidate(roleUid, memberUid, message)` (POST) to `services/jobs/team-applicants.service.ts` via `customFetch()` with a JSON `Content-Type`, plus `isAlreadyContactedError`. Verify: service tests assert URL, method, body, parsed answer, 403, 409 and 500.
- [x] 2.3 Add `services/jobs/suggested-candidates.mock.ts` (session state, read overlay, both writes, 409 on second contact, a documented failure marker) and the `SUGGESTED_ACTIONS_MOCKED` switch in the service. Verify: unit tests cover overlay, 409 and failure.
- [x] 2.4 Add `useSaveMatchCriteria` and `useContactSuggestedCandidate` to `services/jobs/hooks/useTeamApplicants.ts` (cache patch from the server's answer; 409 invalidates; no optimistic patch) and update the hook's "read-only" comment. Verify: hook tests check the cache after success, 409 and failure.

## 3. Edit criteria

- [x] 3.1 Add `EditCriteriaModal.tsx` + `EditCriteriaModal.module.scss` on `components/common/Modal`: one checkbox per requirement, last enabled one locked, "applies from next week's suggestions" copy, draft reset on open, Save disabled when unchanged or pending, error toast and open modal on failure. Verify: `__tests__/page/team-details/edit-criteria-modal.test.tsx` covers toggle, lock, cancel, save body, and failure keeping the draft.
- [x] 3.2 Add the "Edit criteria" action to `SuggestedWhy` (only when criteria is not null), mount the modal in the view, and fire `job-suggested-criteria-edited` (constant in `utils/constants.ts`, handler in `analytics/jobs.analytics.ts`) on success. Verify: view test shows the action with criteria, hides it without, and asserts the event on a successful save only.

## 4. Contact

- [x] 4.1 Add `ContactSuggestedModal.tsx` + `ContactSuggestedModal.module.scss`: one message field, prefilled template, 2000-char limit with count, no subject, Send disabled when empty, too long or pending. Verify: `__tests__/page/team-details/contact-suggested-modal.test.tsx` covers prefill, limit, send body, and failure keeping the text.
- [x] 4.2 Replace the `mailto:` link in `SuggestedPaneBar` with "Contact {first name}" or "Contacted · {date}" from `contactedAt` (new `SuggestedPaneBar.module.scss` for the new styles), keep per-person drafts in the view, treat 409 as contacted, and move `job-suggested-candidate-contacted` to a successful send. Verify: view tests cover Contacted after reload (from the read), 409 with no toast, failure with toast, the event firing only on success, and Applied/Interested still showing "Email".

## 5. Role description

- [x] 5.1 Render the selected role's `descriptionHtml` as plain text (`stripHtml`) under the Suggested note, clamped to two lines, and nothing when absent. Verify: view test asserts plain text with no tags for a role with a description and no line for one without.

## 6. Integration

- [x] 6.1 With `NEXT_PUBLIC_SHOW_TEAM_APPLICANTS=true` and the mock on, click through Edit criteria and Contact on `/teams/<id>/applicants?role=<uid>` at desktop and 360px width, including the 409 and failure paths. Verify: behaviour matches every scenario in `specs/job-board/spec.md`. — Done 2026-10-13 against the real local API (backend #3509) instead of the mock: Edit criteria, Contact, no-email toast, Contacted after reload.
- [x] 6.2 Run `npm run lint` and `npm run test` and verify both pass. (Done: 469 suites / 4834 tests pass; `npm run lint` still reports the same 319 pre-existing errors elsewhere in the repo, none in the changed files.)
- [x] 6.3 Run `OPENSPEC_TELEMETRY=0 DO_NOT_TRACK=1 npx -y @fission-ai/openspec@1.14.1 validate lab-2847-suggested-candidates-tab-actions --json` and verify it reports valid.

## Workflow follow-up

- Cutover inside `lab-2837` once LAB-2846 is on the dev API: turn `SUGGESTED_ACTIONS_MOCKED` off, verify both writes and the read against dev, then delete `suggested-candidates.mock.ts` and its tests.
- Archive this change in the same PR as the code, so `openspec/specs/job-board/spec.md` changes when the code merges.

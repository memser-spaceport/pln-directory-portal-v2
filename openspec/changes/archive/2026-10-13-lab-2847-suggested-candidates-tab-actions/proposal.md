# Proposal

## Why

[LAB-2847](https://linear.app/protocollabs/issue/LAB-2847) (part of Goal [LAB-2837](https://linear.app/protocollabs/issue/LAB-2837)): the Suggested tab on a team's Candidates page shows who matches a role, but a lead can only read it. The lead cannot say which requirements matter, and the only way to reach a suggested member is a `mailto:` link that leaves the platform and records nothing. The backend half ([LAB-2846](https://linear.app/protocollabs/issue/LAB-2846)) adds criteria and contact endpoints. This change is the frontend half, built against mocks of that contract so it can merge to develop before the backend.

## What Changes

- The suggested-candidates response schema accepts two new optional fields: `contactedAt` on each suggestion and a top-level `criteria` list (`{ text, enabled }`). This lands first, so the page keeps working against both the old and the new backend.
- The Suggested tab shows a short description of the selected role, taken from the role the page already loads, cut to two lines.
- The "Why suggested" pane gets an "Edit criteria" action. It opens a modal that switches the role's requirements on or off and saves them (`PUT /v1/job-openings/:roleUid/match-criteria`). The modal says the change applies from next week's suggestions. The last enabled requirement cannot be switched off. There is no free-text field.
- On the Suggested tab only, the `mailto:` "Email" button becomes "Contact". It opens a message modal with one prefilled message field (up to 2000 characters, no subject). Send posts the message through the platform (`POST /v1/job-openings/:roleUid/suggested-candidates/:memberUid/contact`). The button then reads "Contacted · <date>" from `contactedAt`, also after a reload. A 409 answer counts as already contacted.
- A failed criteria save or send shows an error toast, keeps the earlier screen state, and keeps the modal open with the lead's input.
- Analytics: new event `job-suggested-criteria-edited`. The existing `job-suggested-candidate-contacted` moves from the `mailto:` click to a successful send.
- All of this stays behind the existing `SHOW_TEAM_APPLICANTS` flag.

## Out of scope

- "Good match" / "Not a match" rating and the "What didn't fit?" note. These wait for Anuj's confirmation (and overlap LAB-2817).
- Returning a signed-out lead to the same role and person after sign-in. That is LAB-2818.
- The backend endpoints themselves (LAB-2846), and any change to how the matcher uses criteria.
- Free-text criteria ("in the lead's own words"), the prototype's "N members would show" footer, and any change to the Applied and Interested tabs, which keep their "Email" button.
- Changes to `proxy.ts`, `utils/fetch-wrapper.ts`, cookies or tokens.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `job-board`: adds requirements for the team's Suggested candidates tab: the role description, editing match criteria, contacting a suggested member, and tolerating a suggestions response with or without the new fields. No existing requirement changes.

## Impact

- Schema: `schema/suggested-candidates.ts` (two optional fields, a criteria schema, response schemas for the two writes).
- Services: `services/jobs/team-applicants.service.ts` (the read returns criteria too; two new writes), a temporary mock module for the two writes until LAB-2846 lands, `services/jobs/hooks/useTeamApplicants.ts` (two mutations).
- UI: `components/page/team-details/TeamApplicants/` (view, `SuggestedWhy`, `SuggestedPaneBar`, two new modals with their SCSS modules).
- Analytics: `analytics/jobs.analytics.ts`, `utils/constants.ts`.
- Tests: `__tests__/services/jobs/suggested-candidates-service.test.ts`, `__tests__/page/team-details/team-applicants-suggested.test.tsx`, new modal tests.
- API dependency: LAB-2846 endpoints and fields. Writes are lead/admin only (403 otherwise).

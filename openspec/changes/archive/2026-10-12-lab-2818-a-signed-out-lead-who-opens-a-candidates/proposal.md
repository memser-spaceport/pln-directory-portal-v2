# Proposal

## Why

[LAB-2818](https://linear.app/protocollabs/issue/LAB-2818): a signed-out lead who opens a Candidates link goes to sign-in and then comes back to the same role, tab and person.

Today a signed-out visitor to a team's Candidates page link (`/teams/<id>/applicants?role=...&suggested=...`) goes to the team profile, and the role and person in the link are lost. The weekly email to team leads (LAB-2820, decided in the spike LAB-2809) links to this page, and the page is only for signed-in users, so the link must survive sign-in.

## What Changes

- With the Candidates feature on, a signed-out visitor to a Candidates page link goes to sign-in, not to the team profile.
- The sign-in return link keeps only the `role`, `candidate` and `suggested` fields of the Candidates link. After sign-in, the visitor comes back to the same role, tab and person.
- With the Candidates feature off, a signed-out visitor still goes to the team profile.
- A signed-in person who is not a lead of the team (and is not a Directory admin) still goes to the team profile.
- The page never shows candidates to a signed-out visitor.

Out of scope: the sibling tickets under LAB-2809 (LAB-2817 good match / not a match, LAB-2819 email prototype, LAB-2820 weekly email, LAB-2821 email setting); the old-slug team redirect keeping the query; sign-in internals, cookies, sessions and tokens.

## Capabilities

### New Capabilities

### Modified Capabilities
- `job-board`: adds a requirement for the team Candidates page: who can open it, and where a signed-out visitor goes.

## Impact

- Team Candidates page (`/teams/<id>/applicants`): the signed-out path now goes to the existing sign-in screen (`/members?backlink=...#login`) and returns to the page.
- No API change. The sign-in flow and the team profile do not change.

# Proposal

## Why

[LAB-3123](https://linear.app/protocollabs/issue/LAB-3123) (Goal [LAB-2609](https://linear.app/protocollabs/issue/LAB-2609)): the member interest profile needs to know which members, teams and projects a logged-in member looks at and contacts. Today these actions exist only as browser analytics events, so the backend has no per-member record of them. The directory API now takes them at `POST /v1/member-signals` (pln-directory-portal, change `member-interest-profiles`).

## What Changes

- A signed-in member's views of member, team and project pages are sent to the member signal log, once per page mount (the API keeps one per entity per day).
- Contact and social link clicks and copies of contact details on a member's contact block, GitHub project clicks on a member page, team contact clicks, project link clicks and member/team/project search result clicks are sent too, beside the existing analytics calls.
- Calls are fire-and-forget: logged-out visitors send nothing, a failed call never changes the page or shows an error, and the existing analytics events stay as they are.

## Capabilities

### New Capabilities

### Modified Capabilities
- `profiles`: adds a requirement that signed-in views and clicks on profiles are recorded and never change the page.

## Impact

- New `services/member-signals/member-signals.service.ts`, `types/member-signals.types.ts`, `components/core/MemberSignalViewTracker`.
- Calls added in the member, team and project detail pages, `ContactDetails`, the member repo card, `TeamContactInfoView`, project `hyper-links` and the search `ResultItem`.
- Server HTML does not change: the tracker renders nothing.

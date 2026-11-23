# Proposal

## Why

[LAB-3351](https://linear.app/protocollabs/issue/LAB-3351) (Goal [LAB-3345](https://linear.app/protocollabs/issue/LAB-3345)): the digest page address carries the member's signed link token (`/digest?t=…`), and the token decides whose digest it is and whose More / Less it saves. A forwarded or copied link reads the sender's digest and acts for the sender. The backend now opens an issue by its id and saves only for the signed-in member ([LAB-3356](https://linear.app/protocollabs/issue/LAB-3356)); the page moves to that.

## What Changes

- The page address becomes `/digest?issue=<issue id>`. It reads the issue signed in or signed out; the reader's own data (name, topics, choices, follows, past issues) shows only when signed in.
- An email link `/digest?t=<token>[&issue=<send time>]` still works: the server swaps the token for the issue id, and the browser address changes to `?issue=<id>` at once, keeping every other parameter and the `#story-` / `#post-` anchor.
- More / Less needs sign-in. A signed-out press opens the sign-in prompt (LAB-3347: a dialog that names the press, with Sign up and Sign in) and saves nothing; back from sign-in, the press is saved once for the signed-in member.
- An old email More / Less link (`choice=` + `story=`) saves for the signed-in member; signed out it asks for sign-in first, then saves. (New emails have no More / Less: LAB-3357.)
- The footer's "Manage preferences" and "Unsubscribe" open `/settings/email`. Past issues link to `?issue=<id>`.
- A new event `digest-sign-in-prompted` when a press asks for sign-in.
- The page no longer calls the token routes `page` and `choices` (`choices` now answers 410).
- Out of scope: the email (`pl-notification-service`); `/digest/email?t=` and its footer page (keeps the token, LAB-3309); the new topics section and the designed signed-out state (LAB-3348); the sign-in prompt on forum rows (LAB-3348).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `digest`: the page address and who the page reads for; More / Less and the email's choice links need sign-in; footer and Past issues links; the token-free analytics rule; the broken-link states.

## Impact

- Code: `app/digest/page.tsx`, `components/page/digest/DigestPage.tsx`, `DigestFeedbackButtons.tsx`, `DigestPastIssuesCard.tsx`, `services/digest/digest.service.ts` and `digest.types.ts`, `services/digest/hooks/useDigestChoices.ts`, `analytics/digest.analytics.ts`, `utils/constants.ts`, tests under `__tests__/page/digest/` and `__tests__/services/digest/`.
- API: `POST v1/labos-digest/exchange`, `issue-page`, `issue-choices` (LAB-3356); the page stops calling `page` and `choices`.
- Ships with LAB-3356 in the same release, backend first.

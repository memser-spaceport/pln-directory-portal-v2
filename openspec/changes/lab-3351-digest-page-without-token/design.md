## Context

`app/digest/page.tsx` reads `t` and `issue` (a send time) from the address and calls `getDigestPage(token, issue)` (`POST v1/labos-digest/page`) on the server. `DigestPage` gets the token and passes it to `useDigestChoices(token, stories, issue)`, which posts `choices` with it, to the footer's `/digest/email?t=` links and to the Past issues rows (`?t=…&issue=<sentAt>`). The email's More / Less links land with `story=` + `choice=`, and `land()` saves them after load. Sign-in intents already exist: `goToLogin({ key, value })` pushes `#login` with `topics` / `topic` / `postnews` in the address, a signed-in load applies and strips them, and `isPrivyOAuthReturn()` stops a second sign-in during a Google or GitHub return (LAB-3308).

LAB-3356 adds `exchange` (token → `issueUid`), `issue-page` (optional sign-in, reader's own data) and `issue-choices` (sign-in required), and makes `choices` answer 410.

## Goals / Non-Goals

**Goals:**
- No token in the browser address, in any request after the first server render, in links the page renders, or in analytics.
- Old email links keep working, anchor included.
- More / Less saves only for the signed-in reader; a signed-out press leads through sign-in and is saved once after it.

**Non-Goals:**
- The topics section redesign and the designed signed-out state, including a sign-in prompt on forum rows (LAB-3348).
- `/digest/email?t=` (LAB-3309) and the email (LAB-3357).

## Decisions

1. **Swap on the server, rewrite the address in the browser.** With `t`, the server page calls `exchange` (token in the POST body, `cache: 'no-store'`), then reads the issue like a `?issue=` load. The client rewrites the address with `window.history.replaceState(null, …)` (null state: the Next `__NA` trap), dropping `t` and the send-time `issue`, setting `issue=<uid>`, keeping the rest and the hash. *Alternative:* a server redirect to `?issue=` — rejected: browsers never send the `#story-` anchor to the server, so a redirect loses it.

2. **Read with the reader's session on the server.** `getDigestIssuePage(issueUid, authToken)` posts `issue-page` with `Authorization: Bearer <authToken>` from `getCookiesFromHeaders()` when there is one, `cache: 'no-store'`, as `services/follow/follow.service.ts` does. The reader's data is in the first render, no client refetch.

3. **Saves through `customFetch`.** `saveDigestIssueChoice(issueUid, newsItemUid, choice)` posts `issue-choices` with `customFetch()` (token refresh and retry on 401). `useDigestChoices(issueUid, stories)` no longer takes a token.

4. **A signed-out press is a sign-in intent with `story` + `choice`.** `goToLogin` gains a two-parameter intent (`story=<uid>&choice=more|less`). Back signed in, the existing landing (`land()`) saves it once and strips both, exactly as for an old email link, so one code path handles both. An old email link opened signed out starts the same sign-in once on load, unless `isPrivyOAuthReturn()`.

5. **Footer to `/settings/email`.** It needs sign-in, so a forwarded page can't change the sender's settings. The email's own footer keeps the signed `/digest/email` links.

6. **Past issues by uid.** Rows link to `?issue=<uid>`. A row whose `uid` is null (not recorded) is not linked; after an exchange the issue on show is always recorded.

7. **Keep `referrer: 'no-referrer'` and the `t` strip in analytics**: the first load of an email link still has `t` in the address until the rewrite.

## Risks / Trade-offs

- **The first server render still sees `t`** → it is used once for `exchange` and never echoed into the HTML; the address is rewritten on mount; analytics strips `t`.
- **Fewer More / Less saves** (sign-in needed) → accepted (LAB-3345 decision 3); `digest-sign-in-prompted` measures the drop-off.
- **Deploy gap with the backend** → backend first; until the frontend is out, the old page's More / Less gets 410 and shows the existing error toast.
- **Auto sign-in on load for old email choice links** can fight an OAuth return → guarded by `isPrivyOAuthReturn()` (LAB-3308 lesson).

## Migration Plan

Ship with LAB-3356 in one release, backend first. No data migration. Rollback: revert frontend and backend together (the old page needs the token `choices` route back).

## Open Questions

None for this change. The signed-out look and the forum-row prompt come with LAB-3348.

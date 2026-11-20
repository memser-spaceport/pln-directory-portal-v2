## 1. Service and types

- [ ] 1.1 `services/digest/digest.types.ts`: nullable `firstName`; past issue `uid`; forum post `locked` with nullable HTML and author (LAB-3356 contract)
- [ ] 1.2 `services/digest/digest.service.ts`: `exchangeDigestLink(token, issue?)` → `{ issueUid }` or the error kind (`expired` / `invalid`); `getDigestIssuePage(issueUid, authToken?)` with Bearer and `cache: 'no-store'`; `saveDigestIssueChoice(issueUid, newsItemUid, choice)` through `customFetch`. Remove `getDigestPage` and `saveDigestChoice`

## 2. Page

- [ ] 2.1 `app/digest/page.tsx`: with `t`, exchange then read; with `issue` (an id), read; neither → the "couldn't open" state; unknown issue → same; expired → the expired state. Pass `issueUid` (no token) to `DigestPage`
- [ ] 2.2 `DigestPage`: on mount, rewrite the address to `?issue=<uid>` (drop `t` and a send-time `issue`, keep other params and the hash) with `replaceState(null, …)`
- [ ] 2.3 `useDigestChoices(issueUid, stories)`: save through `saveDigestIssueChoice`; no token anywhere
- [ ] 2.4 Signed-out press: `goToLogin` with `story` + `choice`, record `digest-sign-in-prompted`; button stays not pressed
- [ ] 2.5 Landing with `story` + `choice`: signed in → save once and strip (as today); signed out → start sign-in once (`via: email-choice`), not during `isPrivyOAuthReturn()`
- [ ] 2.6 Footer links → `/settings/email` with the existing `utm_source` values
- [ ] 2.7 Past issues rows → `?issue=<uid>`; no link for a row without a uid
- [ ] 2.8 Greeting "Hi there," when `firstName` is null (check the header already does)

## 3. Analytics

- [ ] 3.1 Add `digest-sign-in-prompted` (`via`, `news_id`) to `analytics/digest.analytics.ts` and the `utils/constants.ts` event constant

## 4. Tests

- [ ] 4.1 Page tests: `?t=` swaps and rewrites the address keeping params and the anchor; `?issue=` reads with and without a session; expired and unknown issue states
- [ ] 4.2 Choices: signed-in press saves via `issue-choices`; signed-out press opens `#login` with `story` + `choice` and saves nothing; landing signed in saves once; landing signed out starts sign-in once and not during an OAuth return
- [ ] 4.3 No token in any request body after the exchange, in rendered links, or in analytics properties
- [ ] 4.4 Footer and Past issues links
- [ ] 4.5 Mutation-check the sign-in gate and the address rewrite
- [ ] 4.6 `npm run lint`, `npm run test` (digest suites), `npx tsc --noEmit` on the changed files, and `openspec validate --json`

## 5. Verify and ship

- [ ] 5.1 On the `lab-3345` feature env with a minted env link: email link → address rewritten; signed out: no member data, More opens sign-in, saved after it; signed in as another test member: their own data; footer → `/settings/email`
- [ ] 5.2 Archive this change in the frontend PR into `lab-3345`

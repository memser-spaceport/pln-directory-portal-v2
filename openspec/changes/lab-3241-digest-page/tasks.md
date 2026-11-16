## 1. Data

- [ ] 1.1 Add `services/digest/digest.service.ts`: `getDigestPage(token)` (server, `fetch` with `cache: 'no-store'`, returns data or `{ error: 'expired' | 'invalid' | 'unavailable' }`) and `saveDigestChoice(token, newsItemUid, choice)`. Add the types from the backend contract.
- [ ] 1.2 Add `services/digest/constants.ts` (mutation key enum) and `services/digest/hooks/useDigestChoice.ts` (optimistic press, rollback, error toast).

## 2. Page

- [ ] 2.1 Add `app/digest/page.tsx` (Server Component): await `searchParams`, read `t`, load the page, render the error state or `DigestPage`. Metadata: title, `robots` noindex/nofollow, `referrer: 'no-referrer'`.
- [ ] 2.2 Add `app/digest/loading.tsx` with a card skeleton.
- [ ] 2.3 Port the prototype into `components/page/digest/` (page, story card, forum post, feedback buttons, receipt, header, error state). Drop the view switch and mock copy. Render HTML through `SafeHtml`. Add `rel="noopener noreferrer"` on source links.
- [ ] 2.4 Landing choice: in a client effect with a ref guard, send the URL choice once, show the receipt at the top of the card, then remove `story` and `choice` from the address without breaking Next's history state.
- [ ] 2.5 Hash scroll for `#story-` and `#post-`, with no mark, and no error for an unknown id.

## 3. Analytics

- [ ] 3.1 Add the `ON_DIGEST_*` constants and `analytics/digest.analytics.ts` (page viewed, story read, more, less, undo), plus the email click capture with `link_type` using the existing digest email click events.
- [ ] 3.2 Add `t` to the params that `stripLoginParamsFromEvent` removes, and extend its test.

## 4. Tests

- [ ] 4.1 Jest: the service (ok, 401 expired, 401 other, 503), and the page states: list in order, top story badge, forum unavailable, error states.
- [ ] 4.2 Jest: the landing choice is saved once (including under Strict Mode), the receipt is at the top, the press shows the receipt under the buttons, a second press undoes with a toast, a failed save rolls back with an error toast, and posts have no buttons.
- [ ] 4.3 Jest: events fire with the right properties, and no event property contains the token.

## 5. Ship

- [ ] 5.1 Run `npm run lint`, `npx tsc --noEmit` on the changed files, and `npm run test`.
- [ ] 5.2 Run `openspec validate --json`.
- [ ] 5.3 On the `lab-3241` env, with a token minted locally with the env's throwaway secret, check desktop and 375px: the landing More and Less, Read more, the press, Undo, the expired state, and no console errors.

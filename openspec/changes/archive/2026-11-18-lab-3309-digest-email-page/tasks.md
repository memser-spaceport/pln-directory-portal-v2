## 1. Data

- [x] 1.1 `digest.types.ts` and `digest.service.ts`: read on the server (`expired` / `invalid` / `unavailable` like `getDigestPage`) and change from the client

## 2. Page

- [x] 2.1 `app/digest/email/page.tsx`: server read, noindex, no Referer, error state
- [x] 2.2 `components/page/digest/email/DigestEmailSettings.tsx` + styles: greeting, status, main button from `link_type`, controls, confirmation with Undo, save failed, links to email preferences and the digest
- [x] 2.3 Already-in-that-state messages for unsubscribe and switch

## 3. Analytics

- [x] 3.1 Event names in `utils/constants.ts`; `digest.analytics.ts` functions; no token in properties

## 4. Check

- [x] 4.1 Tests: no change on load, each main button, Undo, failed save, already off / already weekly, expired and invalid links, events
- [x] 4.2 `tsc`, lint, prettier on changed files; local check against a mocked API at 375 px and desktop

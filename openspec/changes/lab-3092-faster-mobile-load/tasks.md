# Tasks

## 1. Baseline

- [x] 1.1 Measure the current `lab-3083` feature env with Lighthouse mobile, 3 runs each, signed out: `/home`, `/jobs` and one member profile. Record the median TBT and LCP, the JS transferred per host, and whether `auth.privy.io` appears. Verify: a table with the numbers is saved, and later pasted into the PR.

## 2. Privy layer split (design 1, 2, 8)

- [x] 2.1 Move `PrivyProvider`, `PrivyModals` and `AuthInfo` into a new Privy layer module, imported by the `AuthBox` shell through `next/dynamic` (`ssr: false`). The shell keeps the `#login` hash effects, `LoginTokenRedeemer` and `AuthInvalidUser`. Verify: no module the shell imports statically imports `@privy-io/react-auth` as a value (grep), and `npm run build` succeeds.
- [x] 2.2 Change `useAuthTokens` to `import type { User }`. Verify: the grep in 2.1 finds no value import of `@privy-io/react-auth` outside the layer.
- [x] 2.3 In the shell, render the layer when the viewer is signed in, the hash is `#login`, or Privy demand has been signalled. Once rendered, keep it rendered for the page's life. Verify: a jest test of the shell covers each of the three triggers, and that the layer is not removed after `#login` is cleared.
- [x] 2.4 Add the build-time switch `NEXT_PUBLIC_EAGER_PRIVY=true`, which always renders the layer, and document it in `.env.example`. Verify: a jest test shows the layer rendered for a signed-out viewer with the switch on.

## 3. Queue and replay of Privy events (design 3, 4)

- [x] 3.1 In `authEvents`, keep `auth:init-login`, `auth:link-account`, `auth:update-email` and `auth:logout` in a pending queue when they are emitted with no listener, and notify a demand subscriber. Verify: unit tests show queued while unheard, delivered directly when heard, and in emission order.
- [x] 3.2 In `PrivyModals`, once its listeners are registered and Privy is `ready`, drain the queue and re-emit each event. Verify: a unit test with a mocked Privy that is not ready replays nothing until `ready` turns true, then replays everything once.
- [x] 3.3 Make `AuthInfo` start its sign-in sequence only after Privy is `ready`, with the loading overlay showing meanwhile. Verify: a unit test shows no Privy `logout`/`login` call before `ready`, and that the sequence runs once after it.
- [x] 3.4 Load the Privy layer's chunk on hover, focus or touchstart of the Sign in control (design 5). Verify: locally, in DevTools Network, the chunk is requested on hover before any click and is not requested when nothing is hovered.

## 4. Page fixes (design 6, 7)

- [x] 4.1 Member page: for signed-out views, preload `/images/members/contact-details-overlay.png` from the server with high fetch priority. Verify: the member page response names the image for preload with high priority. React sends it as an HTTP `Link: </images/members/contact-details-overlay.png>; rel=preload; as="image"; fetchpriority="high"` header, which the browser reads before the HTML.
- [x] 4.2 `/home`: add `loading="lazy"` to images below the fold and `width`/`height` to every image, following Lighthouse's `offscreen-images` and `unsized-images` lists. Verify: both audits pass on `/home`, and a screenshot at 1280 px and 390 px shows no layout change.
- [x] 4.3 `/jobs`: confirm the signed-out headline's text in the server HTML equals its text after hydration, so LCP is not restarted. Fix any difference. Verify: the server HTML and the post-hydration DOM give the same string in a Playwright check.

## 5. Verification

- [x] 5.1 Locally, signed out, load `/home`, `/jobs`, a member profile, `/teams` and a team profile. Verify: no request to `auth.privy.io` and no Privy chunk in DevTools Network.
- [x] 5.2 Run `npm run lint` and `npm run test`. Verify: no new failures against `lab-3083`.
- [x] 5.3 Run `openspec validate lab-3092-faster-mobile-load --json`. Verify: the result reports valid.
- [ ] 5.4 Deploy to the `lab-3083` feature env and repeat 1.1. Verify:
  - signed-out `/home`, `/jobs` and a member page make no `auth.privy.io` request;
  - the before/after table is in the PR;
  - any budget miss is listed with its remaining long tasks by script.
- [ ] 5.5 Run the auth checklist on the feature env, then hand it to Roma. Verify: each item passes, recorded in the PR.
  - Sign-in with email, Google, GitHub and wallet.
  - Prefilled sign-in email.
  - A `?loginToken=` link.
  - A dismissed sign-in, then a retry.
  - Sign-in with a non-member email (error dialog).
  - Sign-out from the account menu.
  - Sign-out in one tab signs out the other tabs.
  - Sign-out after a failed refresh (an expired session).
  - Account linking (email, Google, GitHub, wallet).
  - Email change.
  - Signed-in pages still show the session.
- [x] 5.6 Check the build-time switch: build with `NEXT_PUBLIC_EAGER_PRIVY=true` locally. Verify: signed-out pages request `auth.privy.io` again, as today.

## Workflow follow-up

- Archive this change (`/opsx:archive`) in the same PR as the code, so `openspec/specs/auth` and `openspec/specs/runtime-platform` change only when the code merges.
- If the TBT budget is still missed after 5.4, open a follow-up ticket for the remaining scripts (React hydration, PostHog), with the measured long tasks.

# Design

## Context

See proposal.md (Why) for the measurements. The facts that shape the approach, read from the code and from production on 2026-11-03:

- **Where Privy mounts.** `app/layout.tsx` renders `AuthBox` for every visitor. It is a client-only dynamic import, but it is always mounted, so the Privy SDK chunk loads on every page view:
  - about 640 KB transferred (2.1 MB unzipped), the largest script on `/home` and `/jobs`;
  - plus about 990 KB from `auth.privy.io`, for the iframe and its config.
- **What `AuthBox` holds.** `PrivyProvider` wraps four children:

  - `PrivyModals`, which handles the auth events;
  - `AuthInfo`, the `#login` loading overlay that starts a sign-in;
  - `LoginTokenRedeemer`;
  - `AuthInvalidUser`.

  It also runs two effects on the `#login` hash: one strips it for signed-in viewers, the other clears it when a login attempt fails.

- **The session is ours, not Privy's.** The proxy validates and refreshes our cookies. Privy is used only to sign in, to link accounts, to change email, and to sign out.
- **One path into Privy.** Every caller goes through the `authEvents` bus. Only `PrivyModals` and its hooks call Privy:
  - Sign in pushes `#login`. `AuthInfo` then emits `auth:init-login`, and `PrivyModals` calls `login()`.
  - Seven places emit `auth:logout`: the account menu, the user profile menu, the fetch wrapper after a failed refresh, `UserInfoChecker`, `UserInfoValidator`, SPV Spotlight, and the forced-logout paths. Account linking emits `auth:link-account`, and email change emits `auth:update-email`.
  - `PrivyModals` handles each one with Privy (`logout()`, `linkEmail()`, …), and Privy's callbacks emit the `*-success` and `*-error` events.
- **No Privy needed.**
  - `LoginTokenRedeemer` swaps a `?loginToken=` for our own session (`redeemLoginToken` and `saveSessionTokens`) without Privy. `useAuthTokens` imports Privy's `User` only as a type.
  - `AuthInvalidUser` renders our error modals from `auth:invalid-email`.
- **`/jobs`.** The signed-out headline that is the LCP element is already in the server HTML ("20 PL network teams are hiring…"). Lighthouse's own breakdown puts its timing at TTFB 213 ms plus render delay 1,667 ms. The 12.3 s is the simulated phone waiting behind JavaScript.
- **Member page.** The LCP element is `.bg2` in the contact-details panel, painted from `background: url('/images/members/contact-details-overlay.png')`. The breakdown shows 1,244 ms of resource load delay, because the browser only finds the URL after the CSS arrives.
- **The other big scripts:** React (1.2–1.8 s of CPU in the simulation) and PostHog (179 KB). Both are out of scope.

## Goals / Non-Goals

**Goals:**

- A signed-out page view loads no Privy code and makes no `auth.privy.io` request, unless the visitor starts to sign in.
- Every auth flow behaves as it does today. See specs/auth.
- A rollback that needs no code change.

**Non-Goals:**

- Reducing React's or PostHog's cost.
- Changing the order or appearance of the sign-in dialog.
- Changing when the session cookies are set or cleared.

## Decisions

### 1. Split `AuthBox` into a light shell and a lazy Privy layer

- **The shell** stays mounted for everyone, on the same layout slot. It holds the two `#login` hash effects, `LoginTokenRedeemer` and `AuthInvalidUser`, none of which needs Privy.
- **The Privy layer** holds `PrivyProvider`, `PrivyModals` and `AuthInfo`. The shell imports it with `next/dynamic` (`ssr: false`), so it is a separate chunk that is requested only when the layer first renders.
- `useAuthTokens` switches to `import type { User }`, so the shell cannot pull the SDK in through a value import.

**Alternative considered:** keep one `AuthBox` and render `PrivyProvider` conditionally inside it. Rejected: `AuthBox`'s module would still statically import `@privy-io/react-auth`, so the chunk would still load. The split has to be a module boundary.

### 2. When the Privy layer mounts, and that it stays

The shell renders the layer as soon as any of these holds:

- the server says the viewer is signed in (today's behaviour for members);
- the hash is `#login`;
- the address carries Privy's OAuth return parameters (`privy_oauth_*`), because Google and GitHub sign-in leave the site and Privy completes the sign-in from them when it loads (_added after env testing: the first build dropped these sign-ins_);
- an auth event that needs Privy has been emitted (decision 3).

Once rendered, it stays mounted for the life of the page. It must not unmount when a failed or dismissed sign-in clears `#login`. Privy's callbacks for that attempt, and the next attempt, need the provider to stay up, and remounting would re-initialise the SDK.

### 3. Requests that reach Privy before it has loaded are queued, then replayed

`authEvents` gains a small "needs Privy" rule:

- **Which events:** `auth:init-login`, `auth:link-account`, `auth:update-email` and `auth:logout`.
- **When one is emitted with no listener registered,** the emitter keeps it in a pending queue and notifies a demand subscriber, which the shell uses to mount the layer.
- **Replay:** once `PrivyModals` has registered its listeners and Privy reports `ready`, it drains the queue and re-emits each pending event in order.

Today those events are emitted only while `PrivyModals` is listening. So the rule changes nothing for signed-in members, and makes the signed-out cases correct. One example of such a case is the fetch wrapper signing out a stale session on a page rendered as signed out.

**Alternative considered:** have each emitter `await` a "Privy loaded" promise. Rejected: seven or more call sites would change, and a new emitter could forget. Putting the rule in the bus keeps the call sites as they are.

### 4. Sign-in waits for Privy to be ready, not merely mounted

With the layer mounting at the moment Sign in is chosen, `AuthInfo` starts its sequence (clear local state, Privy `logout()`, create the state uid, emit `auth:init-login`) before Privy is ready. `AuthInfo` therefore waits for Privy's `ready` before starting; its loading overlay already covers the wait. The replay in decision 3 also waits for `ready`.

### 5. The Privy chunk is prefetched on sign-in intent, not at idle

To keep the first dialog from waiting on a cold download:

- the Sign in control imports the layer's module on hover, focus or touchstart;
- this downloads the chunk and runs its top-level code, but does not render Privy or contact `auth.privy.io`;
- nothing is prefetched at idle time.

An idle prefetch would bring the 640 KB back into every page view's network budget, and it often lands while Lighthouse is still measuring. The hover import costs some main-thread time, but only for a visitor who is about to sign in.

_Changed during implementation:_ the plan said the chunk would be downloaded without being executed. A dynamic `import()` does both; a download-only hint would need the chunk's hashed URL, which the app cannot read.

### 6. Member page: preload the overlay image from the server

The member page's server component calls React's `preload()` for `/images/members/contact-details-overlay.png` with `as: 'image'` and `fetchPriority: 'high'`, for signed-out views (the ones that render the panel). The CSS stays as it is.

**Alternative considered:** replace the CSS background with an `<img>`. Rejected for now: the element layers two backgrounds with `background-blend-mode`, which an `<img>` cannot reproduce without restyling, and the preload gets the same early discovery without any visual change.

### 7. `/home` images: lazy below the fold, sized everywhere

Lighthouse's `offscreen-images` and `unsized-images` audits list the images to change.

- Images below the fold get `loading="lazy"`.
- Every image gets `width` and `height`; images that already use `next/image` have them.
- Images above the fold stay eager.

### 8. A build-time kill switch

If `NEXT_PUBLIC_EAGER_PRIVY=true` is set at build time, the shell mounts the Privy layer for everyone, which is today's behaviour. Rolling back then takes an environment variable and a rebuild, not a revert. The default is lazy.

## Risks / Trade-offs

- **[Risk] Total Blocking Time stays above 300 ms** after Privy is gone, because React's own hydration costs 1.2–1.8 s of simulated CPU.
  → Measure each page as the median of 3 Lighthouse mobile runs, on the same environment, before and after. If the budget is still missed, report the remaining long tasks by script and open a follow-up. The spec stays the target; it is not loosened here.
- **[Risk] An emitter fires a Privy event during server rendering, or before the bus exists.**
  → The bus is a client module; the queue lives in it and only holds events in the browser.
- **[Risk] The first sign-in dialog opens later on a slow connection**, since the SDK starts loading only at the click.
  → Decision 5 prefetches on intent, and `AuthInfo`'s overlay already shows progress.
- **[Risk] A signed-in member whose cookie expired mid-session loads a page rendered as signed out, and something emits `auth:logout`.**
  → Decision 3 queues it, mounts the layer and replays it. Sign-out completes as before.
- **[Risk] Lighthouse numbers on the feature env differ from production** (Kubernetes, not Vercel).
  → Compare before and after on the same environment for the go/no-go. Re-measure on production after release, against the 2026-11-02 baseline.

_Outcome (2026-11-03, `lab-3083` env, median of 3):_

- TBT went 691 → 444 ms on `/home`, 762 → 606 ms on `/jobs` and 450 → 134 ms on the member page.
- JS halved, and `auth.privy.io` dropped to 0 KB.
- The budget is still missed. What remains is React DOM plus the Next runtime, and the env's TTFB.
- The budget requirement moved out of this change into [LAB-3100](https://linear.app/protocollabs/issue/LAB-3100): re-measure on prod after release, then reduce hydration.

## Migration Plan

1. Build and verify on `lab-3083`:
   - Lighthouse before and after on the feature env;
   - the auth flow checklist (tasks.md) on the env, with Roma.
2. Release with the Goal. No data migration.
3. Rollback: set `NEXT_PUBLIC_EAGER_PRIVY=true` for the frontend build and redeploy (decision 8), or revert the PR.

## Open Questions

- Should the `?loginToken=` link also mount the Privy layer, so that a later Privy-only action on that page is instant? This doesn't change the flows; decide during implementation from what the login-link page does next.

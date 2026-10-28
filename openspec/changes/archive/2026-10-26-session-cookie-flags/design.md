# Design

## Context

Motivation is in proposal.md. Requirements are in `specs/auth/spec.md`.

The session cookies are written in two places today, and neither sets `Secure`, `SameSite` or `httpOnly`:

- **Server**: `proxy.ts` renews an expired session on page loads (`renewAccessToken` → `response.cookies.set`) and does the one-time host-only move (`migrateSessionCookiesToHost`, keyed by the `sessionScope` cookie). Helpers live in `utils/sessionCookies.ts`.
- **Browser** (js-cookie through `setSessionCookie` in `utils/third-party.helper.ts`), with five writers:
  - sign-in: `useAuthTokens.saveSessionTokens`, used by `PrivyModals` and `LoginTokenRedeemer`;
  - client refresh: `utils/fetch-wrapper.ts`, which runs `customFetch`, `retryApi` and `getUserCredentialsInfo` through `setNewTokenAndUserInfoAtClientSide`;
  - userInfo restore: `UserInfoValidator`;
  - email change: `useUpdateEmail`.

  The browser also *reads* `refreshToken`:
  - in the client refresh paths above;
  - as a "signed in?" check in `authStatus`, `useAuthTokens.isLoggedIn`, `husky-ai.tsx`, `home/husky/husky.tsx`, `checkIsLimitReached`, `husky.utlils`, `attendees-list`, `irl-follow-gathering` and `CookieChecker`;
  - for its expiry in `link-auth-accounts`.

  Sign-out removes `refreshToken` with js-cookie (`clearAllAuthCookies`, `useAuthTokens.clearAuthCookies`).

The browser calls the API's `POST /v1/auth/token` directly, both for the Privy exchange and for refresh. Server components get the session from request headers that the proxy sets (LAB-2979, on `develop`), so server-side reading is not affected. The proxy matcher excludes `/api`, so new route handlers under `app/api/auth/` are not intercepted by it.

## Goals / Non-Goals

**Goals:**

- One server-side place decides every session cookie's attributes. The proxy and the new route handlers both use it.
- After this change, no browser code path touches `refreshToken`.

**Non-Goals:**

- Changing when sessions refresh, or how long they last. Token lifetimes and the proxy's refresh-on-page-load rules stay as they are.
- Changing the AI Apps sharing switch (`AI_APPS_SHARE_AUTH_TOKEN`) or the host-only rules from LAB-2695.

## Decisions

### D1. Server route handlers own the session: `/api/auth/session`, `/api/auth/refresh`, `/api/auth/logout`

| Route | Input | Effect | Response |
|---|---|---|---|
| `POST /api/auth/session` | `{ accessToken, refreshToken, userInfo }` | validate (D5), set all session cookies | `204` |
| `POST /api/auth/refresh` | none (reads the httpOnly cookie) | `renewAccessToken`, then set all session cookies | `{ accessToken, userInfo }`; `401` plus cleared cookies on failure |
| `POST /api/auth/logout` | none | clear host and shared copies of every session cookie | `204` |

*Alternative:* move the token *issuing* calls (Privy exchange, invite redeem, email change) server-side, so the refresh token never reaches browser JS. That is stronger, but it means proxying three backend flows, including the exchange's retry and `isDeleteAccount` handling and the member email-change PUT. The ticket asks for an httpOnly cookie. The hand-off endpoint meets that with one small route, and a later change can still move issuance server-side (proposal, Out of scope).

### D2. One attribute policy in `utils/sessionResponse.ts`

Add `sessionCookieAttributes(name, req)` in `utils/sessionResponse.ts`, a server-only module next to `utils/sessionCookies.ts`. It is separate because it decodes tokens through `auth.utils`, which client-side `sessionCookies.ts` cannot import without a cycle. It returns:

- `path: '/'` and `sameSite: 'lax'` for every cookie;
- `httpOnly` for `refreshToken` only;
- `secure` unless the request is plain HTTP to `localhost` or a loopback IP;
- the domain rule that exists today: host-only for the names in `hostOnlySessionCookies()`, and `COOKIE_DOMAIN` for `authToken` while sharing is on.

The proxy's three write sites and the route handlers all set cookies through a `setSessionCookies(response, req, tokens)` helper built on it. `clearSessionCookies` stays the single clear path, and the logout route reuses it.

- *Why `Lax`, not `Strict`:* members arrive from email links, Telegram and the forum. With `Strict`, that first top-level navigation would carry no session, and the proxy's `!refreshTokenFromCookie` branch would *clear* the cookies. `Lax` still blocks cross-site subrequests and POSTs.
- *Why decide `secure` by host, not by `req.nextUrl.protocol`:* on the k8s feature envs, TLS ends at the ALB, so the Next server may see `http:` and leave `Secure` off by mistake. A localhost exception is safe in both directions, because deployed hosts are never loopback.

### D3. Session marker cookie `sessionExpiresAt`

It holds the refresh token's `exp` in epoch seconds. It is not httpOnly, it has the same flags and lifetime as `refreshToken`, and it is host-only. `setSessionCookies` and `clearSessionCookies` write it and clear it, so it can never drift from `refreshToken`.

Browser "signed in?" checks become `Boolean(Cookies.get('sessionExpiresAt'))`, behind a small helper (`hasSession()` / `getSessionExpiry()` in `utils/third-party.helper.ts`, next to the other cookie helpers). `CookieChecker` watches the marker. `link-auth-accounts` takes its expiry from the marker.

*Alternative:* reuse `sessionScope`. Rejected, because that cookie means "which host-only move ran" and is set only by the proxy. Giving it a second meaning would couple migration to login state.

### D4. Browser refresh is single-flight through `/api/auth/refresh`

`fetch-wrapper.ts` and `UserInfoValidator` call one `refreshSession()` client helper in place of `renewAccessToken(refreshToken)`. The helper keeps the in-flight promise, so parallel 401s in one tab share a single refresh. With a server-side cookie write, two overlapping refreshes could otherwise rotate the token twice and leave the browser with the older one. `getUserCredentialsInfo` keeps its shape minus `newRefreshToken`. The browser helpers (`establishSession`, `refreshSession`, `endSession`) live in `services/session.service.ts`, a module with no imports, because the fetch wrapper and the cookie helpers both depend on it; inside `auth.service.ts` they formed an import cycle. `renewAccessToken` stays in `services/auth.service.ts` for server use: the proxy and the route.

Browser code still writes the script-readable `userInfo` in a few places: `setSessionCookie` in `member.utils`, and the `react-use` cookie hook in `UserInfoChecker` and `OneClickVerification`. Those writes use `clientSessionCookieAttributes()`, which applies the same `SameSite=Lax` / `Secure` rule as the server. `setSessionCookie` throws for `refreshToken`.

### D5. Hand-off validation in `/api/auth/session`

The route checks these, in order:

1. `Origin` must equal the request's own origin (spec: same-origin only).
2. The body must be JSON with string `accessToken` and `refreshToken` and an object `userInfo.uid`. Parse it with zod.
3. Both tokens must decode with an `exp` in the future (`decodeToken`).
4. `checkIsValidToken(accessToken)` must return `active`, and must not return `forceLogout`.

Any failure returns `400` or `403` and sets no cookie. The JSON content type also forces a CORS preflight for cross-site callers, which is a second line of defence against login CSRF. `/refresh` and `/logout` apply check 1 only.

### D6. Async sign-out

`logoutUser` and `clearAllAuthCookies` become `async`. They await `POST /api/auth/logout` (`keepalive`, short timeout), then remove the script-readable cookies and `localStorage` as they do today, then emit `auth:logout`. The 19 call sites that reload or navigate right after must `await`, so the reload never races the `Set-Cookie`. `revokeAiAppSessions` still runs first, while `authToken` is still present.

### D7. Migrating existing sessions through `sessionScope`

Bump `sessionScopeValue()` to `host:2` / `host-all:2`. The current values are `host` and `host-all`, so every existing browser fails the "already moved" check once. `migrateSessionCookiesToHost` then rewrites `refreshToken`, `userInfo`, `authToken` and the marker through `setSessionCookies`, and expires the shared copies as it does today. Sessions that reach the proxy expired are already rewritten by the refresh branch. This is the existing LAB-2695 mechanism, so no second migration path is added.

## Risks / Trade-offs

- **[Risk]** A tab opened before the deploy runs the old bundle. After the proxy migrates its cookies on a client-side navigation, the old `CookieChecker` sees no `refreshToken` and shows "Session Expired". → This is a one-time event per open tab, the session is actually intact, and a reload fixes it. Mention it in the release note.
- **[Risk]** `Secure` cookies on a non-loopback plain-HTTP host (someone testing on a LAN IP over http) would be dropped by the browser. → Document it in `Login.md`. All shared environments are HTTPS.
- **[Risk]** If the hand-off `POST /api/auth/session` fails after a successful exchange, the member stays signed out. → The sign-in flows show their existing error toast and send the member back to the login modal. Retrying the exchange is safe.
- **[Trade-off]** The refresh token is still in browser memory for the hand-off moment and in the backend's JSON response (D1). This is accepted; it is tracked as a possible follow-up.
- **[Risk]** Old clients call `renewAccessToken` from the browser and then write `refreshToken` with js-cookie. A script cannot overwrite an httpOnly cookie, so their write is silently ignored and the server copy wins. → This only applies to stale bundles, and it heals on reload.

## Migration Plan

1. Ship the v2 PR to `develop`. Check the cookie flags in DevTools on dev (`directoryv2.dev.os.pl.xyz`), and on a feature env if the reviewer asks for one.
2. Push to prod through the normal `develop` → `main` release. No env var and no backend change is needed.
3. **Rollback**: revert the PR. Browsers then hold `sessionScope=host:2`, which the old code does not recognise as "already moved". On the next page load with a valid session, its move re-runs and rewrites `refreshToken` without `httpOnly`. An expired session goes through the refresh branch, which also rewrites it. Old client code can read the cookie again after one page load, and nobody is signed out.

## Open Questions

- Whether any deployed AI App still reads LabOS's `authToken` on an environment where sharing is on (dev). `SameSite=Lax` and `Secure` do not stop same-site HTTPS subdomains from receiving it, so no change is expected. The PR checks one app on dev and lists any affected app, per the acceptance criteria.

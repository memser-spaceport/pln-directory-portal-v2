# Tasks

## 1. Branch

- [x] 1.1 Create the task branch from the latest `origin/develop`, following the `lab-ticket-workflow` skill. LAB-2988's parent LAB-2977 is a Spike with no Goal, so the base is `develop`. Confirm that `proxy.ts` on the branch has LAB-2979's `pageRequestHeaders`.

## 2. Cookie attribute policy (server)

- [x] 2.1 In `utils/sessionCookies.ts`, add `sessionCookieAttributes(name, req)` (D2):
  - `sameSite: 'lax'` and `path: '/'` on every cookie;
  - `httpOnly` on `refreshToken` only;
  - `secure` unless the request is plain-HTTP loopback;
  - the existing host-only / `COOKIE_DOMAIN` rule.

  Add the `sessionExpiresAt` marker to `SESSION_COOKIES` (D3). It is never written on the shared domain, so it is not in the host-only list. The server-only writers live in `utils/sessionResponse.ts`, because `auth.utils` can't be imported into the client-side `sessionCookies.ts` without a circular import; tests are in `__tests__/utils/session-response.test.ts`. Verify with new cases in `__tests__/utils/session-cookies.test.ts` covering each cookie name, HTTPS vs `http://localhost`, and the sharing switch on and off.
- [x] 2.2 Add `setSessionCookies(response, req, { accessToken, refreshToken, userInfo })`. It writes `authToken`, `refreshToken`, `userInfo`, `sessionScope` and `sessionExpiresAt` with the policy, then calls `expireSharedCookies` last. Make `clearSessionCookies` clear the marker too. Verify with unit tests that read the `Set-Cookie` headers: `HttpOnly` only on `refreshToken`, `SameSite=Lax` on all, and `Secure` on HTTPS.
- [x] 2.3 Bump `sessionScopeValue()` to `host:2` / `host-all:2` (D7). Verify that the migration test in `__tests__/proxy-session-cookies.test.ts` re-runs the move for a browser holding `sessionScope=host`.

## 3. Proxy

- [x] 3.1 In `proxy.ts`, route the refresh branch and `migrateSessionCookiesToHost` through `setSessionCookies`, so the refreshed and migrated cookies carry the flags and the marker. Keep the LAB-2979 request-header behaviour unchanged. Verify by updating `__tests__/proxy-session-cookies.test.ts` and `__tests__/proxy.test.ts`:
  - a refreshed session has `HttpOnly; SameSite=Lax; Secure` on `refreshToken`;
  - a legacy session (no flags, `sessionScope=host`) is rewritten once and stays signed in;
  - the localhost `COOKIE_DOMAIN` case still keeps `refreshToken`.

## 4. Session route handlers

- [x] 4.1 Add `app/api/auth/session/route.ts` (`POST`, D1 + D5): same-origin `Origin` check, zod body, decode both tokens, `checkIsValidToken` active and not `forceLogout`, then `setSessionCookies`, then `204`. Verify with a route test: `204` plus flagged cookies on a valid hand-off; `403` for a foreign `Origin`; `400` for a malformed or expired token or a missing `userInfo.uid`, with no `Set-Cookie`.
- [x] 4.2 Add `app/api/auth/refresh/route.ts` (`POST`): read the httpOnly cookie, call `renewAccessToken`, then `setSessionCookies`, and return `{ accessToken, userInfo }` only. On failure, `clearSessionCookies` and return `401`. Verify with a route test that the success body has no `refreshToken` key, that rotated cookies are set, and that a rejected token yields `401` and cleared cookies.
- [x] 4.3 Add `app/api/auth/logout/route.ts` (`POST`): same-origin check, `clearSessionCookies`, `204`. Verify with a route test that both host and shared expirations for every session cookie and the marker are in `Set-Cookie`.

## 5. Browser: sign-in, email change, refresh

- [x] 5.1 Add client helpers in `services/session.service.ts` (a module with no imports; inside `auth.service.ts` they created an import cycle through the fetch wrapper):
  - `establishSession(tokens)` → `POST /api/auth/session`;
  - single-flight `refreshSession()` → `POST /api/auth/refresh` (D4);
  - `endSession()` → `POST /api/auth/logout`.

  Verify with unit tests that two concurrent `refreshSession()` calls make one request.
- [ ] 5.2 Make `useAuthTokens.saveSessionTokens` and `saveTokens` async and use `establishSession`. They keep setting `authLinkedAccounts` with js-cookie (expiry from the decoded refresh token, as today) and keep the PostHog identify. Update `PrivyModals` and `LoginTokenRedeemer` to await them before they redirect or reload, and to show the existing error path if the hand-off fails. Verify by signing in with Privy and with an invite login token locally: you stay signed in after reload, and `document.cookie` has no `refreshToken`.
- [x] 5.3 Make `useUpdateEmail` call `establishSession` with the tokens the email-change response returns, and stop using `setSessionCookie`. Verify by updating `__tests__/services/members/useUpdateEmail.test.tsx` and `__tests__/page/connected-accounts/email-identity-row.test.tsx` to expect the hand-off call in place of `Cookies.set('refreshToken', …)`.
- [x] 5.4 In `utils/fetch-wrapper.ts`, replace `renewTokens` and `setNewTokenAndUserInfoAtClientSide` with `refreshSession()` in `customFetch`, `retryApi` and `getUserCredentialsInfo`. Drop `newRefreshToken` from the return value. Use the marker, not `refreshToken`, for the "no session → sign out" checks. Verify with a fetch-wrapper unit test: an expired `authToken` triggers one refresh and a retried call with the new Bearer token, and a `401` from refresh signs out.
- [x] 5.5 In `UserInfoValidator`, restore a missing `userInfo` through `refreshSession()`, and key off the marker in place of `Cookies.get('refreshToken')`. Verify with a component test, or manually by deleting the `userInfo` cookie in DevTools and reloading: it is restored without sign-out.
- [x] 5.6 Remove `setSessionCookie`'s `refreshToken` handling (it now throws for that name) and `getCookiesFromClient().refreshToken`. `setSessionCookie` and the `react-use` `userInfo` writes (`UserInfoChecker`, `OneClickVerification`, `member.utils`) carry the same `SameSite=Lax`/`Secure` flags as the server. Verify that `git grep -n "Cookies\.\(get\|set\|remove\)('refreshToken'" -- ':!__tests__'` and `git grep -n "setSessionCookie('refreshToken'"` both return nothing.

## 6. Browser: "signed in?" checks and sign-out

- [x] 6.1 Add `hasSession()` / `getSessionExpiry()` reading `sessionExpiresAt` (D3), in `utils/third-party.helper.ts` next to the other cookie helpers. Switch these to it: `authStatus`, `useAuthTokens.isLoggedIn`, `husky-ai.tsx`, `home/husky/husky.tsx`, `checkIsLimitReached`, `utils/husky.utlils.ts`, `irl/attendee-list/attendees-list.tsx`, `irl/follow-gathering/irl-follow-gathering.tsx`, `CookieChecker` and `link-auth-accounts` (expiry). Verify by updating the Husky tests (`__tests__/core/husky/husky-ai-ask-event.test.tsx`, `__tests__/page/husky/ai-search-chat-*.test.tsx`) to seed the marker in place of `refreshToken`. They must pass with the same signed-in and signed-out expectations.
- [ ] 6.2 Make `clearAllAuthCookies` / `logoutUser` async (D6): run `revokeAiAppSessions` first, then await `endSession()`, then do the existing js-cookie removals and `localStorage.clear()`, then emit `auth:logout`. Make `useAuthTokens.clearAuthCookies` use `endSession()`. Update every caller that reloads or navigates afterwards to `await`:
  - `UserInfoChecker`, `UserInfoValidator`, `AuthInvalidUser`, `AccountMenu`, `userProfile`;
  - `SpvSpotlightView`, `useStoredCv`, `useUiFlags`;
  - `fetch-wrapper`.

  Verify by updating `__tests__/core/login/auth-invalid-user.test.tsx`, `__tests__/core/navbar/account-menu-copy.test.tsx`, `__tests__/page/spv-spotlight/spv-spotlight-view.test.tsx` and `__tests__/services/members/stored-cv-query-enabled.test.ts`. Also sign out locally and check that the next page load is signed out.

## 7. Docs

- [x] 7.1 Update `components/core/login/Login.md`: cookie table (flags, httpOnly `refreshToken`, `sessionExpiresAt`), the sign-in, refresh and sign-out diagrams (route handlers), and a note that `Secure` drops cookies on non-loopback plain-HTTP hosts. Verify that the doc has no remaining `Cookies.set('refreshToken'` example.

## 8. Integration checks

- [x] 8.1 Run `npm run lint` and `npm run test`. Both must pass, apart from failures that already exist on `develop` (compare them against a `develop` run).
- [x] 8.2 Run `openspec validate session-cookie-flags --json` (with `OPENSPEC_TELEMETRY=0 DO_NOT_TRACK=1`) and verify it reports `valid: true`.
- [ ] 8.3 After the PR merges to `develop`, run an end-to-end check on dev (`directoryv2.dev.os.pl.xyz`):
  - sign in with Privy and check in DevTools that `refreshToken` is `HttpOnly`, `Secure` and `SameSite=Lax`, and that `authToken`, `userInfo`, `sessionScope` and `sessionExpiresAt` are `Secure` and `SameSite=Lax`;
  - delete `authToken` and trigger an API action, then check that the refresh works;
  - sign out and reload, then check that you are signed out;
  - with a pre-release session cookie set, reload and check that it migrated without sign-out;
  - open one deployed AI App and check that it still loads signed in.

  Record the results on LAB-2988, and list any AI App that changed in the PR (acceptance criterion).
- [ ] 8.4 Archive the change in the same PR as the code (`openspec archive session-cookie-flags`), following the repo's archive rule, so `openspec/specs/auth/` lands with the code.

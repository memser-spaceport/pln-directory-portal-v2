# Proposal

## Why

[LAB-2988](https://linear.app/protocollabs/issue/LAB-2988) is wave 2 (High) of the security spike LAB-2977. LabOS stores the session in cookies (`authToken`, `refreshToken`, `userInfo`, `sessionScope`). None of them has the `Secure` or `SameSite` flag, and browser JavaScript can read `refreshToken`. Any script injection (XSS, a compromised dependency) can read the refresh token and mint new sessions for as long as the token lives. Without `Secure`, the cookies can go out over plain HTTP.

LAB-2979 is Done: session tokens no longer reach the browser in page response headers. That was the blocker for this ticket.

## What Changes

- Every LabOS session cookie gets `SameSite=Lax`. Each one also gets `Secure` when the site is served over HTTPS (all deployed environments). Local `http://localhost` stays usable.
- `refreshToken` becomes **httpOnly**. Browser code can no longer read it, write it or delete it.
- New same-origin server endpoints own the session cookies. They are Next.js route handlers in this repo:
  - **establish**: after sign-in (Privy exchange, invite login token) and after an email change, the browser gives the new tokens to the server, and the server sets the cookies.
  - **refresh**: the server renews the session from the httpOnly cookie. It returns the new access token and user info, but not the refresh token.
  - **sign-out**: the server clears every session cookie, the httpOnly one included.
- Browser code that only needs to know "is there a session" or "when does it end" stops reading `refreshToken`. It reads a new non-secret marker cookie instead. The marker holds the session expiry and is set and cleared together with `refreshToken`.
- The proxy (`proxy.ts`) writes the flags when it refreshes a session. Browsers that already hold the old cookies are rewritten with the new flags once, the next time they load a page. The existing `sessionScope` one-time-move mechanism does this, so nobody is signed out.
- **BREAKING (internal only)**: `getCookiesFromClient()` and `getUserCredentialsInfo()` no longer return a refresh token. No caller uses that field today.

### Out of scope

- Making `authToken` httpOnly. Browser code sends it as a Bearer header in about 90 places, so that needs a backend-for-frontend redesign. LAB-2695 (2026-09-29) left it out on purpose.
- Keeping the refresh token out of browser JavaScript during the sign-in hand-off. The backend (`POST /v1/auth/token`, the email-change endpoint) still returns it in JSON to the browser call. Moving those calls server-side is a possible follow-up. This change stops the token from being *stored* where scripts can read it.
- Backend (pln-directory-portal) changes. The API does not set cookies, and its token endpoints stay as they are.
- Non-session cookies (`authLinkedAccounts`, `page_params`, Privy's own cookies, notification timestamps).
- Deployed AI Apps. They never receive `refreshToken` (it has been host-only since LAB-2695). On prod they do not read LabOS's `authToken` either (`AI_APPS_SHARE_AUTH_TOKEN=false`). `SameSite=Lax` still sends `authToken` to same-site app subdomains where sharing is on.

## Capabilities

### New Capabilities

- `auth`: how LabOS keeps a member's session in the browser: cookie flags, which cookies scripts can read, and how sign-in, session refresh and sign-out work.

### Modified Capabilities

None. No existing spec covers sessions.

## Impact

- **Code (pln-directory-portal-v2 only)**: `proxy.ts`, `utils/sessionCookies.ts`, `utils/third-party.helper.ts`, `utils/fetch-wrapper.ts`, `services/auth.service.ts`, the login components and hooks (`useAuthTokens`, `UserInfoValidator`, `CookieChecker`, `authStatus`, `LoginTokenRedeemer`, `PrivyModals`), `services/members/hooks/useUpdateEmail.ts`, `components/page/member-info/link-auth-accounts.tsx`. Also the "logged in?" checks in Husky, IRL and the home page. New route handlers go under `app/api/auth/`.
- **Restricted area**: cookies and tokens are on the Horizon AutoDev deny-list, and the ticket is `human-only`. A human builds and reviews it.
- **Tests**: `__tests__/proxy-session-cookies.test.ts`, `__tests__/utils/session-cookies.test.ts` and the tests that seed `refreshToken` with js-cookie (Husky chat, email update, connected accounts) must change.
- **Docs**: `components/core/login/Login.md` describes the client-set refresh token and must be updated.
- **Rollout**: no env var and no backend deploy. Existing sessions migrate on their next page load.

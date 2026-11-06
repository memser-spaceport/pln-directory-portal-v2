# Tasks

## 1. Flags

- [x] 1.1 Add `sessionCookieFlags(location)` to `utils/sessionCookies.ts` (SameSite=Lax; Secure unless plain-HTTP loopback). Verified by `__tests__/utils/session-cookie-flags.test.ts`.
- [x] 1.2 Apply the flags to every proxy write (refresh branch and host-only move) in `proxy.ts`. Verified by the new "session cookie flags" cases in `__tests__/proxy-session-cookies.test.ts`.
- [x] 1.3 Apply the flags to browser writes: `setSessionCookie`, and the `react-use` `userInfo` writes in `UserInfoChecker` and `OneClickVerification`, through `clientSessionCookieAttributes()`. Verified by the updated `__tests__/utils/session-cookies.test.ts`.

## 2. Checks

- [x] 2.1 Run `npm run lint` and `npm run test`. Verified: the same 8 suites fail as on `develop`, and ESLint is clean on the touched files.
- [x] 2.2 Run `openspec validate session-cookie-samesite-secure --json` and verify it reports valid.
- [ ] 2.3 After merge, on dev: in DevTools, check that the session cookies show `SameSite=Lax` and `Secure` after sign-in and after a refresh; sign out; open one AI App and the forum signed in.

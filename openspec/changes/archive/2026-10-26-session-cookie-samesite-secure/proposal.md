# Proposal

## Why

[LAB-2988](https://linear.app/protocollabs/issue/LAB-2988), from the security spike LAB-2977. The LabOS session cookies (`authToken`, `refreshToken`, `userInfo`, `sessionScope`) have no `Secure` or `SameSite` flag. Without `Secure` they can go out over plain HTTP. Without `SameSite`, browsers that do not default to `Lax` (Safari, Firefox) send them on cross-site requests.

This change is the low-risk part of the ticket: flags only. Making `refreshToken` httpOnly needs the sign-in, refresh and sign-out flows to move server-side. That goes in a separate change (`session-cookie-flags`, PR #3368), which is tested on a feature env first.

## What Changes

- Every session cookie that LabOS writes gets `SameSite=Lax`. This covers the proxy's refresh and host-only move, and browser writes at sign-in, refresh, email change and `userInfo` updates.
- The same cookies also get `Secure`, except on plain-HTTP `localhost` / loopback (local dev).
- Existing cookies pick up the flags the next time they are written (the next session refresh or sign-in). There is no forced rewrite.

### Out of scope

- httpOnly `refreshToken` and the server-side session routes (separate change).
- Cookie domains, lifetimes, and which cookies exist: all unchanged.
- Non-session cookies (`authLinkedAccounts`, Privy, notifications).
- Backend, forum and AI Apps. They are unaffected: `SameSite=Lax` and `Secure` cookies still reach same-site HTTPS subdomains.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `auth`: adds the requirement that session cookies carry `SameSite=Lax` and `Secure`.

## Impact

- `utils/sessionCookies.ts` gets one shared flag rule, `sessionCookieFlags`. It is used by `proxy.ts` and by `utils/third-party.helper.ts` (`setSessionCookie`, `clientSessionCookieAttributes`), and by the two `react-use` `userInfo` writers (`UserInfoChecker`, `OneClickVerification`).
- No env var, no backend change, no migration.

## Why

On 2026-11-20 a load-balancer node change made some sign-in checks time out. The web app cleared the session on any error, so members were signed out while the auth service was healthy (LAB-3366).

## What Changes

- The sign-in check and the session refresh get a timeout and a retry.
- A timeout, a network error, or HTTP 429 or 5xx does not clear the session cookies.
- A public page renders signed out for that request. A protected page answers HTTP 503.
- The session is cleared only when the auth service says the token is invalid, expired, or must be signed out.

## Capabilities

### Modified Capabilities

- `auth`: a sign-in check that does not answer keeps the session.

## Impact

- Page loads that check the session (`proxy.ts`) and `POST /api/auth/refresh`.
- A browser call that refreshes the session no longer signs the member out on an outage.

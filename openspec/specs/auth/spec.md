# auth Specification

> Added by LAB-2979; session cookie rules added by LAB-2988. How a page learns whether a member is signed in, and how the browser keeps the session.

## Purpose

A page renders signed in from the member's session cookies. The browser does not receive session tokens in page response headers, and headers the client sends do not decide the signed-in state. The session cookies carry `SameSite` and `Secure`, page scripts cannot read the refresh token, and sign-in, refresh and sign-out go through LabOS's server so they keep working under those rules.

## Requirements

### Requirement: Page responses carry no session tokens

A page response SHALL NOT include an `authToken`, `refreshToken`, or `userInfo` header. A signed-in member SHALL still see the signed-in page.

#### Scenario: Signed-in member opens a page

- **GIVEN** a member with a valid session
- **WHEN** the member opens a page
- **THEN** the page renders signed in
- **AND** the response has no `authToken`, `refreshToken`, or `userInfo` header

#### Scenario: Expired access token and a valid refresh cookie

- **GIVEN** a member whose access token is expired and whose refresh cookie is valid
- **WHEN** the member opens a page
- **THEN** the first response renders signed in
- **AND** that response has no `authToken`, `refreshToken`, or `userInfo` header

### Requirement: Client login-state headers do not change the page

A request header named `isLoggedIn`, `authToken`, `refreshToken`, or `userInfo` SHALL NOT change whether the page renders signed in.

#### Scenario: Signed-out visitor sends isLoggedIn

- **GIVEN** a visitor with no session
- **WHEN** the visitor requests a page with an `isLoggedIn` header
- **THEN** the page renders signed out

#### Scenario: Signed-out visitor sends token headers

- **GIVEN** a visitor with no session
- **WHEN** the visitor requests a page with `authToken`, `refreshToken`, or `userInfo` headers
- **THEN** the page renders signed out

#### Scenario: Signed-in member sends different token headers

- **GIVEN** a member with a valid session
- **WHEN** the member requests a page with different `authToken`, `refreshToken`, or `userInfo` headers
- **THEN** the page renders that member's session, not the values in those headers

### Requirement: Session cookies carry SameSite and Secure

Every LabOS session cookie (`authToken`, `refreshToken`, `userInfo`, `sessionScope`, and the session marker) SHALL be set with `SameSite=Lax`. Each one SHALL also be set with `Secure` whenever the site is served over HTTPS. On plain-HTTP local development (`http://localhost`), the cookies SHALL be set without `Secure`, so local sign-in keeps working.

#### Scenario: Sign-in on a deployed environment

- **GIVEN** a member on a LabOS environment served over HTTPS
- **WHEN** they sign in
- **THEN** every session cookie in the response has `SameSite=Lax` and `Secure`

#### Scenario: Session refreshed by a page load

- **GIVEN** a signed-in member whose access token has expired and whose refresh token is valid
- **WHEN** they load any LabOS page
- **THEN** the renewed session cookies have `SameSite=Lax` and `Secure`

#### Scenario: Local development over HTTP

- **GIVEN** LabOS running on `http://localhost`
- **WHEN** a developer signs in
- **THEN** the session cookies have `SameSite=Lax` and no `Secure` flag
- **AND** the developer stays signed in on the next page load

#### Scenario: Member arrives from a link in another site

- **GIVEN** a signed-in member
- **WHEN** they open a LabOS link from an email, Telegram or the forum
- **THEN** the page loads signed in

### Requirement: Refresh token is not readable by page scripts

The `refreshToken` cookie SHALL be `httpOnly` every time it is written: at sign-in, on refresh, after an email change, and when an existing session is migrated. No browser-side code SHALL read, write or remove `refreshToken`. Server code alone SHALL set and clear it.

#### Scenario: Script cannot see the refresh token

- **GIVEN** a signed-in member
- **WHEN** a script on a LabOS page reads `document.cookie`
- **THEN** the result does not contain `refreshToken`

#### Scenario: Refresh token stays host-only

- **GIVEN** a signed-in member on an environment with a shared `COOKIE_DOMAIN`
- **WHEN** the refresh token cookie is written
- **THEN** it is host-only on LabOS's own origin, as it is today, and deployed AI App subdomains never receive it

### Requirement: Browser can tell a session exists without the refresh token

LabOS SHALL keep a non-secret, script-readable session marker cookie. It holds the session expiry time and no credential. It SHALL be set, renewed and cleared together with `refreshToken`, with the same lifetime. Browser code that needs to know whether a session exists, or when it ends, SHALL read the marker.

#### Scenario: Signed-in features see the session

- **GIVEN** a member who has just signed in
- **WHEN** a page shows a feature that only signed-in members get (for example, the Husky chat limit, following an IRL gathering)
- **THEN** the page treats the member as signed in

#### Scenario: Session expiry prompt

- **GIVEN** a signed-in member with a LabOS tab open
- **WHEN** their session expires and the marker cookie disappears
- **THEN** the "Session Expired" prompt appears, as it did before this change

### Requirement: Session refresh works without exposing the refresh token

When the access token is missing or rejected, LabOS SHALL renew the session on the server from the httpOnly refresh token. The browser SHALL receive only the new access token and user info. If renewal fails, the member SHALL be signed out and told so, as today.

#### Scenario: API call with an expired access token

- **GIVEN** a signed-in member whose access token has expired and whose refresh token is valid
- **WHEN** an action makes an authenticated API call
- **THEN** the session is renewed, the call succeeds, and the member stays signed in
- **AND** no response the browser receives contains the refresh token

#### Scenario: Refresh token expired or revoked

- **GIVEN** a member whose refresh token is expired or revoked
- **WHEN** an action makes an authenticated API call
- **THEN** the member is signed out and sees the sign-out message

### Requirement: Sign-out clears the httpOnly session

Sign-out SHALL remove every session cookie, the httpOnly `refreshToken` included, on LabOS's host and on the shared `COOKIE_DOMAIN`. This applies to sign-out by the member, by forced logout, and after a failed refresh. The cookies SHALL be gone before the page reloads or navigates.

#### Scenario: Member signs out

- **GIVEN** a signed-in member
- **WHEN** they choose Sign out
- **THEN** after the page reloads they are signed out
- **AND** loading another page does not restore the session

#### Scenario: Failed refresh signs the member out

- **GIVEN** a member whose refresh token is rejected by the API
- **WHEN** LabOS signs them out
- **THEN** the browser no longer holds `refreshToken`, so the next page load does not try to refresh again

### Requirement: Existing sessions keep working after the change

A browser that holds session cookies written before this change SHALL keep its session. On its next page load, the cookies SHALL be rewritten with the new flags, and the refresh token SHALL become httpOnly, without signing the member out.

#### Scenario: Member signed in before the release

- **GIVEN** a member who signed in before this change, so their `refreshToken` is script-readable and has no flags
- **WHEN** they load any LabOS page after the release
- **THEN** they are still signed in
- **AND** their `refreshToken` is now httpOnly, `SameSite=Lax` and `Secure`

### Requirement: Only same-origin requests can set or refresh a session

The server endpoints that set, refresh or clear the session SHALL accept only same-origin requests, and SHALL reject requests that come from another origin. The endpoint that sets a session from tokens SHALL reject tokens it cannot decode, and tokens without a member identity.

#### Scenario: Cross-site request to set a session

- **GIVEN** a page on another site
- **WHEN** it sends a request to the LabOS endpoint that sets a session
- **THEN** the request is rejected and no session cookie is set

#### Scenario: Malformed tokens

- **GIVEN** a same-origin request whose tokens cannot be decoded
- **WHEN** it asks to set a session
- **THEN** the request is rejected with a client error and no session cookie is set

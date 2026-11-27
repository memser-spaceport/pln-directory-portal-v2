# auth Specification

> Added by LAB-2979; session cookie rules added by LAB-2988; the email-not-found dialog by LAB-3127; a timed-out sign-in check keeps the session (LAB-3366). How a page learns whether a member is signed in, and how the browser keeps the session.

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

### Requirement: Access token is not shared with AI Apps by default

The `authToken` cookie SHALL be host-only on LabOS's own origin unless `AI_APPS_SHARE_AUTH_TOKEN` is set to `true`. Any other value, or no value, SHALL keep it host-only. Deployed AI Apps sign members in through their own auth gate, not with LabOS's token.

#### Scenario: Sharing is not configured

- **GIVEN** an environment with a shared `COOKIE_DOMAIN` and no `AI_APPS_SHARE_AUTH_TOKEN`
- **WHEN** the `authToken` cookie is written
- **THEN** it has no `Domain` attribute, and deployed AI App subdomains never receive it
- **AND** any copy of it already on `COOKIE_DOMAIN` is expired
- **AND** any copy on a wider parent of `COOKIE_DOMAIN` is expired too (for example `.os.pl.xyz` when `COOKIE_DOMAIN` is `dev.os.pl.xyz`)

#### Scenario: Old shared copy sits on a wider domain

- **GIVEN** a signed-in member whose `authToken` is still on a wider parent of `COOKIE_DOMAIN`
- **AND** the session marker already records the previous host-only layout
- **WHEN** they load any LabOS page
- **THEN** they stay signed in
- **AND** the copies on `COOKIE_DOMAIN` and on that wider parent are expired

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

When the access token is missing or rejected, LabOS SHALL renew the session on the server from the httpOnly refresh token. The browser SHALL receive only the new access token and user info. If the auth service rejects the refresh token, the member SHALL be signed out and told so. If the auth service does not answer, the member SHALL stay signed in.

#### Scenario: API call with an expired access token

- **GIVEN** a signed-in member whose access token has expired and whose refresh token is valid
- **WHEN** an action makes an authenticated API call
- **THEN** the session is renewed, the call succeeds, and the member stays signed in
- **AND** no response the browser receives contains the refresh token

#### Scenario: Refresh token expired or revoked

- **GIVEN** a member whose refresh token is expired or revoked
- **WHEN** an action makes an authenticated API call
- **THEN** the member is signed out and sees the sign-out message

#### Scenario: Auth service does not answer a refresh

- **GIVEN** a signed-in member whose access token has expired
- **WHEN** an action renews the session and the auth service does not answer
- **THEN** the member stays signed in
- **AND** the session cookies stay

### Requirement: A sign-in check that does not answer keeps the session

The page sign-in check SHALL retry a timeout, a network error, and an HTTP 429 or 5xx from the auth service. Those failures SHALL NOT clear the session cookies. A public page SHALL render signed out for that one request. A protected page SHALL answer HTTP 503. LabOS SHALL clear the session only when the auth service says the token is invalid, expired, or must be signed out.

#### Scenario: The sign-in check times out

- **GIVEN** a signed-in member
- **WHEN** the sign-in check cannot reach the auth service
- **THEN** the session cookies stay
- **AND** a public page renders signed out for that request
- **AND** a protected page answers HTTP 503

#### Scenario: The auth service rejects the refresh token

- **GIVEN** a member whose access token is inactive and whose refresh token the auth service rejects
- **WHEN** the member opens a page
- **THEN** the session cookies are cleared

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

### Requirement: The sign-in system loads only when it is needed

A signed-out visitor SHALL NOT download the sign-in system's code or contact its service (`auth.privy.io`) until they start to sign in, or until something on the page asks the sign-in system to act: account linking or sign-out. Starting to sign in means opening the sign-in dialog, by choosing Sign in or by arriving at an address with `#login`. A signed-in member SHALL get the sign-in system on every page, as before this change.

#### Scenario: Signed-out visitor reads a page

- **GIVEN** a visitor with no session
- **WHEN** they load `/`, `/jobs`, a profile or any other page, and do not choose Sign in
- **THEN** the page makes no request to `auth.privy.io` and loads no sign-in system code

#### Scenario: Signed-out visitor chooses Sign in

- **GIVEN** a visitor with no session on any page
- **WHEN** they choose Sign in
- **THEN** the sign-in dialog opens with the same sign-in methods as before (email, Google, GitHub, wallet)
- **AND** completing it signs them in as before

#### Scenario: Arriving at a sign-in address

- **GIVEN** a visitor with no session
- **WHEN** they open a LabOS address ending in `#login`
- **THEN** the sign-in dialog opens, as before this change

#### Scenario: Signed-in member

- **GIVEN** a signed-in member
- **WHEN** they load any page
- **THEN** sign-out, account linking and email change work as before this change

### Requirement: Sign-in flows keep working with the sign-in system loaded on demand

Every flow that used the sign-in system before this change SHALL behave the same when it is loaded on demand: sign-in with each method, login links, sign-out (including across tabs and after a failed refresh), account linking, email change and the sign-in error dialogs. A request that reaches the sign-in system before it has loaded SHALL be carried out once it has loaded, not dropped.

#### Scenario: Google or GitHub sign-in returns to the site

- **GIVEN** a visitor with no session who chose Google or GitHub in the sign-in dialog
- **WHEN** the provider sends them back to LabOS with Privy's OAuth parameters in the address
- **THEN** the sign-in completes and they are signed in, as before this change

#### Scenario: Login link

- **GIVEN** a visitor with no session who opens a one-time login link
- **WHEN** the page loads
- **THEN** they are signed in and the link's parameters are removed from the address, as before this change

#### Scenario: Sign-out from a stale session

- **GIVEN** a browser whose session can no longer be refreshed, on a page rendered as signed out
- **WHEN** the page asks the sign-in system to sign out
- **THEN** the sign-out completes and the session is cleared, as before this change

#### Scenario: Dismissed sign-in

- **GIVEN** a visitor who opened the sign-in dialog
- **WHEN** they close it without signing in
- **THEN** the page returns to its normal state, and choosing Sign in again opens the dialog again

#### Scenario: Sign-in with an email that is not a member

- **GIVEN** a visitor who signs in with an email that has no member profile
- **WHEN** sign-in completes at the sign-in service
- **THEN** they see the "email not found" dialog described in "Email not found names the email and offers a way forward"

### Requirement: Email not found names the email and offers a way forward

> Added by LAB-3127.

When sign-in completes but no member profile uses the email, outside a demo day, the auth error dialog SHALL keep its shell, name the email, and offer Sign up, Try another email and a close control instead of Cancel and Contact Support. Without a known email it SHALL leave the address out. Other sign-in errors SHALL keep their content. It is not behind a feature flag.

#### Scenario: Email not found shows the new title and the email

- **GIVEN** a visitor who signs in as `name@example.com`, which no member profile uses
- **WHEN** sign-in completes at the sign-in service
- **THEN** the dialog keeps the error dialog's warning icon and 400px width
- **AND** its title is "This email isn't in the directory yet"
- **AND** its body reads "No member profile uses **name@example.com**. If you're new, sign up and we'll set up your profile. If you're a member, try the email on your profile."
- **AND** the buttons are Sign up (primary), Try another email (link) and the close control, with no Cancel or Contact Support

#### Scenario: Try another email reopens sign-in

- **GIVEN** the "email not found" dialog is open
- **WHEN** the visitor chooses Try another email
- **THEN** the dialog closes
- **AND** the sign-in dialog opens again, as when choosing Sign in, so they can use a different email or method

#### Scenario: Sign up opens sign-up

- **GIVEN** the "email not found" dialog is open on `/members?tab=all`
- **WHEN** the visitor chooses Sign up
- **THEN** the dialog closes and they are taken to `/sign-up?returnTo=%2Fmembers%3Ftab%3Dall`, the same address the navbar Sign up uses
- **AND** Back returns them to `/members?tab=all`

#### Scenario: Closing the dialog

- **GIVEN** the "email not found" dialog is open
- **WHEN** the visitor closes it with the close control
- **THEN** the dialog closes and the page stays where it was

#### Scenario: Missing email falls back

- **GIVEN** a sign-in that ends in "email not found" without a known email
- **WHEN** the dialog opens
- **THEN** the body reads "No member profile uses this email." followed by the same advice
- **AND** no address, and never the word "undefined", appears

#### Scenario: Other sign-in errors unchanged

- **GIVEN** a sign-in that ends in any other error (for example "Something Went Wrong" or "Access Denied")
- **WHEN** the dialog opens
- **THEN** it shows the same title, body and buttons as before this change (Cancel and Contact Support)

#### Scenario: Demo day pages unchanged

- **GIVEN** a visitor on a demo day page while it is open for registration or active
- **WHEN** sign-in ends in "email not found"
- **THEN** they see the demo day Access Denied dialog with Apply, as before this change

### Requirement: Analytics never records login link parameters

No analytics event or person property SHALL carry a login link's `loginToken` or `prefillEmail` query parameter, in any URL it records: current URL, referrer, session entry URL and referrer, or initial person info. Other query parameters and the hash SHALL be kept.

#### Scenario: Visitor opens an invite link

- **GIVEN** a visitor who opens a link with `loginToken` and `prefillEmail` in the address
- **WHEN** analytics records the page view, the sign-in, and the events after the page reloads signed in
- **THEN** no recorded URL contains `loginToken` or `prefillEmail`

#### Scenario: Browser that opened an invite link before this change

- **GIVEN** a browser whose stored analytics state still holds an invite URL with a `loginToken`
- **WHEN** analytics sends any event
- **THEN** the event carries that URL without `loginToken` or `prefillEmail`

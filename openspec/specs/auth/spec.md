# auth Specification

> Added by LAB-2979; cookie flags added by LAB-2988. How a page learns whether a member is signed in.

## Purpose

A page renders signed in from the member's session cookies. The browser does not receive session tokens in page response headers, and headers the client sends do not decide the signed-in state.

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

Every LabOS session cookie that LabOS writes (`authToken`, `refreshToken`, `userInfo`, `sessionScope`) SHALL be set with `SameSite=Lax`, whether the server or browser code writes it. Each one SHALL also be set with `Secure`, except on plain-HTTP local development (`localhost` or a loopback address), where it SHALL be set without `Secure` so local sign-in keeps working. Cookie domains and lifetimes are unchanged.

#### Scenario: Session refreshed on a deployed environment

- **GIVEN** a signed-in member on a LabOS environment served over HTTPS, whose access token has expired
- **WHEN** they load a page and the session is renewed
- **THEN** every renewed session cookie has `SameSite=Lax` and `Secure`

#### Scenario: Sign-in from the browser

- **GIVEN** a member on a LabOS environment served over HTTPS
- **WHEN** they sign in
- **THEN** the session cookies written in the browser have `SameSite=Lax` and `Secure`

#### Scenario: Local development over HTTP

- **GIVEN** LabOS running on `http://localhost`
- **WHEN** a developer signs in and reloads the page
- **THEN** the session cookies have `SameSite=Lax` and no `Secure` flag, and the developer stays signed in

#### Scenario: Member arrives from a link in another site

- **GIVEN** a signed-in member
- **WHEN** they open a LabOS link from an email, Telegram or the forum
- **THEN** the page loads signed in

## ADDED Requirements

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

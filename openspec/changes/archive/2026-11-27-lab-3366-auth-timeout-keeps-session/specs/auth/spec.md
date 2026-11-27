## MODIFIED Requirements

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

## ADDED Requirements

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

# auth Specification

> Added by LAB-2979. How a page learns whether a member is signed in.

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

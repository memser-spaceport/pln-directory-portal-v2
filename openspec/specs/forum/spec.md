# forum Specification

> Added by LAB-2989. How the directory site calls the forum.

## Purpose

A member reads and posts in the forum. The forum bearer token stays on the server. The browser never receives it.

## Requirements

### Requirement: Forum token stays on the server

The client bundle SHALL NOT contain the forum bearer token. Forum reads and posts SHALL go through a server route. That route SHALL call the forum with the forum token when the server has one and the member has a session. When the server has no forum token, the route SHALL call the forum with the member session token.

#### Scenario: Member reads and posts

- **GIVEN** a signed-in member
- **WHEN** the member reads the forum or posts in it
- **THEN** the browser calls a directory server route
- **AND** the forum bearer token is not in the browser request

#### Scenario: Visitor has no session

- **GIVEN** a visitor with no session
- **WHEN** the visitor requests a forum write through the server route
- **THEN** the route refuses the write
- **AND** the route does not call the forum with the forum token

### Requirement: Impersonation comes from the server session

The server route SHALL send `x-impersonate-member-uid` to the forum only when `isAdminUser` is true for the directory access of the session token. The route SHALL ignore that header for every other member.

#### Scenario: Directory admin posts as another member

- **GIVEN** a signed-in directory admin
- **WHEN** the admin posts as another member
- **THEN** the server route sends `x-impersonate-member-uid` for that member

#### Scenario: Another member sends the header

- **GIVEN** a signed-in member who is not a directory admin
- **WHEN** the member's request includes `x-impersonate-member-uid`
- **THEN** the server route does not send that header to the forum

### Requirement: The forum is not indexed

Every page under `/forum` SHALL be marked `noindex, follow`, because its content is for signed-in members only. `/forum` SHALL answer a signed-out visitor with status 200 at its own address, with the title "Forum | Protocol Labs Directory" and one `<h1>`. A signed-in member without a `cid` SHALL still be sent to `/forum?cid=0`. The list behind the sign-in panel SHALL be a skeleton with no text, hidden from assistive technology.

#### Scenario: Crawler on the forum

- **WHEN** a client without cookies requests `/forum`
- **THEN** the response status is 200, not a redirect
- **AND** the page is marked `noindex, follow` and has one `<h1>`
- **AND** the HTML contains no placeholder post text

#### Scenario: Signed-in member opens the forum

- **GIVEN** a signed-in member
- **WHEN** they open `/forum`
- **THEN** they are sent to `/forum?cid=0` and see the feed

## ADDED Requirements

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

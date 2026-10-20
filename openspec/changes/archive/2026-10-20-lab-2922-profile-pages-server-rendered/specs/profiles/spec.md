# Spec Delta

## Purpose

What member, team and project profile pages give a search engine crawler and a signed-out visitor: the public profile in the first HTML response, and a real "not found" for a profile that does not exist.

## ADDED Requirements

### Requirement: Profile content is in the server HTML

The first HTML response for a member, team or project profile SHALL contain the profile's public content, readable without running JavaScript. A loading state alone does not satisfy this.

#### Scenario: Member profile, fetched without JavaScript

- **GIVEN** an approved member with a name, a role, at least one team and a bio
- **WHEN** a client without cookies requests `/members/<uid>` and reads the HTML without running scripts
- **THEN** the HTML contains the member's name, role, each team's name and the bio text

#### Scenario: Project profile, fetched without JavaScript

- **GIVEN** an existing project with a name and a description
- **WHEN** a client without cookies requests `/projects/<uid>` and reads the HTML without running scripts
- **THEN** the HTML contains the project's name and description text

#### Scenario: Team profile keeps its content

- **GIVEN** an existing team with a name and an about text
- **WHEN** a client without cookies requests `/teams/<uid>` and reads the HTML without running scripts
- **THEN** the HTML contains the team's name and about text, as it does today

### Requirement: Server HTML carries only public data

The server HTML of a member profile SHALL contain only what a signed-out visitor may see. Private fields and edit controls SHALL appear only after the page has loaded in the browser and confirmed the viewer may see them.

#### Scenario: Signed-in owner opens their profile

- **GIVEN** a signed-in member opens their own profile
- **WHEN** the page first renders, before the private profile has loaded
- **THEN** it shows the public profile without edit controls
- **AND WHEN** the private profile has loaded
- **THEN** the page shows their private fields and the edit controls, as today

#### Scenario: Server HTML has no private contact fields

- **GIVEN** a member whose email and contact handles are hidden from signed-out visitors
- **WHEN** a client without cookies requests `/members/<uid>`
- **THEN** the HTML contains neither the email address nor the hidden handles

### Requirement: An unknown profile answers "not found"

A member, team or project profile SHALL answer HTTP 404 with the not-found page when the directory API reports the id as not found.

#### Scenario: Unknown member id

- **GIVEN** no member has the uid `doesnotexist000000000000`
- **WHEN** a client without cookies requests `/members/doesnotexist000000000000`
- **THEN** the response status is 404 and the page is the site's not-found page

#### Scenario: Unknown team id

- **GIVEN** no team has the uid `doesnotexist000000000000`
- **WHEN** a client requests `/teams/doesnotexist000000000000`
- **THEN** the response status is 404 and the page is the site's not-found page

#### Scenario: Unknown project id

- **GIVEN** no project has the uid `doesnotexist000000000000`
- **WHEN** a client requests `/projects/doesnotexist000000000000`
- **THEN** the response status is 404 and the page is the site's not-found page

#### Scenario: Member hidden from signed-out visitors

- **GIVEN** a member who is not visible in the directory (for example, not yet approved)
- **WHEN** a client without cookies requests their profile
- **THEN** the response status is 404

### Requirement: A failed lookup is not "not found"

A profile page SHALL NOT answer 404 when the directory API fails for any reason other than "not found" (a 5xx, a 429, a timeout or a network error). It SHALL show the existing error page, so a crawler retries later. A signed-in viewer SHALL get today's behaviour, because only the browser knows what they may see.

#### Scenario: API outage

- **GIVEN** the directory API answers 503 for a member, team or project id
- **WHEN** a client requests that profile
- **THEN** the response is not a 404
- **AND** the page either loads the profile in the browser or shows the error message, as today

#### Scenario: Signed-in viewer opens a profile hidden from the public

- **GIVEN** a signed-in member who is still pending approval
- **WHEN** they open their own profile
- **THEN** the page does not answer 404 and shows their profile once it loads, as today

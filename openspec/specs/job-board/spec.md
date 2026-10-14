# job-board Specification

> Seeded from code on 2026-10-09 (develop at f76315f10); correct me.
> This file describes the job board as the code behaves now. It is a hint for agents: when it and the code disagree, the code wins.

## Purpose

The job board at `/jobs` lists open roles across the Protocol Labs network, grouped by team. Members save roles, filter to their saved roles, and apply in-app where the hiring team accepts it.

## Requirements

### Requirement: Role permalink page
The system SHALL serve each open role at `/jobs/openings/<uid>` as a public page with the role, its team, and JobPosting structured data. The canonical URL of the page SHALL be the permalink itself.

#### Scenario: Open a known role
- **GIVEN** a role with uid `R` is open on the board
- **WHEN** a visitor opens `/jobs/openings/R`
- **THEN** the page shows the role and its team
- **AND** the page has a `application/ld+json` JobPosting script and a canonical URL of `/jobs/openings/R`

#### Scenario: Open an unknown or removed role
- **GIVEN** no open role has uid `X`
- **WHEN** a visitor opens `/jobs/openings/X`
- **THEN** the system answers with the Next.js not-found page

### Requirement: Legacy detail links on the board
The board SHALL accept `?job=<uid>` on `/jobs`. The link preview metadata SHALL describe that role, with the role permalink as canonical. If the uid does not resolve, the board SHALL use its own listing metadata.

#### Scenario: Shared board link with a job param
- **GIVEN** a role with uid `R` is open
- **WHEN** a crawler fetches `/jobs?job=R`
- **THEN** the page title is `<role title> | Protocol Labs Directory`
- **AND** the canonical URL is `/jobs/openings/R`

### Requirement: Save a role
A signed-in member SHALL be able to save and unsave a role from its row. The bookmark SHALL change at once and SHALL revert if the server refuses. A signed-out visitor who presses Save SHALL go to sign-in and nothing is saved.

#### Scenario: Signed-out visitor presses Save
- **GIVEN** the visitor is not signed in
- **WHEN** the visitor presses the Save bookmark on a role row
- **THEN** the sign-in flow starts
- **AND** no save request is sent

#### Scenario: Member saves a role
- **GIVEN** a signed-in member and a role that is not saved
- **WHEN** the member presses Save
- **THEN** the bookmark shows as filled at once
- **AND** the client sends `POST /v1/job-openings/<uid>/save`
- **AND** on success a toast says "Saved." with a "View saved roles" link that turns on the Saved filter (`?saved=true`)

#### Scenario: Save request fails
- **GIVEN** a signed-in member presses Save or Unsave
- **WHEN** the server refuses the request
- **THEN** the bookmark goes back to its earlier state
- **AND** an error toast says "Could not save this role. Please try again." (or "Could not remove this role. Please try again." for Unsave)

### Requirement: Saved filter
The board SHALL show a "Saved" filter, with a count, to signed-in members only. When on, the board SHALL list only saved roles (server-side, `saved=true`). For a signed-out visitor the system SHALL ignore `saved=true` and show the full board.

#### Scenario: Signed-out visitor opens a saved-filter link
- **GIVEN** the visitor is not signed in
- **WHEN** the visitor opens `/jobs?saved=true`
- **THEN** the board lists all roles, not an error
- **AND** the "Saved" filter is not shown

#### Scenario: Saved filter shows when each role was saved
- **GIVEN** a signed-in member with the Saved filter on
- **WHEN** the board lists a saved role that the member has not applied to
- **THEN** the row time label reads "Saved <relative time>" (for example "Saved 3d ago") instead of the posting age

### Requirement: Applied state on a role row
A row for a role the member has applied to SHALL say so. "Applied" SHALL take priority over "Saved" in the row time label.

#### Scenario: Member has applied to a role
- **GIVEN** a signed-in member has applied to role `R`
- **WHEN** the board lists role `R`
- **THEN** the row time label reads "Applied <relative time>" (for example "Applied 2d ago"), also when the role is saved

### Requirement: Where Apply goes
Apply SHALL leave the site for the team's own posting when the team does not take in-app applications. For a team that is not Protocol Labs, Apply SHALL also leave the site when the viewer is signed out or not yet approved. Protocol Labs roles SHALL take applications in-app for every viewer who can reach Apply.

#### Scenario: Signed-out visitor applies to a non-Protocol Labs role
- **GIVEN** the visitor is not signed in
- **AND** the role belongs to a team that is not Protocol Labs and that takes in-app applications
- **WHEN** the visitor presses Apply
- **THEN** the role's own apply link (the team's posting) opens, not the in-app apply flow

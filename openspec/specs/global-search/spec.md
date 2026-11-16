# global-search Specification

## Purpose

The header Search shows team, member, project, event and forum results from `GET /v1/global-search/all`. This spec covers the admin-only L0/L1 badges on team and member results.

## Requirements

### Requirement: Admins see access badges on search results

When a directory admin (`directory.admin.full`) opens header Search results, a team result SHALL show the LAB-3180 team badge after the name. A member result SHALL show the LAB-3180 member badges after the name. The badges SHALL use the same text and tooltip as `components/common/AccessLevelBadges`.

#### Scenario: Admin finds an L0 team

- **GIVEN** a directory admin, and an `L0` team
- **WHEN** the admin searches for the team name
- **THEN** the team result shows "L0 · Hidden" after the name

#### Scenario: Admin finds a not-approved member

- **GIVEN** a directory admin, and a member with state `PENDING`
- **WHEN** the admin searches for the member name
- **THEN** the member result shows "L0 · Not approved" after the name

### Requirement: Non-admins see no access badges

When the viewer is not a directory admin, search results SHALL show no L0/L1 or Job Aspirant badge. This applies to investors, members and signed-out visitors.

#### Scenario: Investor searches

- **GIVEN** a signed-in investor without `directory.admin.full`
- **WHEN** the investor searches for an `L0` team
- **THEN** the team result shows no access badge

# access-level-badges Specification

## Purpose

`components/common/AccessLevelBadges` shows admin-only access badges on members and teams (LAB-3180). This spec covers the team badge on the team page, the team grid cards and the header Search results.

## Requirements

### Requirement: Admins see a badge only on L0 teams

When a directory admin (`directory.admin.full`) views a team, `TeamAccessBadge` SHALL show "L0 · Hidden" for an `L0` team. It SHALL show no badge for an `L1` team, because an L1 team is approved (LAB-3256). Member badges do not change.

#### Scenario: Admin opens an L0 team

- **GIVEN** a directory admin, and an `L0` team
- **WHEN** the admin opens the team page or sees the team card
- **THEN** the team shows "L0 · Hidden"

#### Scenario: Admin opens an L1 team

- **GIVEN** a directory admin, and an `L1` team
- **WHEN** the admin opens the team page or sees the team card
- **THEN** the team shows no access badge

### Requirement: Non-admins see no team badge

When the viewer is not a directory admin, `TeamAccessBadge` SHALL show nothing.

#### Scenario: Member views an L0 team

- **GIVEN** a signed-in member without `directory.admin.full`
- **WHEN** the member opens an `L0` team
- **THEN** the team shows no access badge

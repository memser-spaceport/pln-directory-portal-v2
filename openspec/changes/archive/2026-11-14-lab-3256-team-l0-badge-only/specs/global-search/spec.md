# Spec Delta

## MODIFIED Requirements

### Requirement: Admins see access badges on search results

When a directory admin (`directory.admin.full`) opens header Search results, an `L0` team result SHALL show the LAB-3180 team badge after the name. An `L1` team result SHALL show no badge, because an L1 team is approved (LAB-3256). A member result SHALL show the LAB-3180 member badges after the name. The badges SHALL use the same text and tooltip as `components/common/AccessLevelBadges`.

#### Scenario: Admin finds an L1 team

- **GIVEN** a directory admin, and an `L1` team
- **WHEN** the admin searches for the team name
- **THEN** the team result shows no access badge

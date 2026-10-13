# Spec Delta

## Purpose

Defines which teams the Networks Map on `/explore-pl-network` shows, which data each team shows, and how the map falls back when Directory data is missing.

## ADDED Requirements

### Requirement: Fixed tile set
The map SHALL show exactly the teams listed in its fallback file (284 as of 2026-10-13), in both Map and List view, whatever the API returns.

#### Scenario: All tiles render with DB data
- **GIVEN** the portfolio API returns 258 teams
- **WHEN** a visitor opens `/explore-pl-network` on the 2026 view
- **THEN** 284 tiles are shown

#### Scenario: API team not in the fallback file
- **GIVEN** the API returns a team whose uid is not in the fallback file
- **WHEN** the page renders
- **THEN** no tile is added for that team

### Requirement: Directory data wins for matched teams
For a team with a Directory uid that the API returns, the map SHALL show the API's name, one-liner, stage, website, white map logo, start year and end year, and SHALL fall back to the file per field when the API value is empty.

#### Scenario: DB one-liner shown
- **GIVEN** a matched team's one-liner in the DB differs from the fallback file
- **WHEN** a visitor opens that team's tile card
- **THEN** the card shows the DB one-liner

#### Scenario: DB has no white map logo
- **GIVEN** the API returns a matched team with `mapLogoUrl: null`
- **WHEN** the map renders
- **THEN** the tile uses the logo from the fallback file

### Requirement: Island stays placeable
The map SHALL use the API island only when it is a known island and equals the fallback island; otherwise it SHALL use the fallback island.

#### Scenario: Unknown island from the API
- **GIVEN** the API returns island `robotics` for a matched team
- **WHEN** the map renders
- **THEN** the tile is drawn in its fallback island's colour and listed under that island in List view

### Requirement: Fallback for unmatched teams
Teams without a Directory uid, and teams with a uid that the API does not return, SHALL show the data from the fallback file and SHALL link to a Directory search by name.

#### Scenario: Team with no Directory match
- **GIVEN** a map team has no uid in the fallback file
- **WHEN** a visitor opens its tile card
- **THEN** the card shows the fallback name and the profile link opens `/teams?searchBy=<name>`

#### Scenario: Matched team missing from the API
- **GIVEN** a team has a uid but the API does not return it
- **WHEN** a visitor opens its tile card
- **THEN** the card shows fallback data and the profile link opens a Directory search

### Requirement: API failure does not break the map
If the portfolio API errors, times out after 5 seconds, or returns no teams, the page SHALL render the full map from the fallback file.

#### Scenario: API down
- **GIVEN** the portfolio API returns HTTP 500
- **WHEN** a visitor opens `/explore-pl-network`
- **THEN** the page renders 284 tiles from the fallback file and no error is shown

### Requirement: Data freshness
The page SHALL show DB changes within one hour without a redeploy.

#### Scenario: DB edit reaches the page
- **GIVEN** a matched team's stage changes in the DB
- **WHEN** a visitor opens the page more than an hour later
- **THEN** the tile card shows the new stage

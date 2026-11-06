## ADDED Requirements

### Requirement: A stale session still shows gatherings

The page SHALL show the public gatherings when a signed-in guest or preferences call fails. The page SHALL show the error view only when the public guest call also fails.

#### Scenario: Signed-in guest call fails

- **GIVEN** a member whose access token is rejected
- **WHEN** the member opens IRL Gatherings
- **THEN** the page shows the public gatherings
- **AND** the page does not show the error view

#### Scenario: Public guest call fails

- **GIVEN** the public guest call fails
- **WHEN** a member opens IRL Gatherings
- **THEN** the page shows the error view

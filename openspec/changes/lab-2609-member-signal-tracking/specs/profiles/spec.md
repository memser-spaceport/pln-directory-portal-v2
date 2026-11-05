# Spec Delta

## ADDED Requirements

### Requirement: Signed-in views and clicks are recorded without changing the page

For a signed-in member, the frontend SHALL send each view of a member, team or project profile, each contact or social link click and contact copy on a member profile, each GitHub project click, team contact click, project link click and member, team or project search result click to the directory API member signal log. A signed-out visitor SHALL send nothing. Sending SHALL never block, change or show an error on the page, and SHALL not change the existing analytics events.

#### Scenario: Signed-in member opens a team profile

- **GIVEN** a signed-in member
- **WHEN** they open a team profile
- **THEN** one `view` signal for that team is sent and the page renders as before

#### Scenario: Signed-out visitor opens a team profile

- **GIVEN** a visitor without a session
- **WHEN** they open a team profile
- **THEN** no signal is sent

#### Scenario: Signal call fails

- **GIVEN** the member signal API is unreachable
- **WHEN** a signed-in member copies a contact detail
- **THEN** the page shows no error and nothing else changes

#### Scenario: Event search result

- **WHEN** a signed-in member clicks an event result in search
- **THEN** no signal is sent and the existing search analytics event is sent as before

# Spec Delta

## ADDED Requirements

### Requirement: Candidates page sign-in
The team Candidates page SHALL show candidates only to a signed-in lead of the team or a Directory admin. With the Candidates feature on, a signed-out visitor SHALL go to sign-in, with a return link to the same page that keeps only the `role`, `candidate` and `suggested` fields of the link. With the feature off, a signed-out visitor SHALL go to the team profile. A signed-in person whose sign-in data shows they are not a lead or an admin SHALL go to the team profile.

#### Scenario: Signed-out lead opens a Candidates link
- **GIVEN** the Candidates feature is on and the visitor is not signed in
- **WHEN** the visitor opens `/teams/<id>/applicants?role=<roleUid>&suggested=<memberUid>`
- **THEN** the visitor goes to sign-in, not to the team profile
- **AND** no candidate is shown

#### Scenario: Lead comes back after sign-in
- **GIVEN** a lead of the team signed in from a Candidates link with `role` and `suggested`
- **WHEN** sign-in completes
- **THEN** the Candidates page opens with that role on the Suggested tab and that person open

#### Scenario: Return link keeps only the Candidates fields
- **GIVEN** the Candidates feature is on and the visitor is not signed in
- **WHEN** the visitor opens a Candidates link with `role`, `candidate`, `suggested` and other query fields
- **THEN** the sign-in return link holds `role`, `candidate` and `suggested` only

#### Scenario: Signed-out visitor while the feature is off
- **GIVEN** the Candidates feature is off and the visitor is not signed in
- **WHEN** the visitor opens a Candidates link
- **THEN** the visitor goes to the team profile, not to sign-in

#### Scenario: Signed-in person who is not on the team
- **GIVEN** a signed-in person who is not a lead of the team and is not a Directory admin
- **AND** the sign-in data states the person's permissions
- **WHEN** the person opens a Candidates link
- **THEN** the person goes to the team profile

#### Scenario: Signed-in person whose sign-in data has no permissions
- **GIVEN** a signed-in person who is not a lead of the team
- **AND** the sign-in data does not state the person's permissions
- **WHEN** the person opens a Candidates link
- **THEN** the page shows no candidates, because the server refuses them

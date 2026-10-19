## ADDED Requirements

### Requirement: Edit AI criteria button on the Suggested tab

On the Suggested tab of the candidates page, under the tab note, the page SHALL show a small bordered grey button with the AI mark and the label "Edit AI criteria" when the role has criteria to edit. The button SHALL open the Edit criteria modal. The note SHALL NOT end in an "Edit criteria" link. The Suggested tab SHALL show no search field; the Applied and Interested tabs SHALL keep it, and a term typed there SHALL NOT filter the Suggested list.

#### Scenario: Lead opens Edit AI criteria

- **GIVEN** a lead opens the Suggested tab of a role with criteria
- **WHEN** the lead presses "Edit AI criteria" under the note
- **THEN** the Edit criteria modal opens
- **AND** the note has no "Edit criteria" link

#### Scenario: Role without criteria

- **GIVEN** a role has no criteria, or the response carries none
- **WHEN** a lead opens the Suggested tab
- **THEN** no "Edit AI criteria" button shows

#### Scenario: No search on Suggested

- **GIVEN** a lead types "ana" in the search on the Applied tab
- **WHEN** the lead opens the Suggested tab
- **THEN** no search field shows
- **AND** every suggested person is listed

#### Scenario: Search stays on Applied and Interested

- **WHEN** a lead opens the Applied or the Interested tab
- **THEN** the "Search by name or role" field shows

## MODIFIED Requirements

### Requirement: Suggestions response with or without contact and criteria fields

The Suggested tab SHALL load when the suggestions response carries `contactedAt` per person, a role-level `criteria` list and a role-level `criteriaPrompt` (string or null), and SHALL also load when it carries none of them. Any other field the page does not know SHALL still fail the read.

#### Scenario: Older response without the new fields

- **GIVEN** a lead of the team opens the Suggested tab of a live role
- **WHEN** the suggestions response has no `contactedAt` and no `criteria`
- **THEN** the tab lists the suggestions as before
- **AND** no "Edit AI criteria" action is shown

#### Scenario: Newer response with the new fields

- **GIVEN** a lead of the team opens the Suggested tab of a live role
- **WHEN** the response carries `contactedAt` for each person and a `criteria` list of `{ text, enabled }`
- **THEN** the tab lists the suggestions
- **AND** the tab offers "Edit AI criteria" under its note

#### Scenario: Criteria with labels and groups

- **WHEN** the role's `criteria` items and each person's `criteria` items carry an optional `label` and `group`
- **THEN** the tab loads, with or without them
- **AND** a `group` other than Skills, Experience, Seniority, Location or Other is read as Other, and the tab still loads
- **AND** any other unknown field on a criterion still fails the read

### Requirement: Edit a role's match criteria

From the Suggested tab, a lead SHALL be able to open "Edit criteria", switch each of the role's requirements on or off, write who they are looking for in one free-text box (at most 500 characters, with a counter), and save both. The box SHALL open on the saved prompt (`criteriaPrompt`). The modal's title SHALL read "Edit AI criteria" and its subtitle "What the AI matches members against for <role title>." Its footer SHALL read "Changes apply from next week's suggestions." with Cancel and Save.

#### Scenario: Lead saves switched-off requirements

- **GIVEN** a lead opens "Edit criteria" for a role with requirements A, B and C, all on
- **WHEN** the lead switches B off and saves
- **THEN** the client sends `PUT /v1/job-openings/<roleUid>/match-criteria` with `{ "disabled": ["B"], "prompt": null }`
- **AND** the modal closes
- **AND** the current suggestions and their requirement counts do not change

#### Scenario: Lead saves a prompt

- **GIVEN** a lead opens "Edit criteria" and the role has no saved prompt
- **WHEN** the lead types "Ran a storage network" in the box and saves
- **THEN** the request body carries `"prompt": "Ran a storage network"` (trimmed) with the switches
- **AND** the next open of the modal shows the saved prompt

#### Scenario: Lead clears the prompt

- **GIVEN** a role has a saved prompt
- **WHEN** the lead empties the box and saves
- **THEN** the request body carries `"prompt": null`
- **AND** the prompt is cleared

#### Scenario: Prompt too long

- **WHEN** the box holds more than 500 characters
- **THEN** Save is disabled

#### Scenario: Saved switches survive a reload

- **GIVEN** a lead saved B as off
- **WHEN** the lead reloads the page and opens "Edit criteria" again
- **THEN** B shows as off and A and C show as on

#### Scenario: Cancel discards the draft

- **GIVEN** a lead switches requirements in the open modal
- **WHEN** the lead cancels or closes the modal
- **THEN** nothing is sent and the next open shows the saved switches

#### Scenario: Modal states when the change applies

- **WHEN** a lead opens "Edit criteria" for "Senior Rust Engineer"
- **THEN** the title reads "Edit AI criteria"
- **AND** the subtitle reads "What the AI matches members against for Senior Rust Engineer."
- **AND** the footer reads "Changes apply from next week's suggestions." beside Cancel and Save

#### Scenario: Analytics event on save

- **GIVEN** a lead saves the criteria
- **WHEN** the server accepts the save
- **THEN** the page sends the PostHog event `job-suggested-criteria-edited` with the team, the role, and how many requirements are on and off

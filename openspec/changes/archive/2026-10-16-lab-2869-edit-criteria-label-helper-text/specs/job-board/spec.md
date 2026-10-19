## ADDED Requirements

### Requirement: Criteria prompt box says the AI reads it

In the "Edit criteria" modal, the free-text box label SHALL read "Help us suggest better members for <role title>." ("this role" when the role has no title). Under the label, a helper text SHALL read "Tell the AI who you're looking for". Assistive technology SHALL announce the helper text and the character counter with the box.

#### Scenario: Label names the role

- **GIVEN** a lead opens "Edit criteria" for "Storage Engineer"
- **WHEN** the lead looks at the free-text box
- **THEN** its label reads "Help us suggest better members for Storage Engineer."
- **AND** the helper text "Tell the AI who you're looking for" shows under the label

#### Scenario: Role without a title

- **GIVEN** a role has an empty title
- **WHEN** a lead opens "Edit criteria" for it
- **THEN** the box label reads "Help us suggest better members for this role."

#### Scenario: Screen reader hears the helper text and the counter

- **WHEN** a screen reader user moves to the free-text box
- **THEN** the box is described by the helper text and by the counter "<n> / 500"

## MODIFIED Requirements

### Requirement: Edit a role's match criteria

From the "Why suggested" pane, a lead SHALL be able to open "Edit criteria", switch each of the role's requirements on or off, write who they are looking for in one free-text box (at most 500 characters, with a character counter), and save both together. The box SHALL open on the saved prompt (`criteriaPrompt`). The modal's subtitle SHALL read "What counts as a fit for <role title>." Its footer SHALL read "Changes apply from next week's suggestions." on the left, with Cancel and Save on the right.

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
- **THEN** the subtitle reads "What counts as a fit for Senior Rust Engineer."
- **AND** the footer reads "Changes apply from next week's suggestions." beside Cancel and Save

#### Scenario: Analytics event on save

- **GIVEN** a lead saves the criteria
- **WHEN** the server accepts the save
- **THEN** the page sends the PostHog event `job-suggested-criteria-edited` with the team, the role, and how many requirements are on and off

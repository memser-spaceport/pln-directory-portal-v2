# Spec Delta

## ADDED Requirements

### Requirement: Each proposed edit shows an action card

A finished answer SHALL show one action card for each proposal in the C1 `proposals` list (profile fields, experience add or change, team edit). A card SHALL show the proposal title and, for each change, the label and the old and new values. An empty value SHALL read "Empty". The card SHALL show Confirm and Cancel. Nothing SHALL save before Confirm (D2). Confirm and Cancel SHALL call C2 with only `proposalId` and `decision`. While C2 runs, the buttons SHALL be disabled, so a double press sends one request. A card SHALL be used once: after done, cancelled, a 403 or a final error, it SHALL have no buttons. Card state SHALL live with its turn in the store, so it SHALL survive close and reopen from the same context. The client SHALL drop a proposal that has no id, an unknown tool or no changes.

#### Scenario: Confirm saves the edit

- **GIVEN** an answer with a proposal to change the bio
- **WHEN** the member presses Confirm
- **THEN** the card shows Saving, C2 gets `{ proposalId, decision: 'confirm' }`, and the card shows the C2 `summary` with no buttons

#### Scenario: Cancel

- **WHEN** the member presses Cancel
- **THEN** C2 gets `decision: 'cancel'` and the card shows "Cancelled. Nothing was saved." with no buttons
- **AND** a failed Cancel still closes the card, because the backend wrote nothing and the proposal expires

#### Scenario: Not allowed

- **WHEN** C2 answers 403
- **THEN** the card shows "You cannot make this change. Nothing was saved." with no buttons

#### Scenario: Error with Retry

- **WHEN** C2 gives no answer, a 401 or a server error
- **THEN** the card shows a message and Retry, and Retry sends Confirm again
- **AND** for 404, 409, 410 and 422 the card shows a message (with the 422 `message`) and no Retry

## MODIFIED Requirements

### Requirement: The API sits behind one client with a mock

All agent calls SHALL go through `getLabosAgentClient()`. The live client SHALL call C1, C2 and the access check with `customFetch` (the member's session). The live client SHALL be the default (`LABOS_AGENT_MOCK_BY_DEFAULT = false`). `localStorage['labos-agent-api'] = 'mock'` SHALL select the mock in one browser: scripted answers, no network and no member data. While the mock is on, the panel header SHALL show a "Mock answers" label. The mock SHALL break the connection for a message with "error", stall for "stall", and use web sources for "web". It SHALL propose a profile edit for "edit profile" and a team edit for "edit team". For "forbidden", it SHALL propose a team edit that gets a 403 on Confirm. For "save fails", the first Confirm SHALL get no answer. QA can test each path.

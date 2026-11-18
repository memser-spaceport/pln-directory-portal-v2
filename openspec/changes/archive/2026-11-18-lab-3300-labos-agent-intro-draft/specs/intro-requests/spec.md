# Spec Delta

## MODIFIED Requirements

### Requirement: The intro flow sends funnel events

`source` SHALL be `modal` for the Request an intro dialog and `agent` for the LabOS agent draft card (LAB-3300, S3-R16). The dialog events SHALL not change. The draft card SHALL send `intro-request-dialog-opened` when the card shows, `intro-request-dialog-closed` on Cancel, `intro-request-submit-failed` on a failed send and `ask-submitted` on a 200, all with `source` `agent` and the `entryPoint` of "Ask the agent". `source` SHALL never go in the C3 body.

#### Scenario: Send from the agent

- **GIVEN** a draft card from "Ask the agent" on a member page
- **WHEN** the send succeeds
- **THEN** PostHog receives `ask-submitted` with `type` `intro`, `targetType` `member`, `entryPoint` `member-header`, `source` `agent` and `textLength`

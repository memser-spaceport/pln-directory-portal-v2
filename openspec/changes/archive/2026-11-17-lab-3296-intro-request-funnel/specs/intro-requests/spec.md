# Spec Delta

## ADDED Requirements

### Requirement: The intro flow sends funnel events

The intro flow sends PostHog events for each funnel step (LAB-3296, spec from LAB-3272). Every event carries `targetType` (`member` or `team`), `entryPoint` (`member-header`, `team-header` or `suggested-tab`) and `source` (`modal`), plus `loggedInUserUid`. No event carries the message text, a name or an email. Text appears only as `textLength`, the length of the trimmed message.

| Event                         | When                                                                    | Extra properties                                                    |
| ----------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `intro-request-button-shown`  | The "Request an intro" control shows. Once a page view for each target. | none                                                                |
| `intro-request-dialog-opened` | The member clicks "Request an intro".                                   | none                                                                |
| `intro-request-dialog-closed` | The form closes with no send (Cancel, the X button or Escape).          | `hadText`, `textLength`                                             |
| `intro-request-submit-failed` | The send fails.                                                         | `status` (HTTP status; `0` when there is no response), `textLength` |
| `ask-submitted`               | The send succeeds.                                                      | `type` `intro`, `textLength`                                        |

The member page header uses `entryPoint` `member-header`. The team page header uses `team-header`. `suggested-tab` is reserved for the Suggested tab of team candidates when it shows the control. `source` `agent` comes with the LabOS agent (LAB-3272) and is out of scope here.

#### Scenario: Control shows

- **GIVEN** an eligible member on another member's page
- **WHEN** the page shows "Request an intro"
- **THEN** PostHog receives one `intro-request-button-shown` with `targetType` `member`, `entryPoint` `member-header` and `source` `modal`
- **AND** a re-render of the same page sends no second event

#### Scenario: Form opens

- **WHEN** the member clicks "Request an intro" on a team page
- **THEN** PostHog receives `intro-request-dialog-opened` with `targetType` `team` and `entryPoint` `team-header`

#### Scenario: Form closes with no send

- **GIVEN** the member typed text in the form
- **WHEN** they click Cancel
- **THEN** PostHog receives `intro-request-dialog-closed` with `hadText` `true` and `textLength` equal to the trimmed text length
- **AND** a close after a successful send does not send `intro-request-dialog-closed`

#### Scenario: Send is forbidden

- **WHEN** the API responds 403
- **THEN** PostHog receives `intro-request-submit-failed` with `status` `403` and `textLength`
- **AND** PostHog does not receive `ask-submitted`

## MODIFIED Requirements

### Requirement: A successful send confirms receipt

After `POST /v1/intro-requests` succeeds, the form shows "Your request is received. Someone from the team will reach out." The request body is `{ "type": "MEMBER" | "TEAM", "targetId", "text" }`. The page then sends the PostHog event `ask-submitted` with `type` `intro`, the shared intro request properties (`targetType`, `entryPoint`, `source`) and `textLength`. `ask-submitted` does not send `loggedInUserEmail` or `loggedInUserName` (LAB-3296).

#### Scenario: Intro to a member

- **WHEN** the member sends a request from a member page and the API returns `{ uid }`
- **THEN** the form shows "Your request is received. Someone from the team will reach out."
- **AND** PostHog receives `ask-submitted` with `type` `intro`, `targetType` `member`, `entryPoint` `member-header`, `source` `modal` and `textLength`

#### Scenario: Intro to a team

- **WHEN** the member sends a request from a team page and the API returns `{ uid }`
- **THEN** PostHog receives `ask-submitted` with `type` `intro`, `targetType` `team`, `entryPoint` `team-header` and `source` `modal`
- **AND** the event has no email, no name and no message text

### Requirement: A failed send keeps the message

When the send fails, the form stays open, shows a clear error, and keeps the text the member wrote.

#### Scenario: The target is missing

- **WHEN** the API responds 404
- **THEN** the form shows the error and the text field still holds the message
- **AND** PostHog does not receive `ask-submitted`
- **AND** PostHog receives `intro-request-submit-failed` with `status` `404`

# intro-requests Specification

## Purpose

A signed-in member with a current role on a PL Portfolio team, or with the PL Infra policy, can ask the PL team for an introduction from a member page or a team page.

## Requirements

### Requirement: Only an eligible member sees Request an intro

A signed-in member sees a "Request an intro" control on another member's page and on a team page when that member has a current role on a PL Portfolio team, or holds the PL Infra policy `pl_infra_team_pl_internal`. A current role has no end date, or an end date that is still today or later. Every other visitor sees no control. A member sees no control on their own profile, or on a team page for a team they currently belong to. A directory admin who is eligible sees the control too, before Edit. A member page shows one contact button in the profile header: Schedule Meeting when the member has office hours and the viewer may book them, otherwise "Request an intro". The page never shows both. The Office Hours card has no Schedule Meeting button. Where a page does not offer booking (the Suggested tab of team candidates), the contact button is "Request an intro". A team page always shows "Request an intro" to an eligible member outside the team. The investor drawer and the apply flow do not show the control.

#### Scenario: Portfolio member on another profile

- **GIVEN** a signed-in member with a current role on a team whose community affiliation is PL Portfolio
- **WHEN** they open another member's profile
- **THEN** the profile header shows "Request an intro"

#### Scenario: PL Infra member on a team page

- **GIVEN** a signed-in member with the PL Infra policy and no portfolio role
- **WHEN** they open a team page for a team they do not belong to
- **THEN** the team header shows "Request an intro"

#### Scenario: Not eligible

- **GIVEN** a signed-in member with no current portfolio role and no PL Infra policy
- **WHEN** they open a member page or a team page
- **THEN** the page shows no "Request an intro" control

#### Scenario: Member with office hours

- **GIVEN** an eligible signed-in member
- **WHEN** they open the page of a member who has office hours
- **THEN** the profile header shows Schedule Meeting in the glossy primary style, on the name's line
- **AND** the page shows no "Request an intro" control
- **AND** the Office Hours card shows no Schedule Meeting button

#### Scenario: Viewer who cannot book office hours

- **GIVEN** an eligible signed-in member without access to book office hours
- **WHEN** they open the page of a member who has office hours
- **THEN** the profile header shows "Request an intro" and no Schedule Meeting

#### Scenario: Own profile

- **GIVEN** an eligible signed-in member
- **WHEN** they open their own profile
- **THEN** the page shows no "Request an intro" control

### Requirement: Request an intro sits on the name's line

"Request an intro" and Schedule Meeting share one glossy primary style: 34px high, padding 6px 10px, a 16px icon (an envelope on "Request an intro", a calendar on Schedule Meeting) and a 6px gap. At 640px or wider it sits in one row at the top right of the header, on the same line as the name. The row order is Follow (team pages only), "Request an intro", Edit, then Delete (team admins only). Every item centres on the 34px button. The row has no caption under Follow. The facts line (team, role, city) on a member page sits under the name and the actions and spans the full card width, so it runs under the actions to the card's right edge. When it does not fit, it wraps, and a wrapped line never starts or ends on a divider. The city has no extra right padding. Below 640px on a team page, Edit and Delete are icon-only in the card's top-right corner, and Follow then "Request an intro" are full-width buttons under the followers. Below 640px on a member page, Edit sits on the right under the facts and "Request an intro" is a full-width button below it.

#### Scenario: Team page from 640px

- **GIVEN** an eligible member on a team page at least 640px wide
- **WHEN** the page shows Follow and "Request an intro"
- **THEN** "Request an intro" sits to the right of Follow on the same row
- **AND** the page shows no "Get updates & announcements" caption

#### Scenario: Team page below 640px

- **GIVEN** an eligible member on a team page below 640px wide
- **WHEN** the page shows Follow and "Request an intro"
- **THEN** Follow and "Request an intro" are full-width buttons under the followers, Follow first

#### Scenario: Member page from 640px

- **GIVEN** an eligible member on another member's page at least 640px wide
- **WHEN** the page shows "Request an intro"
- **THEN** "Request an intro" sits at the top right of the profile header, on the same line as the member's name
- **AND** Edit, when shown, follows it and centres on the button

#### Scenario: Long facts line

- **GIVEN** a member page at least 640px wide whose facts line is longer than the space beside the actions
- **WHEN** the page shows the header
- **THEN** the facts line sits under the name and the actions and reaches the card's right edge

#### Scenario: Member page below 640px

- **GIVEN** an eligible member on another member's page below 640px wide
- **WHEN** the page shows "Request an intro"
- **THEN** "Request an intro" is a full-width primary button in the profile header

### Requirement: A sent request replaces the button

After a successful send, "Request an intro" on that page becomes the line "✓ Intro requested" in the same 34px box, so the row does not move.

#### Scenario: Request sent

- **WHEN** the member sends a request and the API returns `{ uid }`
- **THEN** the button is replaced by "✓ Intro requested"
- **AND** the other actions in the row keep their place

### Requirement: The form sends one required message

"Request an intro" opens a form. The form has one required text field, "What do you need help with?", with the placeholder "For example: We are raising a seed round and want advice from someone who has raised from crypto funds." and a maximum of 3500 characters. Under the field, the form shows "Be specific. Say what you are looking for (advice, a partnership, business development or fundraising) and why now. This helps us find the right person and make a good intro." Send stays disabled until the trimmed text has at least 20 characters. When the trimmed text has 1 to 19 characters, the form shows "Add a bit more detail so we can find the right person." An empty field, or a field of only spaces, keeps Send disabled and does not show that message. A click on the backdrop does not close the form.

#### Scenario: Empty message

- **WHEN** the member opens the form and the field is empty or only spaces
- **THEN** Send is disabled
- **AND** the form does not show "Add a bit more detail so we can find the right person."

#### Scenario: Short message

- **WHEN** the trimmed text has 1 to 19 characters
- **THEN** the form shows "Add a bit more detail so we can find the right person."
- **AND** Send is disabled

#### Scenario: Enough detail

- **WHEN** the trimmed text has at least 20 characters
- **THEN** Send is enabled
- **AND** the form does not show "Add a bit more detail so we can find the right person."

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

### Requirement: The intro flow sends funnel events

The intro flow sends PostHog events for each funnel step (LAB-3296, spec from LAB-3272). Every event carries `targetType` (`member` or `team`), `entryPoint` (`member-header`, `team-header` or `suggested-tab`) and `source` (`modal` or `agent`), plus `loggedInUserUid`. No event carries the message text, a name or an email. Text appears only as `textLength`, the length of the trimmed message.

| Event                         | When                                                                    | Extra properties                                                    |
| ----------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `intro-request-button-shown`  | The "Request an intro" control shows. Once a page view for each target. | none                                                                |
| `intro-request-dialog-opened` | The member clicks "Request an intro".                                   | none                                                                |
| `intro-request-dialog-closed` | The form closes with no send (Cancel, the X button or Escape).          | `hadText`, `textLength`                                             |
| `intro-request-submit-failed` | The send fails.                                                         | `status` (HTTP status; `0` when there is no response), `textLength` |
| `ask-submitted`               | The send succeeds.                                                      | `type` `intro`, `textLength`                                        |

The member page header uses `entryPoint` `member-header`. The team page header uses `team-header`. `suggested-tab` is reserved for the Suggested tab of team candidates when it shows the control. `source` is `modal` for the dialog. The LabOS agent draft card (LAB-3300) sends `intro-request-dialog-opened` when the card shows, `intro-request-dialog-closed` on Cancel, `intro-request-submit-failed` and `ask-submitted`, with `source` `agent` and the `entryPoint` of "Ask the agent". The dialog events do not change. `source` never goes in the request body.

#### Scenario: Control shows

- **GIVEN** an eligible member on another member's page
- **WHEN** the page shows "Request an intro"
- **THEN** PostHog receives one `intro-request-button-shown` with `targetType` `member`, `entryPoint` `member-header` and `source` `modal`
- **AND** a re-render of the same page sends no second event

#### Scenario: Page mounts two copies of the control

- **GIVEN** a team page that renders a desktop copy and a mobile copy of "Request an intro" and hides one with CSS
- **WHEN** the page loads
- **THEN** PostHog receives one `intro-request-button-shown` for the team
- **AND** after a send from one copy, every copy shows "✓ Intro requested"

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

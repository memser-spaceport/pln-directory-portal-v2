# intro-requests Specification

## Purpose

A signed-in member with a current role on a PL Portfolio team, or with the PL Infra policy, can ask the PL team for an introduction from a member page or a team page.

## Requirements

### Requirement: Only an eligible member sees Request intro

A signed-in member sees a "Request intro" control on another member's page and on a team page when that member has a current role on a PL Portfolio team, or holds the PL Infra policy `pl_infra_team_pl_internal`. A current role has no end date, or an end date that is still today or later. Every other visitor sees no control. A member sees no control on their own profile, or on a team page for a team they currently belong to. The investor drawer and the apply flow do not show the control.

#### Scenario: Portfolio member on another profile

- **GIVEN** a signed-in member with a current role on a team whose community affiliation is PL Portfolio
- **WHEN** they open another member's profile
- **THEN** the profile header shows "Request intro"

#### Scenario: PL Infra member on a team page

- **GIVEN** a signed-in member with the PL Infra policy and no portfolio role
- **WHEN** they open a team page for a team they do not belong to
- **THEN** the team header shows "Request intro"

#### Scenario: Not eligible

- **GIVEN** a signed-in member with no current portfolio role and no PL Infra policy
- **WHEN** they open a member page or a team page
- **THEN** the page shows no "Request intro" control

#### Scenario: Own profile

- **GIVEN** an eligible signed-in member
- **WHEN** they open their own profile
- **THEN** the page shows no "Request intro" control

### Requirement: The form sends one required message

"Request intro" opens a form. The form has one required text field, "Why would you like an intro?", with a maximum of 4000 characters, and a Send button. Send stays disabled until the field has non-whitespace text. A click on the backdrop does not close the form.

#### Scenario: Empty message

- **WHEN** the member opens the form and the field is empty or only spaces
- **THEN** Send is disabled

### Requirement: A successful send confirms receipt

After `POST /v1/intro-requests` succeeds, the form shows "Your request is received. Someone from the team will reach out." The request body is `{ "type": "MEMBER" | "TEAM", "targetId", "text" }`. The page then sends the PostHog event `ask-submitted` with `type` `intro` and `targetType` `member` or `team`, plus the signed-in member fields used by other events.

#### Scenario: Intro to a member

- **WHEN** the member sends a request from a member page and the API returns `{ uid }`
- **THEN** the form shows "Your request is received. Someone from the team will reach out."
- **AND** PostHog receives `ask-submitted` with `type` `intro` and `targetType` `member`

#### Scenario: Intro to a team

- **WHEN** the member sends a request from a team page and the API returns `{ uid }`
- **THEN** PostHog receives `ask-submitted` with `type` `intro` and `targetType` `team`

### Requirement: A failed send keeps the message

When the send fails, the form stays open, shows a clear error, and keeps the text the member wrote.

#### Scenario: The target is missing

- **WHEN** the API responds 404
- **THEN** the form shows the error and the text field still holds the message
- **AND** PostHog does not receive `ask-submitted`

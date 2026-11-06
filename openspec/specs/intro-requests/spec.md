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

### Requirement: Request intro sits beside Follow on a team page

On a team page at 640px or wider, "Request intro" sits to the right of Follow. Below 640px, "Request intro" is a full-width primary button above Follow, and Follow is full width too. On another member's page, "Request intro" stays in the profile header. Below 640px on a member page, it is a full-width primary button.

#### Scenario: Team page from 640px

- **GIVEN** an eligible member on a team page at least 640px wide
- **WHEN** the page shows Follow and "Request intro"
- **THEN** "Request intro" sits to the right of Follow

#### Scenario: Team page below 640px

- **GIVEN** an eligible member on a team page below 640px wide
- **WHEN** the page shows Follow and "Request intro"
- **THEN** "Request intro" is a full-width primary button above Follow
- **AND** Follow is full width

#### Scenario: Member page below 640px

- **GIVEN** an eligible member on another member's page below 640px wide
- **WHEN** the page shows "Request intro"
- **THEN** "Request intro" is a full-width primary button in the profile header

### Requirement: The form sends one required message

"Request intro" opens a form. The form has one required text field, "What do you need help with?", with the placeholder "For example: We are raising a seed round and want advice from someone who has raised from crypto funds." and a maximum of 4000 characters. Under the field, the form shows "Be specific. Say what you are looking for (advice, a partnership, business development or fundraising) and why now. This helps us find the right person and make a good intro." Send stays disabled until the trimmed text has at least 20 characters. When the trimmed text has 1 to 19 characters, the form shows "Add a bit more detail so we can find the right person." An empty field, or a field of only spaces, keeps Send disabled and does not show that message. A click on the backdrop does not close the form.

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

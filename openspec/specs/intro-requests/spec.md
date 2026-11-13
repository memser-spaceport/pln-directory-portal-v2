# intro-requests Specification

## Purpose

A signed-in member with a current role on a PL Portfolio team, or with the PL Infra policy, can ask the PL team for an introduction from a member page or a team page.

## Requirements

### Requirement: Only an eligible member sees Request an intro

A signed-in member sees a "Request an intro" control on another member's page and on a team page when that member has a current role on a PL Portfolio team, or holds the PL Infra policy `pl_infra_team_pl_internal`. A current role has no end date, or an end date that is still today or later. Every other visitor sees no control. A member sees no control on their own profile, or on a team page for a team they currently belong to. A directory admin who is eligible sees the control too, before Edit. A member page shows one contact button: when the member has office hours, the page shows only Schedule Meeting and no "Request an intro"; otherwise it shows only "Request an intro". A team page always shows "Request an intro" to an eligible member outside the team. The investor drawer and the apply flow do not show the control.

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
- **THEN** the page shows Schedule Meeting
- **AND** the page shows no "Request an intro" control

#### Scenario: Own profile

- **GIVEN** an eligible signed-in member
- **WHEN** they open their own profile
- **THEN** the page shows no "Request an intro" control

### Requirement: Request an intro sits on the name's line

"Request an intro" uses the glossy primary style of Schedule Meeting: 34px high, padding 6px 10px, a 16px envelope icon and a 6px gap. At 640px or wider it sits in one row at the top right of the header, on the same line as the name. The row order is Follow (team pages only), "Request an intro", Edit, then Delete (team admins only). Every item centres on the 34px button. The row has no caption under Follow. The facts line (team, role, city) on a member page sits under the name and the actions and spans the full card width, so it runs under the actions to the card's right edge. When it does not fit, it wraps, and a wrapped line never starts or ends on a divider. The city has no extra right padding. Below 640px on a team page, Edit and Delete are icon-only in the card's top-right corner, and Follow then "Request an intro" are full-width buttons under the followers. Below 640px on a member page, Edit sits on the right under the facts and "Request an intro" is a full-width button below it.

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

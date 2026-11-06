## ADDED Requirements

### Requirement: Request intro sits beside Follow on a team page

On a team page at 640px or wider, "Request intro" sits to the left of Follow. Below 640px, "Request intro" is a full-width primary button above Follow, and Follow is full width too. On another member's page, "Request intro" stays in the profile header. Below 640px on a member page, it is a full-width primary button.

#### Scenario: Team page from 640px

- **GIVEN** an eligible member on a team page at least 640px wide
- **WHEN** the page shows Follow and "Request intro"
- **THEN** "Request intro" sits to the left of Follow

#### Scenario: Team page below 640px

- **GIVEN** an eligible member on a team page below 640px wide
- **WHEN** the page shows Follow and "Request intro"
- **THEN** "Request intro" is a full-width primary button above Follow
- **AND** Follow is full width

#### Scenario: Member page below 640px

- **GIVEN** an eligible member on another member's page below 640px wide
- **WHEN** the page shows "Request intro"
- **THEN** "Request intro" is a full-width primary button in the profile header

## MODIFIED Requirements

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

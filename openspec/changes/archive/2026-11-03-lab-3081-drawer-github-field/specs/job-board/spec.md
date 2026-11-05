# Spec Delta

## ADDED Requirements

### Requirement: GitHub contact in the job-board profile drawer
The Contact Details edit form in the job-board profile drawer SHALL show a GitHub field with the same label, placeholder, logo and validation as the member profile's Contact Details edit. On save, the form SHALL send the bare GitHub handle in the member update request, and SHALL keep the other saved contacts and the sharing preferences.

#### Scenario: Member adds a GitHub handle in the drawer
- **GIVEN** a signed-in member opens the job-board profile drawer (Update profile, or the Apply step "Complete your profile")
- **WHEN** the member presses Edit in Contact Details
- **THEN** the "Edit Contact Details" form shows a "Github" field next to Email, LinkedIn, Telegram, X (Twitter) and Bluesky
- **AND** the field shows the member's saved GitHub handle when one exists

#### Scenario: Member saves a GitHub URL
- **GIVEN** the drawer's "Edit Contact Details" form is open
- **WHEN** the member enters `https://github.com/<name>` or `<name>` in the GitHub field and saves
- **THEN** the member update request carries the bare handle `<name>` as the GitHub handle
- **AND** the saved Discord handle and the contact sharing preferences keep their values

#### Scenario: Invalid GitHub value
- **GIVEN** the drawer's "Edit Contact Details" form is open
- **WHEN** the member enters a value that is not a GitHub handle or GitHub URL and saves
- **THEN** the form shows the same validation message as the member profile's Contact Details edit and sends no request

### Requirement: GitHub contact and repositories after a drawer save
After a successful save of the drawer's Contact Details form, the drawer's Contact Details view SHALL list the GitHub handle, and the Repositories section SHALL show the public repositories of that GitHub user, or the empty text when there are none, without a page reload.

#### Scenario: Repositories fill after the save
- **GIVEN** a member with no GitHub handle opens the job-board profile drawer
- **WHEN** the member saves a GitHub handle in Contact Details
- **THEN** the drawer closes the form with no error
- **AND** the Contact Details view lists the GitHub handle
- **AND** the Repositories section refreshes and lists the repositories, or shows "No repositories to display"

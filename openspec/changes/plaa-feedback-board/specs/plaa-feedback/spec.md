# Spec Delta

## Purpose

What a PLAA member can submit, see, vote on and comment on in the Feedback Board; who may see a private bug; what an admin can move; and how a submission reaches Linear.

## ADDED Requirements

### Requirement: A member can submit feedback of three types

The board SHALL accept a submission of type New feature, Bug, or Improvement, with a title of 5 to 120 characters and a description of 20 to 5,000 characters. It SHALL additionally accept up to 3 screenshots (PNG, JPG, or WebP, 5 MB each), one `https://` link, and an importance note of up to 2,000 characters.

#### Scenario: Valid submission

- **GIVEN** a signed-in PLAA member on the Feedback page
- **WHEN** they open Give feedback, choose a type, and enter a valid title and description
- **THEN** Submit is enabled
- **AND** the item is created with status Under Review, carrying the author's own vote

#### Scenario: Description too short

- **GIVEN** the Give feedback form
- **WHEN** the description is under 20 characters
- **THEN** Submit is disabled and an inline error names the limit

#### Scenario: Link that is not https

- **GIVEN** the Give feedback form
- **WHEN** the link does not start with `https://`
- **THEN** Submit is disabled and an inline error says so

#### Scenario: Unsaved text is not lost by accident

- **GIVEN** the form has text in any field
- **WHEN** the member presses Escape or clicks outside the modal
- **THEN** a discard confirmation appears, and the text survives if they choose to keep editing

### Requirement: Screenshots reach the PLAA team, never the board

Screenshots SHALL be validated by their magic bytes, not their declared type, and SHALL be rejected with 422 when they are not PNG, JPG, or WebP, exceed 5 MB, or number more than 3 — saving nothing. Accepted screenshots SHALL be re-encoded in the browser to strip metadata, uploaded to Linear, and SHALL NOT be displayed on the board.

#### Scenario: A non-image declared as an image

- **GIVEN** a file whose bytes are not an image but whose content-type claims `image/png`
- **WHEN** it is submitted
- **THEN** the service answers 422 and no item, vote, or image row is written

#### Scenario: The board reports the count only

- **GIVEN** an item submitted with 2 screenshots
- **WHEN** any member opens its detail page
- **THEN** the page says "2 screenshots sent to the PLAA team" and renders no image

### Requirement: Bugs are private to their author and admins

A bug SHALL be created with `is_public = false`. A member who is neither its author nor an admin SHALL receive 404 for it and SHALL NOT see it in any list, including the Roadmap.

#### Scenario: Another member requests the bug

- **GIVEN** member A submitted a bug
- **WHEN** member B requests it by id
- **THEN** the response is 404, indistinguishable from a bug that does not exist

#### Scenario: The author finds their own bug

- **GIVEN** member A submitted a bug
- **WHEN** member A opens My submissions
- **THEN** the bug is listed and marked private

### Requirement: Members vote once per item, on open items only

A vote SHALL be idempotent per (item, member). Voting SHALL be permitted while an item is Under Review, To Do, or In Progress, and SHALL answer 409 when the item is Completed, Declined, or Duplicate.

#### Scenario: Toggling a vote

- **GIVEN** an open item the member has not voted on
- **WHEN** they press the vote button
- **THEN** `aria-pressed` becomes true and the count rises by one
- **AND** pressing again returns both to their previous values

#### Scenario: Voting on a closed item

- **GIVEN** a Completed item
- **WHEN** the member views it
- **THEN** the vote button is disabled and states why

#### Scenario: A failed vote does not lie

- **GIVEN** the member presses vote and the request fails
- **THEN** the count and pressed state return to what they were

### Requirement: Admins move items and members see why

Only a member whose LabOS uid is in the configured allowlist SHALL change an item's status. Every move SHALL append a status event carrying the from-status, to-status, optional public note, author, and timestamp, which members SHALL see as the item's timeline. Declining SHALL require a public note; marking a duplicate SHALL require a canonical item.

#### Scenario: An empty allowlist

- **GIVEN** `PLAA_FEEDBACK_ADMIN_MEMBER_UIDS` is unset, empty, or only separators
- **WHEN** any member calls any admin endpoint
- **THEN** the response is 403 and nothing is written

#### Scenario: Declining without a note

- **GIVEN** an admin has chosen Declined in the Move to menu
- **WHEN** no note has been written
- **THEN** Confirm stays disabled

#### Scenario: Merging a duplicate

- **GIVEN** item A has voters and is marked a duplicate of item B
- **THEN** A is Duplicate, A's voters are on B with no double counting, and both carry a status event, in one transaction

#### Scenario: A member sees no admin controls

- **GIVEN** `/feedback/me` reports `is_admin: false`
- **THEN** no Move to menu, admin panel, or Triage tab renders

### Requirement: The Roadmap shows public work in four columns

The Roadmap SHALL show public features and improvements in Under Review, To Do, In Progress, and Completed, where Completed holds the last 90 days. Under 768px the columns SHALL render as tabs.

#### Scenario: Bugs never appear

- **GIVEN** public features and private bugs exist
- **WHEN** any member, admin included, opens the Roadmap
- **THEN** no bug is shown in any column

#### Scenario: A narrow viewport

- **GIVEN** a viewport under 768px
- **THEN** the four columns render as four tabs, with one column's cards visible at a time

### Requirement: Every submission creates exactly one Linear issue

On submit, the service SHALL create one Linear issue in team PLAA using the feedback item's own id, with labels Feedback plus the type label, the templated description, and the screenshots embedded. A failure SHALL NOT fail the member's submission; it SHALL be retried on a 1, 5, 15, 30-minute then hourly schedule. After 24 hours the item SHALL become `failed` and its buffered screenshots SHALL be deleted.

#### Scenario: Linear is unavailable at submit time

- **GIVEN** Linear times out
- **WHEN** a member submits
- **THEN** the member still gets a created item, and the push stays pending with a next attempt scheduled

#### Scenario: A lost success response

- **GIVEN** `issueCreate` succeeded but its response was lost
- **WHEN** the retry runs
- **THEN** no second issue is created and the item becomes `created`

#### Scenario: The member never sees Linear

- **GIVEN** an item whose Linear push failed
- **WHEN** a non-admin views it
- **THEN** no Linear identifier, state, or retry control is rendered

### Requirement: The board is reachable only behind its flag

With `NEXT_PUBLIC_PLAA_FEEDBACK_BOARD` unset or any value other than `true`, the nav Feedback link SHALL point to the Google Form and both board routes SHALL answer 404. With it set to `true`, the nav link SHALL point to `/alignment-asset/feedback` and no Google Form link SHALL remain in PLAA navigation.

#### Scenario: Flag off

- **GIVEN** the flag is unset
- **WHEN** a member opens `/alignment-asset/feedback`
- **THEN** the page is not found, and the nav Feedback entry opens the Google Form

#### Scenario: Flag on

- **GIVEN** the flag is `true`
- **THEN** the nav Feedback entry is an internal link to the board

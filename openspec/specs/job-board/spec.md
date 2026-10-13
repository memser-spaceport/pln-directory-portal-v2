# job-board Specification

> Seeded from code on 2026-10-09 (develop at f76315f10); correct me.
> This file describes the job board as the code behaves now. It is a hint for agents: when it and the code disagree, the code wins.

## Purpose

The job board at `/jobs` lists open roles across the Protocol Labs network, grouped by team. Members save roles, filter to their saved roles, and apply in-app where the hiring team accepts it.

## Requirements

### Requirement: Role permalink page

The system SHALL serve each open role at `/jobs/openings/<uid>` as a public page with the role, its team, and JobPosting structured data. The canonical URL of the page SHALL be the permalink itself.

#### Scenario: Open a known role

- **GIVEN** a role with uid `R` is open on the board
- **WHEN** a visitor opens `/jobs/openings/R`
- **THEN** the page shows the role and its team
- **AND** the page has a `application/ld+json` JobPosting script and a canonical URL of `/jobs/openings/R`

#### Scenario: Open an unknown or removed role

- **GIVEN** no open role has uid `X`
- **WHEN** a visitor opens `/jobs/openings/X`
- **THEN** the system answers with the Next.js not-found page

### Requirement: Legacy detail links on the board

The board SHALL accept `?job=<uid>` on `/jobs`. The link preview metadata SHALL describe that role, with the role permalink as canonical. If the uid does not resolve, the board SHALL use its own listing metadata.

#### Scenario: Shared board link with a job param

- **GIVEN** a role with uid `R` is open
- **WHEN** a crawler fetches `/jobs?job=R`
- **THEN** the page title is `<role title> | Protocol Labs Directory`
- **AND** the canonical URL is `/jobs/openings/R`

### Requirement: Save a role

A signed-in member SHALL be able to save and unsave a role from its row. The bookmark SHALL change at once and SHALL revert if the server refuses. A signed-out visitor who presses Save SHALL go to sign-in and nothing is saved.

#### Scenario: Signed-out visitor presses Save

- **GIVEN** the visitor is not signed in
- **WHEN** the visitor presses the Save bookmark on a role row
- **THEN** the sign-in flow starts
- **AND** no save request is sent

#### Scenario: Member saves a role

- **GIVEN** a signed-in member and a role that is not saved
- **WHEN** the member presses Save
- **THEN** the bookmark shows as filled at once
- **AND** the client sends `POST /v1/job-openings/<uid>/save`
- **AND** on success a toast says "Saved." with a "View saved roles" link that turns on the Saved filter (`?saved=true`)

#### Scenario: Save request fails

- **GIVEN** a signed-in member presses Save or Unsave
- **WHEN** the server refuses the request
- **THEN** the bookmark goes back to its earlier state
- **AND** an error toast says "Could not save this role. Please try again." (or "Could not remove this role. Please try again." for Unsave)

### Requirement: Saved filter

The board SHALL show a "Saved" filter, with a count, to signed-in members only. When on, the board SHALL list only saved roles (server-side, `saved=true`). For a signed-out visitor the system SHALL ignore `saved=true` and show the full board.

#### Scenario: Signed-out visitor opens a saved-filter link

- **GIVEN** the visitor is not signed in
- **WHEN** the visitor opens `/jobs?saved=true`
- **THEN** the board lists all roles, not an error
- **AND** the "Saved" filter is not shown

#### Scenario: Saved filter shows when each role was saved

- **GIVEN** a signed-in member with the Saved filter on
- **WHEN** the board lists a saved role that the member has not applied to
- **THEN** the row time label reads "Saved <relative time>" (for example "Saved 3d ago") instead of the posting age

### Requirement: Applied state on a role row

A row for a role the member has applied to SHALL say so. "Applied" SHALL take priority over "Saved" in the row time label.

#### Scenario: Member has applied to a role

- **GIVEN** a signed-in member has applied to role `R`
- **WHEN** the board lists role `R`
- **THEN** the row time label reads "Applied <relative time>" (for example "Applied 2d ago"), also when the role is saved

### Requirement: Where Apply goes

Apply SHALL leave the site for the team's own posting when the team does not take in-app applications. For a team that is not Protocol Labs, Apply SHALL also leave the site when the viewer is signed out or not yet approved. Protocol Labs roles SHALL take applications in-app for every viewer who can reach Apply.

#### Scenario: Signed-out visitor applies to a non-Protocol Labs role

- **GIVEN** the visitor is not signed in
- **AND** the role belongs to a team that is not Protocol Labs and that takes in-app applications
- **WHEN** the visitor presses Apply
- **THEN** the role's own apply link (the team's posting) opens, not the in-app apply flow

### Requirement: Suggestions response with or without contact and criteria fields

The Suggested tab SHALL load when the suggestions response carries `contactedAt` per person and a role-level `criteria` list, and SHALL also load when it carries neither. Any other field the page does not know SHALL still fail the read.

#### Scenario: Older response without the new fields

- **GIVEN** a lead of the team opens the Suggested tab of a live role
- **WHEN** the suggestions response has no `contactedAt` and no `criteria`
- **THEN** the tab lists the suggestions as before
- **AND** no "Edit criteria" action is shown

#### Scenario: Newer response with the new fields

- **GIVEN** a lead of the team opens the Suggested tab of a live role
- **WHEN** the response carries `contactedAt` for each person and a `criteria` list of `{ text, enabled }`
- **THEN** the tab lists the suggestions
- **AND** the "Why suggested" pane offers "Edit criteria"

### Requirement: Role description on the Suggested tab

The Suggested tab SHALL show a short plain-text description of the selected role, from the role the page already loaded, cut to at most two lines. A role without a description SHALL show no description line.

#### Scenario: Role with a description

- **GIVEN** the selected role has a posting description
- **WHEN** the lead opens the Suggested tab
- **THEN** the tab shows the description as plain text, at most two lines, with no markup

#### Scenario: Role without a description

- **GIVEN** the selected role has no posting description
- **WHEN** the lead opens the Suggested tab
- **THEN** no description line is shown and the rest of the tab is unchanged

### Requirement: Requirement count on a suggestion

The "Why suggested" pane SHALL show "N of M requirements", where M is the number of requirements listed for that person and N is how many of them the person meets.

#### Scenario: Count from the person's requirements

- **GIVEN** a suggestion lists 5 requirements and the person meets 3 of them
- **WHEN** the lead opens that suggestion
- **THEN** the pane reads "3 of 5 requirements"

### Requirement: Edit a role's match criteria

From the "Why suggested" pane, a lead SHALL be able to open "Edit criteria", switch each of the role's requirements on or off, and save. The modal SHALL say the change applies from next week's suggestions. The modal SHALL offer no free-text field.

#### Scenario: Lead saves switched-off requirements

- **GIVEN** a lead opens "Edit criteria" for a role with requirements A, B and C, all on
- **WHEN** the lead switches B off and saves
- **THEN** the client sends `PUT /v1/job-openings/<roleUid>/match-criteria` with `{ "disabled": ["B"] }`
- **AND** the modal closes
- **AND** the current suggestions and their requirement counts do not change

#### Scenario: Saved switches survive a reload

- **GIVEN** a lead saved B as off
- **WHEN** the lead reloads the page and opens "Edit criteria" again
- **THEN** B shows as off and A and C show as on

#### Scenario: Cancel discards the draft

- **GIVEN** a lead switches requirements in the open modal
- **WHEN** the lead cancels or closes the modal
- **THEN** nothing is sent and the next open shows the saved switches

#### Scenario: Modal states when the change applies

- **WHEN** a lead opens "Edit criteria"
- **THEN** the modal says the change applies from next week's suggestions

#### Scenario: Analytics event on save

- **GIVEN** a lead saves the criteria
- **WHEN** the server accepts the save
- **THEN** the page sends the PostHog event `job-suggested-criteria-edited` with the team, the role, and how many requirements are on and off

### Requirement: Last enabled requirement stays on

The "Edit criteria" modal SHALL NOT let the lead switch off the last requirement that is on.

#### Scenario: One requirement left on

- **GIVEN** only requirement A is on in the modal
- **WHEN** the lead tries to switch A off
- **THEN** A stays on and its switch cannot be turned off

### Requirement: Criteria save fails

If the server refuses a criteria save, the page SHALL show an error toast, keep the saved switches as they were, and keep the modal open with the lead's draft.

#### Scenario: Server refuses the save

- **GIVEN** a lead switched B off in the modal
- **WHEN** the save request fails
- **THEN** an error toast shows
- **AND** the modal stays open with B still switched off in the draft
- **AND** the saved criteria are unchanged

### Requirement: Contact a suggested member

On the Suggested tab, the pane SHALL offer "Contact" instead of the `mailto:` "Email" button. "Contact" SHALL open a modal with one message field, prefilled with a template, at most 2000 characters, and no subject. Send SHALL post the message through the platform. The Applied and Interested tabs SHALL keep "Email".

#### Scenario: Lead sends a message

- **GIVEN** a lead opens a suggested member who has not been contacted for this role
- **WHEN** the lead presses "Contact", edits the prefilled message and presses Send
- **THEN** the client sends `POST /v1/job-openings/<roleUid>/suggested-candidates/<memberUid>/contact` with `{ "message": <text> }`
- **AND** the modal closes
- **AND** the button reads "Contacted · <date>" with the date from the server's `contactedAt`

#### Scenario: Message length

- **GIVEN** the Contact modal is open
- **WHEN** the message is empty or longer than 2000 characters
- **THEN** Send is disabled

#### Scenario: Other tabs keep Email

- **GIVEN** a lead opens a person on the Applied or Interested tab
- **WHEN** the person's profile has an email address
- **THEN** the pane shows the "Email" button, not "Contact"

#### Scenario: Analytics event on send

- **GIVEN** a lead presses Send in the Contact modal
- **WHEN** the server accepts the message
- **THEN** the page sends the PostHog event `job-suggested-candidate-contacted`
- **AND** no event is sent when the lead only opens or closes the modal

### Requirement: Contacted state

A suggestion with a `contactedAt` SHALL show "Contacted · <date>" in place of "Contact", and this SHALL hold after a reload.

#### Scenario: Reload after contact

- **GIVEN** a lead contacted a suggested member for a role
- **WHEN** the lead reloads the page and opens that person again
- **THEN** the pane reads "Contacted · <date>" and offers no way to send a second message

#### Scenario: Already contacted by someone else

- **GIVEN** another lead already contacted this person for this role
- **WHEN** the lead sends a message and the server answers 409
- **THEN** no error toast shows
- **AND** the modal closes and the pane shows the person as contacted

### Requirement: Contact send fails

If the server refuses a message for any reason other than 409, the page SHALL show an error toast, leave the person not contacted, and keep the modal open with the message text.

#### Scenario: Server refuses the message

- **GIVEN** a lead wrote a message in the Contact modal
- **WHEN** the send request fails
- **THEN** an error toast shows
- **AND** the modal stays open with the message text unchanged
- **AND** the button still reads "Contact"

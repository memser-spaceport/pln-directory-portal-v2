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

The Suggested tab SHALL load when the suggestions response carries `contactedAt` per person, a role-level `criteria` list and a role-level `criteriaPrompt` (string or null), and SHALL also load when it carries none of them. Any other field the page does not know SHALL still fail the read.

#### Scenario: Older response without the new fields

- **GIVEN** a lead of the team opens the Suggested tab of a live role
- **WHEN** the suggestions response has no `contactedAt` and no `criteria`
- **THEN** the tab lists the suggestions as before
- **AND** no "Edit AI criteria" action is shown

#### Scenario: Newer response with the new fields

- **GIVEN** a lead of the team opens the Suggested tab of a live role
- **WHEN** the response carries `contactedAt` for each person and a `criteria` list of `{ text, enabled }`
- **THEN** the tab lists the suggestions
- **AND** the tab offers "Edit AI criteria" under its note

#### Scenario: Criteria with labels and groups

- **WHEN** the role's `criteria` items and each person's `criteria` items carry an optional `label` and `group`
- **THEN** the tab loads, with or without them
- **AND** a `group` other than Skills, Experience, Seniority, Location or Other is read as Other, and the tab still loads
- **AND** any other unknown field on a criterion still fails the read

### Requirement: Grouped requirements with short labels

The "Edit criteria" modal and the "Why suggested" pane SHALL list the role's requirements under the headers Skills, Experience, Seniority, Location and Other, in that order, and SHALL hide a header with no requirements. Each requirement SHALL show its `label` with its full statement (`text`) under it in smaller grey text; a requirement without a label SHALL show its statement alone. When no requirement has a group, both SHALL list the requirements without headers. When only some have a group, the others SHALL be listed under Other. The statement SHALL stay the key a save names.

#### Scenario: Grouped requirements

- **GIVEN** a role's requirements carry the groups Skills, Location and Skills
- **WHEN** a lead opens "Edit criteria" or the "Why suggested" pane
- **THEN** the requirements show under "Skills" and then "Location", and no other header shows

#### Scenario: Label over statement

- **GIVEN** a requirement with label "Rust" and statement "Hands-on proficiency in Rust"
- **WHEN** a lead reads it in the modal or the pane
- **THEN** it reads "Rust" with "Hands-on proficiency in Rust" under it
- **AND** switching it off and saving sends "Hands-on proficiency in Rust" in `disabled`

#### Scenario: Older backend without labels or groups

- **GIVEN** the role's requirements carry no `label` and no `group`
- **WHEN** a lead opens the modal or the pane
- **THEN** the requirements show as one list without headers, each as its statement

### Requirement: List head on every tab

Above the tabs, the candidates list SHALL show the selected role's title as a heading and, under it, the first non-empty paragraph of the role's posting as plain text, cut to at most three lines. This SHALL show on the Applied, Interested and Suggested tabs. A role without a description SHALL show the title and no paragraph.

#### Scenario: Role with a description

- **GIVEN** the selected role's posting is `<p>Build <strong>consensus</strong>.</p><p>More.</p>`
- **WHEN** a lead opens any tab of the candidates page
- **THEN** the list head shows the role title as a heading
- **AND** under it "Build consensus." as plain text, at most three lines, with no markup

#### Scenario: Role without a description

- **GIVEN** the selected role has no posting description
- **WHEN** a lead opens the candidates page
- **THEN** the list head shows the role title and no paragraph

### Requirement: Match band badge

A suggestion's band SHALL show as a pill: "Strong match" with a green-to-blue-to-indigo gradient, "Good match" with a teal-green gradient, white text. It SHALL look the same as the badge in the suggested-candidates email.

#### Scenario: Two bands in the list

- **GIVEN** the Suggested tab lists a Strong match and a Good match
- **WHEN** the lead reads the list
- **THEN** each row shows its band as a gradient pill in its own tone

### Requirement: Suggested row

A row on the Suggested tab SHALL show three lines: the name, the person's role, and "N of M requirements". The count SHALL always read "N of M", also when the person meets all of them ("5 of 5"). When a lead of the team has contacted the person for this role, the count line SHALL end with "· Contacted <relative time>". The row SHALL show no Interested mark and no note; the pane shows both. Rows on the Applied and Interested tabs SHALL not change.

#### Scenario: Person who meets every requirement

- **GIVEN** a suggestion meets 5 of the role's 5 requirements
- **WHEN** the lead reads the Suggested tab
- **THEN** the row reads "5 of 5 requirements", not "All 5 requirements"

#### Scenario: Contacted person

- **GIVEN** a lead contacted a suggested member two days ago
- **WHEN** the lead reads the Suggested tab
- **THEN** the row reads "N of M requirements · Contacted 2d ago"

#### Scenario: Interested person

- **GIVEN** a suggested member said they are interested and wrote a note
- **WHEN** the lead reads the Suggested tab
- **THEN** the row shows no Interested mark and no note
- **AND** opening the row shows the Interested mark and the whole note in the pane

### Requirement: Why suggested title and network block

The "Why suggested" pane's title SHALL read "Why we suggested <first name>", using the first word of the member's name, or "Why we suggested them" when the name is blank. When the member said they are interested in the role or its team, the pane's body SHALL open with an "In the network" block reading "Pressed I'm interested on your team or this role", with the member's whole note under it when they wrote one. The block SHALL be absent when the member gave no such reason, and it SHALL not count towards "N of M requirements".

#### Scenario: Interested member with a note

- **GIVEN** Ana Lopez said she is interested and wrote "Keen to work on consensus."
- **WHEN** the lead opens her on the Suggested tab
- **THEN** the pane is titled "Why we suggested Ana"
- **AND** its body opens with "In the network": "Pressed I'm interested on your team or this role" and her note under it

#### Scenario: Member who is not interested

- **GIVEN** a suggested member did not say they are interested
- **WHEN** the lead opens them
- **THEN** no "In the network" block shows

### Requirement: Requirement count on a suggestion

The "Why suggested" pane SHALL show "N of M requirements", where M is the number of requirements listed for that person and N is how many of them the person meets.

#### Scenario: Count from the person's requirements

- **GIVEN** a suggestion lists 5 requirements and the person meets 3 of them
- **WHEN** the lead opens that suggestion
- **THEN** the pane reads "3 of 5 requirements"

### Requirement: Edit a role's match criteria

From the Suggested tab, a lead SHALL be able to open "Edit criteria", switch each of the role's requirements on or off, write who they are looking for in one free-text box (at most 500 characters, with a counter), and save both. The box SHALL open on the saved prompt (`criteriaPrompt`). The modal's title SHALL read "Edit AI criteria" and its subtitle "What the AI matches members against for <role title>." Its footer SHALL read "Changes apply from next week's suggestions." with Cancel and Save.

#### Scenario: Lead saves switched-off requirements

- **GIVEN** a lead opens "Edit criteria" for a role with requirements A, B and C, all on
- **WHEN** the lead switches B off and saves
- **THEN** the client sends `PUT /v1/job-openings/<roleUid>/match-criteria` with `{ "disabled": ["B"], "prompt": null }`
- **AND** the modal closes
- **AND** the current suggestions and their requirement counts do not change

#### Scenario: Lead saves a prompt

- **GIVEN** a lead opens "Edit criteria" and the role has no saved prompt
- **WHEN** the lead types "Ran a storage network" in the box and saves
- **THEN** the request body carries `"prompt": "Ran a storage network"` (trimmed) with the switches
- **AND** the next open of the modal shows the saved prompt

#### Scenario: Lead clears the prompt

- **GIVEN** a role has a saved prompt
- **WHEN** the lead empties the box and saves
- **THEN** the request body carries `"prompt": null`
- **AND** the prompt is cleared

#### Scenario: Prompt too long

- **WHEN** the box holds more than 500 characters
- **THEN** Save is disabled

#### Scenario: Saved switches survive a reload

- **GIVEN** a lead saved B as off
- **WHEN** the lead reloads the page and opens "Edit criteria" again
- **THEN** B shows as off and A and C show as on

#### Scenario: Cancel discards the draft

- **GIVEN** a lead switches requirements in the open modal
- **WHEN** the lead cancels or closes the modal
- **THEN** nothing is sent and the next open shows the saved switches

#### Scenario: Modal states when the change applies

- **WHEN** a lead opens "Edit criteria" for "Senior Rust Engineer"
- **THEN** the title reads "Edit AI criteria"
- **AND** the subtitle reads "What the AI matches members against for Senior Rust Engineer."
- **AND** the footer reads "Changes apply from next week's suggestions." beside Cancel and Save

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

On the Suggested tab, the pane SHALL offer "Contact" instead of the `mailto:` "Email" button. "Contact" SHALL open a modal with one message field, prefilled with a template, at most 2000 characters, and no subject. The template SHALL greet the member by first name, introduce the lead by first name with their role on the team (or just the team when the role is unknown), name the role, ask for a short call, and sign off with the lead's first name. The subtitle SHALL link the role to its public posting (`/jobs/openings/<uid>`) in a new tab. The field SHALL carry the helper "Say what caught your eye in <first name>'s profile". The send button SHALL read "Send email" and SHALL post the message through the platform. The Applied and Interested tabs SHALL keep "Email".

#### Scenario: Lead sends a message

- **GIVEN** a lead opens a suggested member who has not been contacted for this role
- **WHEN** the lead presses "Contact", edits the prefilled message and presses "Send email"
- **THEN** the client sends `POST /v1/job-openings/<roleUid>/suggested-candidates/<memberUid>/contact` with `{ "message": <text> }`
- **AND** the modal closes
- **AND** the button reads "Contacted · <date>" with the date from the server's `contactedAt`

#### Scenario: Message length

- **GIVEN** the Contact modal is open
- **WHEN** the message is empty or longer than 2000 characters
- **THEN** "Send email" is disabled

#### Scenario: Prefilled template

- **GIVEN** the lead is Maya Chen, Head of Engineering at Filecoin Foundation
- **WHEN** she opens Contact for Ana Lopez on the Senior Rust Engineer role
- **THEN** the message starts "Hi Ana," and introduces "I'm Maya, Head of Engineering at Filecoin Foundation. I'm hiring for our Senior Rust Engineer role."
- **AND** it ends "Thanks," and "Maya"
- **AND** "Senior Rust Engineer" in the subtitle links to `/jobs/openings/<roleUid>`

#### Scenario: Other tabs keep Email

- **GIVEN** a lead opens a person on the Applied or Interested tab
- **WHEN** the person's profile has an email address
- **THEN** the pane shows the "Email" button, not "Contact"

#### Scenario: Analytics event on send

- **GIVEN** a lead presses "Send email" in the Contact modal
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

### Requirement: Candidates page URL params

The candidates page (`/teams/<id>/applicants`) SHALL open the Suggested tab when the URL has `tab=suggested`. When the URL has `edit=criteria`, the page SHALL open the Suggested tab and, once the role's criteria have loaded, open "Edit criteria" once if the role has criteria to edit. The page SHALL then remove `edit` from the URL without a navigation. `suggested=<memberUid>` SHALL keep opening that person.

#### Scenario: Link from the founder email

- **GIVEN** a role with applicants and suggestions
- **WHEN** a lead opens `/teams/T/applicants?role=R&tab=suggested`
- **THEN** the page opens on the Suggested tab

#### Scenario: Edit criteria link

- **GIVEN** the role has criteria to edit
- **WHEN** a lead opens `/teams/T/applicants?role=R&tab=suggested&edit=criteria`
- **THEN** the "Edit criteria" modal opens once the criteria load
- **AND** the URL no longer has `edit`, and a reload does not open the modal again

#### Scenario: Edit criteria link for a role with nothing to edit

- **GIVEN** the role has no criteria
- **WHEN** a lead opens the page with `edit=criteria`
- **THEN** no modal opens and `edit` is removed from the URL

### Requirement: Suggested link on the role row

On the team profile, a role's count line SHALL show "N suggested" as its own link when the role has suggestions. It SHALL open `/teams/<id>/applicants?role=<uid>&tab=suggested`. The applicants and interested count SHALL keep its own link, without `tab`.

#### Scenario: Role with applicants and suggestions

- **GIVEN** a role has 2 applicants and 3 suggestions
- **WHEN** a lead reads the role row
- **THEN** "2 applicants" links to `/teams/T/applicants?role=R`
- **AND** "3 suggested" links to `/teams/T/applicants?role=R&tab=suggested`

### Requirement: Narrow-screen back label

On a narrow screen, with a person open, the control that returns to the list SHALL read "All candidates".

#### Scenario: Back to the list

- **GIVEN** a narrow screen and a person open in the pane
- **WHEN** the lead presses "All candidates"
- **THEN** the list shows again

### Requirement: Suggested tab view analytics source

The `job-suggested-candidates-viewed` event SHALL carry `source` and `utm_content`. `source` SHALL be `email` when the page was opened with `utm_source` `job_suggested_candidates_email` or `job_suggested_candidate_intro_email`, and `app` otherwise. Only the first Suggested tab view after arrival SHALL count as from email; a later role's view is `app` with `utm_content` null.

#### Scenario: Arrival from the founder email

- **WHEN** a lead opens the page with `utm_source=job_suggested_candidates_email&utm_content=all_matches` and the Suggested tab shows
- **THEN** the event carries `source: "email"` and `utm_content: "all_matches"`

#### Scenario: Arrival from the app

- **WHEN** a lead opens the Suggested tab with no such `utm_source`
- **THEN** the event carries `source: "app"`

### Requirement: Criteria prompt box says the AI reads it

In the "Edit criteria" modal, the free-text box label SHALL read "Help us suggest better members for <role title>." ("this role" when the role has no title). Under the label, a helper text SHALL read "Tell the AI who you're looking for". Assistive technology SHALL announce the helper text and the character counter with the box.

#### Scenario: Label names the role

- **GIVEN** a lead opens "Edit criteria" for "Storage Engineer"
- **WHEN** the lead looks at the free-text box
- **THEN** its label reads "Help us suggest better members for Storage Engineer."
- **AND** the helper text "Tell the AI who you're looking for" shows under the label

#### Scenario: Role without a title

- **GIVEN** a role has an empty title
- **WHEN** a lead opens "Edit criteria" for it
- **THEN** the box label reads "Help us suggest better members for this role."

#### Scenario: Screen reader hears the helper text and the counter

- **WHEN** a screen reader user moves to the free-text box
- **THEN** the box is described by the helper text and by the counter "<n> / 500"

### Requirement: Edit AI criteria button on the Suggested tab

On the Suggested tab of the candidates page, under the tab note, the page SHALL show a small bordered grey button with the AI mark and the label "Edit AI criteria" when the role has criteria to edit. The button SHALL open the Edit criteria modal. The note SHALL NOT end in an "Edit criteria" link. The Suggested tab SHALL show no search field; the Applied and Interested tabs SHALL keep it, and a term typed there SHALL NOT filter the Suggested list.

#### Scenario: Lead opens Edit AI criteria

- **GIVEN** a lead opens the Suggested tab of a role with criteria
- **WHEN** the lead presses "Edit AI criteria" under the note
- **THEN** the Edit criteria modal opens
- **AND** the note has no "Edit criteria" link

#### Scenario: Role without criteria

- **GIVEN** a role has no criteria, or the response carries none
- **WHEN** a lead opens the Suggested tab
- **THEN** no "Edit AI criteria" button shows

#### Scenario: No search on Suggested

- **GIVEN** a lead types "ana" in the search on the Applied tab
- **WHEN** the lead opens the Suggested tab
- **THEN** no search field shows
- **AND** every suggested person is listed

#### Scenario: Search stays on Applied and Interested

- **WHEN** a lead opens the Applied or the Interested tab
- **THEN** the "Search by name or role" field shows

### Requirement: Candidates page sign-in

The team Candidates page SHALL show candidates only to a signed-in lead of the team or a Directory admin. With the Candidates feature on, a signed-out visitor SHALL go to sign-in, with a return link to the same page that keeps only the link's page fields (`role`, `candidate`, `suggested`, `tab`, `edit`) and its tracking fields (`utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `job_uid`). With the feature off, a signed-out visitor SHALL go to the team profile. A signed-in person whose sign-in data shows they are not a lead or an admin SHALL go to the team profile.

#### Scenario: Signed-out lead opens a Candidates link

- **GIVEN** the Candidates feature is on and the visitor is not signed in
- **WHEN** the visitor opens `/teams/<id>/applicants?role=<roleUid>&suggested=<memberUid>`
- **THEN** the visitor goes to sign-in, not to the team profile
- **AND** no candidate is shown

#### Scenario: Lead comes back after sign-in

- **GIVEN** a lead of the team signed in from a Candidates link with `role` and `suggested`
- **WHEN** sign-in completes
- **THEN** the Candidates page opens with that role on the Suggested tab and that person open

#### Scenario: Return link keeps only the Candidates and tracking fields

- **GIVEN** the Candidates feature is on and the visitor is not signed in
- **WHEN** the visitor opens a Candidates link with page fields, tracking fields and other query fields (such as a second `backlink`)
- **THEN** the sign-in return link holds the page and tracking fields only

#### Scenario: Every founder email link survives sign-in

- **GIVEN** the Candidates feature is on and the lead is not signed in
- **WHEN** the lead opens "View profile" (`role`, `tab=suggested`, `suggested`), "All top matches for this role" (`role`, `tab=suggested`) or "Edit criteria" (`role`, `tab=suggested`, `edit=criteria`), each with its `utm_*` fields and `job_uid`
- **THEN** the sign-in return link holds every one of those fields
- **AND** after sign-in the page opens that person, the Suggested tab, or the Edit criteria modal, and counts the view as from email

#### Scenario: Signed-out visitor while the feature is off

- **GIVEN** the Candidates feature is off and the visitor is not signed in
- **WHEN** the visitor opens a Candidates link
- **THEN** the visitor goes to the team profile, not to sign-in

#### Scenario: Signed-in person who is not on the team

- **GIVEN** a signed-in person who is not a lead of the team and is not a Directory admin
- **AND** the sign-in data states the person's permissions
- **WHEN** the person opens a Candidates link
- **THEN** the person goes to the team profile

#### Scenario: Signed-in person whose sign-in data has no permissions

- **GIVEN** a signed-in person who is not a lead of the team
- **AND** the sign-in data does not state the person's permissions
- **WHEN** the person opens a Candidates link
- **THEN** the page shows no candidates, because the server refuses them

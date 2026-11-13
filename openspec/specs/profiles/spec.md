# profiles Specification

## Purpose

What member, team and project profile pages give a search engine crawler and a signed-out visitor: the public profile in the first HTML response, and a real "not found" for a profile that does not exist.

## Requirements

### Requirement: Profile content is in the server HTML

The first HTML response for a member, team or project profile SHALL contain the profile's public content, readable without running JavaScript. A loading state alone does not satisfy this.

#### Scenario: Member profile, fetched without JavaScript

- **GIVEN** an approved member with a name, a role, at least one team and a bio
- **WHEN** a client without cookies requests `/members/<uid>` and reads the HTML without running scripts
- **THEN** the HTML contains the member's name, role, each team's name and the bio text

#### Scenario: Project profile, fetched without JavaScript

- **GIVEN** an existing project with a name and a description
- **WHEN** a client without cookies requests `/projects/<uid>` and reads the HTML without running scripts
- **THEN** the HTML contains the project's name and description text

#### Scenario: Team profile keeps its content

- **GIVEN** an existing team with a name and an about text
- **WHEN** a client without cookies requests `/teams/<uid>` and reads the HTML without running scripts
- **THEN** the HTML contains the team's name and about text, as it does today

### Requirement: Server HTML carries only public data

The server HTML of a member profile SHALL contain only what a signed-out visitor may see. Private fields and edit controls SHALL appear only after the page has loaded in the browser and confirmed the viewer may see them.

#### Scenario: Signed-in owner opens their profile

- **GIVEN** a signed-in member opens their own profile
- **WHEN** the page first renders, before the private profile has loaded
- **THEN** it shows the public profile without edit controls
- **AND WHEN** the private profile has loaded
- **THEN** the page shows their private fields and the edit controls, as today

#### Scenario: Server HTML has no private contact fields

- **GIVEN** a member whose email and contact handles are hidden from signed-out visitors
- **WHEN** a client without cookies requests `/members/<uid>`
- **THEN** the HTML contains neither the email address nor the hidden handles

### Requirement: An unknown profile answers "not found"

A member, team or project profile SHALL answer HTTP 404 with the not-found page when the directory API reports the id as not found.

#### Scenario: Unknown member id

- **GIVEN** no member has the uid `doesnotexist000000000000`
- **WHEN** a client without cookies requests `/members/doesnotexist000000000000`
- **THEN** the response status is 404 and the page is the site's not-found page

#### Scenario: Unknown team id

- **GIVEN** no team has the uid `doesnotexist000000000000`
- **WHEN** a client requests `/teams/doesnotexist000000000000`
- **THEN** the response status is 404 and the page is the site's not-found page

#### Scenario: Unknown project id

- **GIVEN** no project has the uid `doesnotexist000000000000`
- **WHEN** a client requests `/projects/doesnotexist000000000000`
- **THEN** the response status is 404 and the page is the site's not-found page

#### Scenario: Member hidden from signed-out visitors

- **GIVEN** a member who is not visible in the directory (for example, not yet approved)
- **WHEN** a client without cookies requests their profile
- **THEN** the response status is 404

#### Scenario: Team hidden from signed-out visitors

- **GIVEN** a team at access level `L0`, which the directory API refuses to a signed-out visitor with `403 "Team is inactive"`
- **WHEN** a client without cookies requests `/teams/<uid>`
- **THEN** the response status is 404 and the page is the site's not-found page

#### Scenario: Signed-in lead or admin opens a team hidden from the public

- **GIVEN** a signed-in lead of an `L0` team, or a directory admin
- **WHEN** they open the team's profile
- **THEN** the page shows the team, as the API allows them

#### Scenario: Any other signed-in viewer opens a team hidden from the public

- **GIVEN** a signed-in viewer who is neither a lead of the `L0` team nor an admin
- **WHEN** they open the team's profile
- **THEN** the page shows the site's not-found page, not the error page

### Requirement: A failed lookup is not "not found"

A profile page SHALL NOT answer 404 when the directory API fails for any reason other than "not found" or a team hidden from a signed-out visitor (a 5xx, a 429, another 403, a timeout or a network error). It SHALL show the existing error page, so a crawler retries later. A signed-in viewer SHALL get today's behaviour, because only the browser knows what they may see.

#### Scenario: API outage

- **GIVEN** the directory API answers 503 for a member, team or project id
- **WHEN** a client requests that profile
- **THEN** the response is not a 404
- **AND** the page either loads the profile in the browser or shows the error message, as today

#### Scenario: Signed-in viewer opens a profile hidden from the public

- **GIVEN** a signed-in member who is still pending approval
- **WHEN** they open their own profile
- **THEN** the page does not answer 404 and shows their profile once it loads, as today

### Requirement: A profile that failed to load is not indexed

A member, team or project profile whose directory API lookup failed SHALL be marked `noindex, follow`, so an error answered with status 200 is never indexed as the profile. A loaded profile SHALL NOT be marked `noindex`.

#### Scenario: API outage

- **GIVEN** the directory API answers 503 or 429 for a member, team or project id
- **WHEN** a crawler requests that profile
- **THEN** the page is marked `noindex, follow`

#### Scenario: Loaded profile

- **GIVEN** the directory API returns the profile
- **WHEN** a crawler requests it
- **THEN** the page is not marked `noindex`

### Requirement: A profile describes itself in its own words

The meta description of a team or project profile SHALL be the profile's own text as plain text, not a template shared by every profile. A team uses its short description, then its long one; a project uses its tagline, then its description. Only a profile with none of these SHALL use "<name> on Protocol Labs Directory".

#### Scenario: Team with a short description

- **GIVEN** a team whose short description is "Builds open **labs**."
- **WHEN** a client requests its profile
- **THEN** the meta description and the share-card descriptions are "Builds open labs."

#### Scenario: Project with no text of its own

- **GIVEN** a project with no tagline and no description
- **WHEN** a client requests its profile
- **THEN** the meta description is "<name> on Protocol Labs Directory"

### Requirement: Old team links redirect to the team

A team profile requested by its old Airtable record id (`/teams/rec…`) SHALL redirect permanently (308) to the team's profile at its uid. An id that belongs to no team SHALL answer 404. If the lookup itself fails, the page SHALL show its error, not a 404.

#### Scenario: Known Airtable id

- **GIVEN** a team whose Airtable record id is `recA` and whose uid is `T`
- **WHEN** a client requests `/teams/recA`
- **THEN** the response is a 308 redirect to `/teams/T`

#### Scenario: Unknown Airtable id

- **GIVEN** no team has the Airtable record id `recZ`
- **WHEN** a client requests `/teams/recZ`
- **THEN** the response status is 404 and the page is the site's not-found page

#### Scenario: Airtable lookup fails

- **GIVEN** the API fails while looking up the Airtable record id `recA`
- **WHEN** a client requests `/teams/recA`
- **THEN** the response is not a 404 and the page shows the error message

### Requirement: One Events section on the member profile

With the event drawer flag on, a member profile SHALL show one Events section in place of the IRL contributions block. It holds two groups: what the member is going to, and Past events. With the flag off, the profile SHALL show the IRL contributions block as today.

#### Scenario: Flag off

- **GIVEN** the build has `NEXT_PUBLIC_SHOW_EVENT_DRAWER` unset and a member with past events
- **WHEN** anyone opens the member's profile
- **THEN** the profile shows the IRL contributions block as today

### Requirement: The Events section's title and group labels

The section SHALL always be titled "Events" (LAB-3230). Each group present SHALL have its label: "<First name> is going to" (or "You're going to" for the owner) and "Past events" (LAB-3234). With neither group, the section SHALL be absent.

#### Scenario: Only past events

- **GIVEN** a member with three past events and nothing upcoming
- **WHEN** another signed-in member opens the profile
- **THEN** the section is titled "Events", with the label "Past events" above the past cards

#### Scenario: Both groups

- **GIVEN** Ana is going to two events and has three past events
- **WHEN** another signed-in member opens Ana's profile
- **THEN** the section is titled "Events", with "Ana is going to" above the upcoming cards and "Past events" above the past cards

### Requirement: Upcoming event cards

Each upcoming event SHALL be a grey card in one column, every card the section's full width (LAB-3234). A card shows:
- a date tile (month, day);
- the title;
- the city, or the date range and city for a multi-day event;
- the member's role (Host, Speaker, Sponsor) when it isn't plain attendance;
- up to three faces and "N going";
- "You're going too" when the viewer is also going.

Pressing the card's title SHALL open the event drawer on that event. Upcoming events SHALL be soonest first.

#### Scenario: Viewer going to the same event

- **GIVEN** Ana and the viewer are both going to event A
- **WHEN** the viewer opens Ana's profile
- **THEN** event A's card shows "You're going too"

#### Scenario: Card opens the drawer

- **WHEN** a signed-in member presses an upcoming card's title
- **THEN** the event drawer opens on that event

### Requirement: Past event cards

Each past event SHALL be the same grey card, in the same single column. The date tile shows the month and year, followed by the event name, the city and any role that isn't plain attendance. The city SHALL be the event location's text up to its first comma, and absent when there is none. Past cards SHALL be newest first and SHALL NOT be links.

#### Scenario: Past event with a role

- **GIVEN** a member who spoke at "Founders Forum" in "Lisbon, Portugal" in March 2026
- **WHEN** anyone opens their profile
- **THEN** a past card shows "MAR", "2026", "Founders Forum", "Lisbon" and a "Speaker" tag

### Requirement: Long lists show four cards per group

Each group SHALL show at most 4 cards, then "Show all N upcoming events" or "Show all N past events". Pressing it SHALL show the rest of that group in place.

#### Scenario: Seven past events

- **GIVEN** a member with seven past events
- **WHEN** anyone opens their profile
- **THEN** four past cards show, then "Show all 7 past events"
- **AND** pressing it shows all seven

### Requirement: Who sees a member's upcoming events

Upcoming events SHALL be shown to signed-in members only. Signed-out visitors SHALL see past events only. There is no choice to hide an event (LAB-3234); an event hidden before that SHALL still be shown only to the member themself. The server HTML SHALL contain no upcoming events.

#### Scenario: Signed-out visitor

- **GIVEN** a member going to two events with three past events
- **WHEN** a signed-out visitor opens the profile
- **THEN** the section is titled "Events" and shows the three past events only

#### Scenario: Event hidden before LAB-3234

- **GIVEN** Ana is going to event A, which she hid before hiding was removed
- **WHEN** another signed-in member opens Ana's profile
- **THEN** event A is not shown

### Requirement: Where the Events section sits

The Events section SHALL sit under Office Hours when the viewer sees at least one upcoming event, and always for the owner. Otherwise it SHALL sit where the IRL contributions block sits today, after Contributions and before Repositories.

#### Scenario: Member with upcoming plans

- **GIVEN** a member going to one event
- **WHEN** another signed-in member opens the profile
- **THEN** the Events section is directly under Office Hours

#### Scenario: Member with past events only

- **GIVEN** a member with past events and nothing upcoming
- **WHEN** another signed-in member opens the profile
- **THEN** the Events section sits after Contributions and before Repositories

### Requirement: The owner adds an event from their profile

On their own profile, a member with permission to mark attendance SHALL have "Add event", in the section header when they have upcoming events and in the empty state otherwise. It SHALL open "Add an event you're going to": a list of upcoming events, searchable by event or city, that leaves out the events the owner already goes to and says so when none are left. Choosing one SHALL open the event drawer on it.

#### Scenario: Owner adds an event

- **GIVEN** the owner is going to no events
- **WHEN** they press "Add event", choose event A and press "Yes, I'm going"
- **THEN** event A appears under their upcoming events

#### Scenario: The list leaves out events the owner already has

- **GIVEN** the owner is going to event A
- **WHEN** they open "Add an event you're going to"
- **THEN** A is not listed

#### Scenario: Owner with nothing upcoming

- **GIVEN** the owner has no upcoming events
- **WHEN** they open their profile
- **THEN** the upcoming group reads "No upcoming events on your profile yet." with an "Add event" button

### Requirement: The owner manages an upcoming event

Each of the owner's upcoming cards SHALL have a ⋯ menu with "Edit details" and "Remove". There SHALL be no hide or show and no "Only visible to you" (LAB-3234).
- "Edit details" SHALL open the drawer on that event at "Add your plans".
- "Remove" SHALL ask "Remove <event>?" ("You'll come off the list of people going, and it leaves your profile."). On confirm, it SHALL remove the owner's attendance for that one event and show "Removed <event>."

#### Scenario: Owner removes an event

- **GIVEN** the owner is going to events A and B
- **WHEN** they choose "Remove" on A and confirm
- **THEN** A leaves their profile and its attendee list, and B stays

### Requirement: Owner controls follow the attendance permission

On their own profile, "Add event" and the ⋯ menu SHALL need the permission to mark attendance. A failed change from the ⋯ menu SHALL say so in an error toast and leave the card as it was.

#### Scenario: Owner without the permission

- **GIVEN** the owner cannot mark attendance and is going to event A
- **WHEN** they open their profile
- **THEN** event A's card has no ⋯ menu
- **AND** the section has no "Add event"

#### Scenario: A failed remove

- **GIVEN** the owner is going to event A
- **WHEN** they remove A and the request fails
- **THEN** an error toast says so and A stays on their profile

### Requirement: Owner profile analytics

The owner's actions SHALL record these PostHog events:
- `profile-event-add-clicked`;
- `profile-event-removed`, with `event_uid`.

#### Scenario: Owner removes an event

- **WHEN** the owner removes event A
- **THEN** `profile-event-removed` is recorded with A's uid

### Requirement: One Events section on the team profile

With the event drawer flag on, a team profile SHALL show an Events section in place of the Contributions tiles. It uses the member profile's cards and four-card limit, in two columns (one on mobile). When both groups are present, the section SHALL be titled "Events" with the labels "<Team> is going to" and "Contributions"; with one group, it SHALL have no labels and be titled "Events <Team> is going to" or "Past events". The team profile keeps these titles and columns after LAB-3234. With the flag off, the team profile SHALL show the Contributions tiles as today.

#### Scenario: Team with both groups

- **GIVEN** a team whose members are going to two events, and three past team events
- **WHEN** a signed-in member opens the team profile
- **THEN** the section is titled "Events", with "<Team> is going to" and "Contributions"

### Requirement: A team's upcoming events come from its members

A team's upcoming events SHALL be the events its current members are going to and show on their profiles. Each card's foot SHALL read "N from <team>", with up to three of those members' faces. The team's own roles at the event (Host, Speaker, Sponsor) SHALL show after the city. The upcoming group SHALL have no Add event, menu or empty state. It SHALL be shown to signed-in members only.

#### Scenario: Three teammates going

- **GIVEN** three current members of Lighthouse are going to event A and show it on their profiles, and a fourth hides it
- **WHEN** a signed-in member opens the Lighthouse profile
- **THEN** event A's card reads "3 from Lighthouse"

#### Scenario: Signed-out visitor on a team profile

- **WHEN** a signed-out visitor opens a team profile
- **THEN** the Events section shows past events only

### Requirement: Demo Day leads a team's Contributions

A team's Contributions SHALL list Demo Day first when the team took part in one. The Demo Day card has the PL gradient ring and a gradient "Demo Day" pill, and links to that Demo Day's page. The team's other past events SHALL follow, newest first. Plain participation SHALL show no role tag.

#### Scenario: Team that took part in a Demo Day

- **GIVEN** a team that took part in a Demo Day in June 2026, and hosted an event in September 2026
- **WHEN** anyone opens the team profile
- **THEN** the first past card is the Demo Day, with the "Demo Day" pill, linking to its Demo Day page
- **AND** the hosted event follows with a "Host" tag

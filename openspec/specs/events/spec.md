# events Specification

## Purpose
The event drawer: one place in the Directory where a signed-in member opens a single IRL event, sees who is going, says they are going to that event, chooses whether it shows on their profile, and adds their plans for the gathering.

## Requirements

### Requirement: The event drawer is behind a flag

The event drawer SHALL be available only when the build flag `NEXT_PUBLIC_SHOW_EVENT_DRAWER` is `true`. With the flag off, no page SHALL open the drawer, and every entry point SHALL behave as it does today.

#### Scenario: Flag off

- **GIVEN** the build has `NEXT_PUBLIC_SHOW_EVENT_DRAWER` unset
- **WHEN** a signed-in member opens `/home` and a member profile
- **THEN** event rows and cards link where they link today
- **AND** no event drawer opens

#### Scenario: Flag on

- **GIVEN** the build has `NEXT_PUBLIC_SHOW_EVENT_DRAWER=true`
- **WHEN** a signed-in member opens an upcoming event card on a member profile
- **THEN** the event drawer opens on that event

### Requirement: The drawer shows one event as the events app draws it

The drawer SHALL open on one event and show, top to bottom:
1. A Back bar.
2. "EVENT DETAILS" with the event's mode and access.
3. The event's picture when it has one, title, date line, and address with its region.
4. Tags, Host, Description and Agenda.

A block whose data is empty SHALL be left out rather than shown empty. On a narrow screen the drawer SHALL take the full width.

#### Scenario: Event with agenda and tags

- **GIVEN** an upcoming in-person, free-with-RSVP event with two tags, one host, a description and a two-day agenda
- **WHEN** a member opens it
- **THEN** the drawer shows "EVENT DETAILS", "In-Person", "FREE w/ RSVP", the title, the date line, the address, both tags, the host, the description and both agenda days

#### Scenario: Event without agenda or tags

- **GIVEN** an event that has no agenda and no tags
- **WHEN** a member opens it
- **THEN** the drawer shows no Agenda block and no tags row
- **AND** the rest of the event shows as usual

#### Scenario: Event no longer available

- **GIVEN** an event that was deleted after the card was drawn
- **WHEN** a member opens it
- **THEN** the drawer says the event is no longer available, with a way to close it

#### Scenario: The event fails to load

- **GIVEN** the request for the event fails for a reason other than a missing event
- **WHEN** a member opens it
- **THEN** the drawer says it couldn't load the event, with "Try again" and a way to close it

### Requirement: The drawer never opens empty

While the event loads, the drawer SHALL keep the Back bar and the "EVENT DETAILS" line, with placeholders in the panel's shape. Pointing at or focusing a Home rail row or a profile event card that opens the drawer SHALL start loading that event.

#### Scenario: The event is still loading

- **GIVEN** a member opens an event that has not loaded yet
- **WHEN** the drawer appears
- **THEN** it shows the Back bar, "EVENT DETAILS" and loading placeholders, not an empty panel

#### Scenario: The event loads before the press

- **GIVEN** a signed-in member on Home
- **WHEN** they point at an upcoming event row, then open it
- **THEN** the event started loading when they pointed at the row

### Requirement: The drawer shows the gathering and the event's attendees

Below the event, the drawer SHALL show:
- the gathering's links (its schedule, its resources such as Telegram and shared notes, and the number of its events);
- "Attendees", with up to three faces and "N People going" ("1 Person going" for one).

N SHALL count the members going to this event only. Members who said they are going to the gathering as a whole without naming an event SHALL NOT count.

#### Scenario: Count for one event

- **GIVEN** 12 members going to event A, and 5 members going to A's gathering without naming an event
- **WHEN** a member opens event A
- **THEN** the drawer reads "12 People going"

#### Scenario: One member going

- **GIVEN** one member going to event A
- **WHEN** a member opens event A
- **THEN** the drawer reads "1 Person going"

#### Scenario: Nobody going yet

- **GIVEN** an event nobody has said they are going to
- **WHEN** a member opens it
- **THEN** the Attendees block reads "Nobody has said they are going yet." instead of a count

### Requirement: The attendee list is for one event and searchable

"N People going" SHALL open the list of that event's attendees above the drawer, titled "N going to <event>". It SHALL show the viewer first as "You" when they are going. Each other row SHALL show the member's photo, name, role and team, with a Host, Speaker or Sponsor tag when they have that role at this event. A row SHALL open that member's profile in a new tab.

A search box SHALL filter by name or team. With no match, the list SHALL say "Nobody going matches that search."

#### Scenario: Searching the list

- **GIVEN** an event with 40 attendees, three of them on the team "Lighthouse"
- **WHEN** the member opens "40 People going" and types "lighthouse"
- **THEN** the list shows those three members
- **AND** closing the list returns to the drawer

### Requirement: A member says they are going to this event

A signed-in member with permission to mark attendance SHALL be asked whether they are going, with a "Show on my profile" checkbox that is ticked by default, and "No" / "Yes, I'm going". "No" SHALL close the drawer without saving. "Yes, I'm going" SHALL save attendance for this one event only, with the checkbox's value, and leave the member's other events unchanged.

#### Scenario: The question

- **GIVEN** a member with attendance permission who is not going to "Lisbon Founders Day"
- **WHEN** they open it
- **THEN** the drawer asks "Are you going to Lisbon Founders Day?" with "Let others know if you are attending."
- **AND** "Show on my profile" is ticked, with "Signed-in members will see Lisbon Founders Day on your profile."
- **AND** the footer has "No" and "Yes, I'm going"

#### Scenario: Going, shown on the profile

- **GIVEN** a member with attendance permission who is not going to event A
- **WHEN** they open event A and press "Yes, I'm going" with "Show on my profile" ticked
- **THEN** they are saved as going to event A, shown on their profile
- **AND** the attendee count goes up by one and the list shows them as "You"

#### Scenario: Going, not shown on the profile

- **GIVEN** a member with attendance permission
- **WHEN** they untick "Show on my profile" and press "Yes, I'm going" on event A
- **THEN** they are saved as going to event A
- **AND** other members don't see event A on their profile

#### Scenario: Other events at the same gathering are kept

- **GIVEN** a member going to event B at the same gathering as event A
- **WHEN** they say yes to event A
- **THEN** they are going to both A and B

#### Scenario: Saving fails

- **GIVEN** the attendance request fails
- **WHEN** the member presses "Yes, I'm going"
- **THEN** an error toast shows and the drawer stays on the question
- **AND** the attendee count does not change

### Requirement: Members who cannot mark attendance see the event only

A signed-in member without permission to mark attendance SHALL see the event, the gathering links and the attendees, and SHALL NOT see the question, the checkbox or the footer buttons.

#### Scenario: Member without attendance permission

- **GIVEN** a signed-in member without `irlg.going.write` or directory admin
- **WHEN** they open an event
- **THEN** the drawer shows the event and "N People going"
- **AND** there is no "Are you going" question and no "Yes, I'm going" button

### Requirement: The member adds their plans after saying yes

After "Yes, I'm going", and whenever a member opens an event they are already going to, the drawer SHALL show the plans step. It asks "What are you planning for <city>?" (dates, topics, the gathering's events and the member's role at each), the additional details (team, Telegram, office hours, notes) and "Show on my profile". The footer reads "Skip" right after a yes, "Cancel" otherwise, then "Save". Pickers open as modals above the drawer.

#### Scenario: Adding another event of the gathering

- **GIVEN** a member who just said yes to event A
- **WHEN** they tick event B in the events picker, choose "Speaker" for it and press Save
- **THEN** they are going to A and B, as Speaker at B
- **AND** the drawer closes

#### Scenario: Skipping the plans

- **GIVEN** a member who just said yes to event A
- **WHEN** they press "Skip"
- **THEN** the drawer closes and they stay going to event A

#### Scenario: Unticking an event

- **GIVEN** a member going to events A and B at one gathering
- **WHEN** they open A, untick B in the events picker and press Save
- **THEN** they are no longer going to B and still going to A

#### Scenario: Saving the plans fails

- **GIVEN** a member on the plans step who has changed their dates and topics
- **WHEN** they press Save and the request fails
- **THEN** an error toast shows and the drawer stays open with their changes
- **AND** pressing Save again does not create the events the failed attempt already saved

### Requirement: Escape and the backdrop close the top layer first

While a picker or the attendee list is open above the drawer, Escape and a click on the backdrop SHALL close only that layer and return to the drawer. With nothing above it, Escape and the backdrop SHALL close the drawer.

#### Scenario: Escape in the date picker

- **GIVEN** the date picker is open above the drawer
- **WHEN** the member presses Escape
- **THEN** the date picker closes and the drawer stays open

### Requirement: The drawer confirms what was saved

When the drawer closes after a member said yes, the page that opened it SHALL show a toast:
- "<event> is on your profile." when the event is shown on their profile;
- "You're going to <event>." when it isn't.

The opening page SHALL then show the member as going.

#### Scenario: Toast after a yes

- **GIVEN** a member said yes to event A with "Show on my profile" ticked
- **WHEN** they close the drawer
- **THEN** a toast reads "A is on your profile."

### Requirement: Event drawer analytics

The drawer SHALL record these PostHog events, each with `event_uid`:
- `event-drawer-opened`, with `source` (`home`, `member-profile`, `team-profile` or `add-event`);
- `event-going-marked`, with `show_on_profile` and `source`;
- `event-not-going-marked`, when Save removes an event;
- `event-show-on-profile-toggled`, with `show_on_profile` and `from` (`drawer` or `profile-menu`);
- `event-plans-saved`, with `events_count`;
- `event-attendees-opened`.

#### Scenario: Going from Home

- **WHEN** a member opens event A from the Home rail and presses "Yes, I'm going"
- **THEN** `event-drawer-opened` is recorded with `source` = `home`
- **AND** `event-going-marked` is recorded with `event_uid` = A's uid and `source` = `home`

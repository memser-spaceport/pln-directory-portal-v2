# events Specification

## Purpose
The event drawer: one place in the Directory where a signed-in member opens a single IRL event, sees who is going, says they are going to that event, chooses whether it shows on their profile, and adds their plans for the gathering.

## Requirements

### Requirement: The event drawer is behind a flag

The event drawer SHALL be available only when the build flag `NEXT_PUBLIC_SHOW_EVENT_DRAWER` is `true`. With the flag off, no page SHALL open the drawer, and every entry point SHALL behave as it does today.

#### Scenario: Flag off

- **GIVEN** the build has `NEXT_PUBLIC_SHOW_EVENT_DRAWER` unset
- **WHEN** a signed-in member opens `/` and a member profile
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

The drawer SHALL show a going card before the agenda (LAB-3225) with up to three faces and "N members going" ("1 member going" for one), and below the event the gathering's links (its schedule, its resources such as Telegram and shared notes, and the number of its events). When the event has its own page, the card SHALL have "Register", which opens that page in a new tab.

N SHALL count the members going to this event only. Members who said they are going to the gathering as a whole without naming an event SHALL NOT count.

#### Scenario: Count for one event

- **GIVEN** 12 members going to event A, and 5 members going to A's gathering without naming an event
- **WHEN** a member opens event A
- **THEN** the drawer reads "12 members going"

#### Scenario: One member going

- **GIVEN** one member going to event A
- **WHEN** a member opens event A
- **THEN** the drawer reads "1 member going"

#### Scenario: Nobody going yet

- **GIVEN** an event nobody has said they are going to
- **WHEN** a member opens it
- **THEN** the going card reads "Nobody has said they are going yet." instead of a count

### Requirement: The attendee list is for one event and searchable

The count SHALL open the list of that event's attendees above the drawer, titled "N going to <event>". It SHALL show the viewer first as "You" when they are going. Each other row SHALL show the member's photo, name, role and team, with a Host, Speaker or Sponsor tag when they have that role at this event. A row SHALL open that member's profile in a new tab.

A search box SHALL filter by name or team. With no match, the list SHALL say "Nobody going matches that search."

#### Scenario: Searching the list

- **GIVEN** an event with 40 attendees, three of them on the team "Lighthouse"
- **WHEN** the member opens "40 members going" and types "lighthouse"
- **THEN** the list shows those three members
- **AND** closing the list returns to the drawer

### Requirement: A member says they are going to this event

The drawer SHALL be about one event (LAB-3234). A signed-in member with permission to mark attendance SHALL see the going card ask "Are you going?" with "Yes, I'm going". "Yes, I'm going" SHALL save attendance for this one event only and leave the member's other events unchanged. The card SHALL then read "You're going" in place, with "You and N members" (or "You're the first one going"), "Add your plans for <city>" and "Can't make it? Mark as not going". "Mark as not going" SHALL remove this event only.

Going SHALL always be visible to signed-in members: there is no "Show on my profile" choice.

#### Scenario: The question

- **GIVEN** a member with attendance permission who is not going to "Lisbon Founders Day"
- **WHEN** they open it
- **THEN** the going card asks "Are you going?" with "Yes, I'm going"
- **AND** there is no "No" button and no "Show on my profile" checkbox

#### Scenario: Going

- **GIVEN** a member with attendance permission who is not going to event A
- **WHEN** they open event A and press "Yes, I'm going"
- **THEN** they are saved as going to event A
- **AND** the card reads "You're going" and the count goes up by one
- **AND** the drawer stays on the event

#### Scenario: Other events at the same gathering are kept

- **GIVEN** a member going to event B at the same gathering as event A
- **WHEN** they say yes to event A
- **THEN** they are going to both A and B

#### Scenario: Marking as not going

- **GIVEN** a member going to events A and B at one gathering
- **WHEN** they open A and press "Mark as not going"
- **THEN** they are no longer going to A and still going to B
- **AND** the card asks "Are you going?" again

#### Scenario: Saving fails

- **GIVEN** the attendance request fails
- **WHEN** the member presses "Yes, I'm going"
- **THEN** an error toast shows and the card still asks
- **AND** the attendee count does not change

### Requirement: Members who cannot mark attendance see the event only

A signed-in member without permission to mark attendance SHALL see the event, the gathering links and the attendees in a "Who's going" card, and SHALL NOT see the question or any button that saves.

#### Scenario: Member without attendance permission

- **GIVEN** a signed-in member without `irlg.going.write` or directory admin
- **WHEN** they open an event
- **THEN** the drawer shows the event and "Who's going" with "N members going"
- **AND** there is no "Are you going?" question and no "Yes, I'm going" button

### Requirement: The member adds their plans for the event

"Add your plans for <city>" SHALL open the plans sub-view inside the drawer, titled "Your plans for <city>", with "Back to event". It SHALL show the member's role at this event as Host, Speaker and Sponsor chips (any number; none means attending), "What are you planning for <city>?" with dates and topics, and the additional details (team, Telegram, office hours, notes). There SHALL be no events picker. "Cancel" and "Back to event" SHALL return to the event without saving; "Save" SHALL save in place and return to the event. The owner's "Edit details" on their profile SHALL open the drawer on this sub-view. Pickers open as modals above the drawer.

Save SHALL change the role of this event only. The dates, topics and details are the member's for the whole gathering.

#### Scenario: Choosing a role

- **GIVEN** a member going to events A and B at one gathering, as Speaker at B
- **WHEN** they open A, choose "Host" in "Add your plans" and press Save
- **THEN** they are Host at A and still Speaker at B
- **AND** the drawer returns to event A

#### Scenario: Saving the plans fails

- **GIVEN** a member in "Add your plans" who has changed their role and topics
- **WHEN** they press Save and the request fails
- **THEN** an error toast shows and the sub-view stays open with their changes

### Requirement: Escape and the backdrop close the top layer first

While a picker or the attendee list is open above the drawer, Escape and a click on the backdrop SHALL close only that layer and return to the drawer. In "Add your plans" they SHALL return to the event. Otherwise they SHALL close the drawer.

#### Scenario: Escape in the date picker

- **GIVEN** the date picker is open above "Add your plans"
- **WHEN** the member presses Escape three times
- **THEN** the date picker closes, then the drawer returns to the event, then the drawer closes

### Requirement: The drawer confirms what was saved

When the drawer closes after a member said yes in it, and they are still going, the page that opened it SHALL show the toast "<event> is on your profile." The opening page SHALL then show the member as going.

#### Scenario: Toast after a yes

- **GIVEN** a member said yes to event A
- **WHEN** they close the drawer
- **THEN** a toast reads "A is on your profile."

### Requirement: Event drawer analytics

The drawer SHALL record these PostHog events, each with `event_uid`:
- `event-drawer-opened`, with `source` (`home`, `member-profile`, `team-profile` or `add-event`);
- `event-going-marked`, with `source`;
- `event-not-going-marked`, on "Mark as not going";
- `event-plans-saved`, with `roles`;
- `event-attendees-opened`.

#### Scenario: Going from Home

- **WHEN** a member opens event A from the Home rail and presses "Yes, I'm going"
- **THEN** `event-drawer-opened` is recorded with `source` = `home`
- **AND** `event-going-marked` is recorded with `event_uid` = A's uid and `source` = `home`

# Spec Delta

## MODIFIED Requirements

### Requirement: The drawer shows one event as the events app draws it

The drawer SHALL open on one event and show, top to bottom:

1. A Back bar.
2. "EVENT DETAILS" with the event's mode and access.
3. The event's picture when it has one, title, date line, and address with its region.
4. The event's own page (for example its Luma page) when it has one, as a link under the date and the address (LAB-3271). The link SHALL open in a new tab. It SHALL show the address without `https://`. An event without a page, or whose page is not an `http` or `https` address, SHALL have no link row.
5. Tags, Host, Description and Agenda.

A block whose data is empty SHALL be left out rather than shown empty. On a narrow screen the drawer SHALL take the full width.

#### Scenario: Event with its own page

- **GIVEN** event A with the page `https://lu.ma/labweek-lisbon`
- **WHEN** a viewer opens event A
- **THEN** the drawer shows "lu.ma/labweek-lisbon" under the date and the address
- **AND** pressing it opens that page in a new tab

#### Scenario: Event without a page

- **GIVEN** event B without a page
- **WHEN** a viewer opens event B
- **THEN** the drawer shows no link row

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

### Requirement: A member says they are going to this event

The drawer SHALL be about one event (LAB-3234). A signed-in member with permission to mark attendance SHALL see the going card ask "Are you going?", and "Yes, I'm going" in the drawer's footer. The footer SHALL stay at the bottom of the drawer on desktop and phone while the event scrolls, so a long description never hides the press (LAB-3271). Once the member is going, the footer SHALL go away. "Yes, I'm going" SHALL save attendance for this one event only and leave the member's other events unchanged. The card SHALL then read "You're going" in place, with "You and N members" (or "You're the first one going"), "Add your plans for <city>" and "Can't make it? Mark as not going". "Mark as not going" SHALL remove this event only.

Going SHALL always be visible to signed-in members: there is no "Show on my profile" choice.

#### Scenario: The question

- **GIVEN** a member with attendance permission who is not going to "Lisbon Founders Day"
- **WHEN** they open it
- **THEN** the going card asks "Are you going?" with "Yes, I'm going"
- **AND** there is no "No" button and no "Show on my profile" checkbox

#### Scenario: "Yes, I'm going" stays in view

- **GIVEN** a member with attendance permission who is not going to event A, which has a long description
- **WHEN** they open event A on desktop or on a phone and scroll the description
- **THEN** "Yes, I'm going" stays visible at the bottom of the drawer

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

## ADDED Requirements

### Requirement: Signed-out visitors see the event and are asked to sign in

A signed-out visitor SHALL be able to open the drawer from Home (LAB-3271). The drawer SHALL show the event, the gathering links and a "Who's going" card, and "Yes, I'm going" in the sticky footer. "Yes, I'm going" and the people count SHALL close the drawer and open the sign-in modal on the same page. Nothing SHALL save.

#### Scenario: Signed out

- **GIVEN** a signed-out visitor on Home with the event drawer flag on
- **WHEN** they open event A and press "Yes, I'm going"
- **THEN** the drawer closes and the sign-in modal opens
- **AND** no attendance is saved

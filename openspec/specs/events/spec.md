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

The drawer SHALL follow the redesigned drawer prototype (LAB-3361, `prototypes/entries/event-drawer-redesign`): 640px wide, the full width on a narrow screen. It SHALL open on one event and show, top to bottom:

1. A toolbar that stays at the top while the drawer scrolls (LAB-3361). On the left: "Copy link", which copies `/events/all?event=<uid>` on the current site and reads "Copied" for two seconds (only its icon on a phone). The drawer SHALL NOT show "Open in PL Events" or another link to the PL events app, also in the embed, because the event data will move to LabOS (LAB-3420). On the right: previous and next, when the page that opened the drawer passes a list of more than one event (see the All Events requirement); then Close.
2. The event's picture as a 56px thumbnail when it has one, beside the title and "Hosted by <hosts>" ("A and B", "A, B and C"). Hosts are names, not links.
3. A date row: a tile with the month and day, then the day ("Thursday, November 19", or "Tue, Dec 1 – Sat, Dec 5" for an event across days) and the time with its zone ("6:00 PM – 9:00 PM · UTC−5"), all in the event's own time zone: the one the event has, otherwise its gathering's, otherwise UTC (LAB-3404). Once the event has ended, a day in a year other than the current one SHALL carry its year (LAB-3418): "Tuesday, November 4, 2025", "Mon, Jun 30 – Fri, Jul 4, 2025", and over New Year a year on each end, "Tue, Dec 30, 2025 – Fri, Jan 2, 2026". Both years are read in the line's own time zone. An event that has not ended SHALL carry no year, and the line SHALL NOT change while the drawer is open. An event whose end is before its start SHALL be on its first day, as on its card, and neither the day nor the time SHALL read backwards. When the dates can't be read, the row SHALL show the events app's date line instead.
4. A place row with a pin tile: the address for an in-person event; "Online" with "Link sent after you register" for an online event ("Online event" once it has ended); the address with "Hybrid, also online" under it for a hybrid event (LAB-3283). When the event has a map link (the events service's `location_url`) and an address, the place text and its arrow SHALL be one link that opens the map in a new tab, as on the PL events app (LAB-3324). An event without a map link, or whose map link is not an `http` or `https` address, SHALL show the place as plain text with no arrow. "Online" SHALL never link to a map.
5. The event's own page (for example its Luma page) when it has one, as a link under the place row (LAB-3271). The link SHALL open in a new tab. It SHALL show the address without `https://`. The row SHALL look like the other fact rows (LAB-3333, LAB-3361): a link icon in a tile like the place row's, then the link text styled like the day line, with no arrow. The page SHALL be the event's `websiteUrl`. When `websiteUrl` is empty or not an `http` or `https` address, the page SHALL be the link of the event's resource named "Registration" (any case, end spaces ignored), and "Register" SHALL open the same page (LAB-3334). An event without a page, or whose page is not an `http` or `https` address, SHALL have no link row and no "Register".
6. An access row when the access is known, with an icon and two lines: "Invite only / The hosts approve each guest", "Paid / Tickets on the host's site" or, on one line, "RSVP to save your spot" (LAB-3283, LAB-3407). The events service's `OPEN` access SHALL read as the last one and never as "Free": it does not say that an event costs nothing. Once the event has ended the row SHALL keep what the event was and drop the ask: "Invite only" as before, "Paid" on one line, and no row in place of "RSVP to save your spot" (LAB-3426). Mode and access SHALL NOT show as badges.
7. The going card, or the ended card once the event has ended (see below).
8. "About": the description, then the focus areas as neutral badges under the label "Focus areas", then the topics as neutral badges, under the label "Topics" when the event also has focus areas (LAB-3404). The events portal tags an event with focus area codes and with topics. The focus areas SHALL show by name, never by code: FA1 "Digital Human Rights", FA2 "Economies & Governance", FA3 "AI & Robotics", FA4 "Neurotech". Every other tag is a topic.
9. "Agenda": a row per session with its time beside its title and description, under a day title ("Tue, 1st Dec") when the agenda spans several days.

A block whose data is empty SHALL be left out rather than shown empty. On a narrow screen the drawer SHALL take the full width.

#### Scenario: The year of an ended event

- **GIVEN** today is November 25, 2026, and an event that ran on November 4, 2025
- **WHEN** a viewer opens it
- **THEN** its day line reads "Tuesday, November 4, 2025"
- **AND** an event that ended on October 5, 2026, and an upcoming one in January 2027, carry no year

#### Scenario: The year is the line's own

- **GIVEN** an ended event at 9 PM on December 31, 2025 in New York, which is already 2026 in UTC
- **WHEN** a viewer opens it in 2026
- **THEN** its day line reads "Wednesday, December 31, 2025"

#### Scenario: Event with its own page

- **GIVEN** event A with the page `https://lu.ma/labweek-lisbon`
- **WHEN** a viewer opens event A
- **THEN** the drawer shows "lu.ma/labweek-lisbon" under the place row
- **AND** pressing it opens that page in a new tab

#### Scenario: Event without a page

- **GIVEN** event B without a page
- **WHEN** a viewer opens event B
- **THEN** the drawer shows no link row

#### Scenario: Event with a map link

- **GIVEN** event C with the map link `https://www.google.com/maps/search/?api=1&query=Lisbon`
- **WHEN** a viewer opens event C
- **THEN** the address and its arrow are one link to that map
- **AND** pressing it opens the map in a new tab

#### Scenario: Event without a map link

- **GIVEN** event D without a map link
- **WHEN** a viewer opens event D
- **THEN** the drawer shows the address as plain text with no arrow

#### Scenario: Event with focus areas and a topic

- **GIVEN** an event tagged `FA3`, `FA4` and "Conference"
- **WHEN** a viewer opens it
- **THEN** About shows "AI & Robotics" and "Neurotech" under "Focus areas", and "Conference" under "Topics"

#### Scenario: Event with its own time zone

- **GIVEN** an event with the time zone `America/Chicago` in a gathering that has none
- **WHEN** a viewer opens it
- **THEN** the date row shows the Chicago day and time

#### Scenario: Event with agenda and tags

- **GIVEN** an upcoming in-person event with `OPEN` access, two tags, one host, a description and a two-day agenda
- **WHEN** a member opens it
- **THEN** the drawer shows the title, "Hosted by" the host, the date tile with the days and the time, the address, "RSVP to save your spot" on one line, the description with both tags under it, and both agenda days
- **AND** no mode or access badge

#### Scenario: Hybrid event

- **GIVEN** a hybrid event in Lisbon
- **WHEN** a viewer opens it
- **THEN** the place row reads the Lisbon address with "Hybrid, also online" under it

#### Scenario: Access unknown

- **GIVEN** an event whose access is not known
- **WHEN** a viewer opens it
- **THEN** the drawer shows no access row

#### Scenario: Event without agenda or tags

- **GIVEN** an event that has no agenda and no tags
- **WHEN** a member opens it
- **THEN** the drawer shows no Agenda block and no tags row
- **AND** the rest of the event shows as usual

#### Scenario: No link to the PL events app

- **GIVEN** event A whose events-app id is `abc`, and the PL events app has an address
- **WHEN** a viewer opens event A, on All Events or in the embed
- **THEN** the drawer shows no "Open in PL Events" and no link to the PL events app

#### Scenario: Copying the link

- **WHEN** a viewer opens event A and presses "Copy link"
- **THEN** `/events/all?event=<A's uid>` on the current site is on the clipboard
- **AND** the button reads "Copied" for two seconds

#### Scenario: Event no longer available

- **GIVEN** an event that was deleted after the card was drawn
- **WHEN** a member opens it
- **THEN** the drawer says the event is no longer available, with a way to close it

#### Scenario: The event fails to load

- **GIVEN** the request for the event fails for a reason other than a missing event
- **WHEN** a member opens it
- **THEN** the drawer says it couldn't load the event, with "Try again" and a way to close it

### Requirement: The drawer never opens empty

While the event loads, the drawer SHALL show the toolbar with Close, and placeholders shaped like the event (thumbnail and title, three fact rows, the going card). Pointing at or focusing a Home rail row or a profile event card that opens the drawer SHALL start loading that event.

#### Scenario: The event is still loading

- **GIVEN** a member opens an event that has not loaded yet
- **WHEN** the drawer appears
- **THEN** it shows the toolbar and loading placeholders, not an empty panel

#### Scenario: The event loads before the press

- **GIVEN** a signed-in member on Home
- **WHEN** they point at an upcoming event row, then open it
- **THEN** the event started loading when they pointed at the row

### Requirement: The drawer shows the gathering and the event's attendees

Until the event ends (see "An event that has ended shows who went"), the drawer SHALL show a going card right after the fact rows, before About and the agenda (LAB-3225, LAB-3361), with up to three faces and "N members going" ("1 member going" for one). When the event has its own page, the card SHALL have "Register", which opens that page in a new tab. The drawer SHALL NOT show the event's gathering: no "<city> gathering" label, no gathering schedule link, no gathering resources (such as Telegram or shared notes) and no gathering event count (LAB-3283). The gathering stays behind the going card and the plans, which still save to it.

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

#### Scenario: No gathering links

- **GIVEN** event A in the Lisbon gathering, which has a Telegram link and 5 events
- **WHEN** a member or an admin opens event A
- **THEN** the drawer shows no "Lisbon gathering" label, no Telegram link and no "View all events"
- **AND** "Yes, I'm going" and "Add your plans for Lisbon" work as before

### Requirement: The attendee list is for one event and searchable

The count SHALL open the list of that event's attendees inside the drawer, in place of the event, under the toolbar (LAB-3361): "Back to event", then the title "N going to <event>". It SHALL show the viewer first as "You", with their role and team, when they are going; that row is not a link. Each other row SHALL show the member's photo, name, role and team, and a tag for each role they have at this event (Host violet, Speaker green, Sponsor blue, as on the profile's events). A row SHALL open that member's profile in a new tab.

The shared search box SHALL filter by name or team once the member stops typing, or at once on Enter. With no match, the list SHALL say "Nobody going matches “<what they typed>”."

#### Scenario: Searching the list

- **GIVEN** an event with 40 attendees, three of them on the team "Lighthouse"
- **WHEN** the member opens "40 members going" and types "lighthouse"
- **THEN** the list shows those three members
- **AND** "Back to event" returns to the event

### Requirement: An event that has ended shows who went

An event has ended from its end time, the same instant for every viewer, not from the next day (LAB-3426). An event that spans several days has not ended before its end time on its last day. An event whose end is not a date never ends.

Once the event has ended, the drawer SHALL show the ended card in place of the going card, wherever the drawer was opened from:

- "This event has ended", with up to three faces and "N members went" ("1 member went" for one);
- when the viewer had said they were going, "You went" with the green check, and "You and N members" ("You and 1 member"), or "Nobody else said they were going." when they were the only one;
- "Nobody said they were going.", with nothing to press, when the count is 0.

The faces and the count SHALL open the list as before: for a signed-out visitor they start sign-in, and in the embed they are text. The list SHALL be titled "N went to <event>", and its other lines SHALL be in the past: "Nobody who went matches “<what they typed>”.", "Nobody said they were going.", "We couldn't load who went.".

The drawer SHALL have no "Are you going?", "Yes, I'm going", "Register", "RSVP on LabOS", "Add your plans", "Mark as not going" or bottom bar for an event that has ended. "Edit details" on the profile SHALL open the drawer on the event. The event's own page stays as a link among the facts.

A signed-out visitor, and the embed, SHALL NOT see who went to an invite-only event: no count, no faces and nothing to press, whatever count the API sends, and the card SHALL NOT say that nobody went. An event is invite only when its access is invite only or its type is `INVITE_ONLY`, also when its access says otherwise. For every other event and viewer the count SHALL show as it does before the end.

When the event ends while the drawer is open, the drawer SHALL change to this state, also when "Add your plans" or a picker over it is open (what was typed there is not saved). It SHALL NOT go back to the plans by itself when the end moves later. A press on "Yes, I'm going", "Mark as not going" or "Save" after the end SHALL save nothing and SHALL show this state at once.

#### Scenario: Others went

- **GIVEN** event A ended a minute ago with 12 members going, and the viewer had not said yes
- **WHEN** they open event A from any page, or at `/events/all?event=<A's uid>`
- **THEN** the card reads "This event has ended" and "12 members went"
- **AND** there is no going action, no plans action, no "Register" and no bottom bar

#### Scenario: The viewer went

- **GIVEN** a member and 12 others said they were going to event A, which has ended
- **WHEN** the member opens event A
- **THEN** the card reads "You went" with the green check, and "You and 12 members"
- **AND** pressing it opens "13 went to A"

#### Scenario: Nobody went

- **GIVEN** an event that ended and that nobody said they were going to
- **WHEN** a member opens it
- **THEN** the card reads "This event has ended" and "Nobody said they were going."

#### Scenario: The last day of an event across days

- **GIVEN** an event from December 1 to December 5 that ends at 6:00 PM in its time zone
- **WHEN** a member opens it on December 5, one second before 6:00 PM there
- **THEN** the card asks "Are you going?"
- **WHEN** they open it at 6:00 PM there
- **THEN** it shows the ended card

#### Scenario: It ends while the drawer is open

- **GIVEN** a member has event A open and has not said yes
- **WHEN** event A's end time comes
- **THEN** the card changes to "This event has ended" and the bottom bar goes away
- **AND** a press on "Yes, I'm going" after the end saves nothing and shows the ended card at once

#### Scenario: Signed out on an invite-only event

- **GIVEN** an invite-only event that has ended, with 12 members who went
- **WHEN** a signed-out visitor opens it, or a reader opens it in the embed
- **THEN** the card reads "This event has ended" with no count, no faces and nothing to press

#### Scenario: Ended in the embed

- **GIVEN** an event in `/events/embed` that has ended
- **WHEN** the reader opens it
- **THEN** the card reads "This event has ended" with "N members went" as text, and no "RSVP on LabOS"

### Requirement: A member says they are going to this event

The drawer SHALL be about one event (LAB-3234). A signed-in member with permission to mark attendance SHALL see the going card ask "Are you going?" with "Yes, I'm going" and, when the event has its own page, "Register" (LAB-3361). Once less than half of the card is on screen, a bar SHALL stay at the bottom of the drawer with the same question, the count, "Register" and "Yes, I'm going", so a long description never hides the press (LAB-3271, LAB-3361); once the member is going, the bar reads "You're going" with "Register". The bar SHALL NOT show while the card is in view or on a sub-view. "Yes, I'm going" SHALL save attendance for this one event only and leave the member's other events unchanged. The card SHALL then read "You're going" in place, with "You and N members" (or "You're the first one going"), "Add your plans for <city>" and "Can't make it? Mark as not going". "Mark as not going" SHALL remove this event only.

Going SHALL always be visible to signed-in members: there is no "Show on my profile" choice.

#### Scenario: The question

- **GIVEN** a member with attendance permission who is not going to "Lisbon Founders Day"
- **WHEN** they open it
- **THEN** the going card asks "Are you going?" with "Yes, I'm going" and "Register"
- **AND** there is no "No" button and no "Show on my profile" checkbox

#### Scenario: "Yes, I'm going" stays in view

- **GIVEN** a member with attendance permission who is not going to event A, which has a long description
- **WHEN** they open event A on desktop or on a phone and scroll until the going card is mostly out of view
- **THEN** a bar at the bottom of the drawer asks "Are you going?" with "Yes, I'm going"
- **AND** scrolling back to the card removes the bar

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

Until the event ends, a signed-in member without permission to mark attendance SHALL see the event and the attendees in a "Who's going" card, and SHALL NOT see the question, the bottom bar or any button that saves.

#### Scenario: Member without attendance permission

- **GIVEN** a signed-in member without `irlg.going.write` or directory admin
- **WHEN** they open an event
- **THEN** the drawer shows the event and "Who's going" with "N members going"
- **AND** there is no "Are you going?" question and no "Yes, I'm going" button

### Requirement: Signed-out visitors see the event and are asked to sign in

A signed-out visitor SHALL be able to open the drawer from Home (LAB-3271). The drawer SHALL show the event and, until the event ends, the going card SHALL ask "Are you going?" with "Yes, I'm going" as for a member (LAB-3361), with the same bottom bar. "Yes, I'm going" and the people count SHALL open the sign-in modal over the drawer, which stays open, so a visitor who signs in is back on the same event (LAB-3368, LAB-3371). Nothing SHALL save.

#### Scenario: Signed out

- **GIVEN** a signed-out visitor on Home with the event drawer flag on
- **WHEN** they open event A and press "Yes, I'm going"
- **THEN** the sign-in modal opens over the drawer, and the drawer stays on the event
- **AND** no attendance is saved

### Requirement: The member adds their plans for the event

Until the event ends, "Add your plans for <city>" SHALL open the plans sub-view inside the drawer, titled "Your plans for <city>", with "Back to event". It SHALL show the member's role at this event as Host, Speaker and Sponsor chips (any number; none means attending), "What are you planning for <city>?" with dates and topics, and the additional details (team, Telegram, office hours, notes). There SHALL be no events picker. "Cancel" and "Back to event" SHALL return to the event without saving; "Save" SHALL save in place and return to the event. The owner's "Edit details" on their profile SHALL open the drawer on this sub-view until the event ends, and on the event after that. Pickers open as modals above the drawer.

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

While a picker is open above the drawer, Escape and a click on the backdrop SHALL close only the picker. On the attendee list or in "Add your plans" they SHALL return to the event. Otherwise they SHALL close the drawer.

#### Scenario: Escape in the date picker

- **GIVEN** the date picker is open above "Add your plans"
- **WHEN** the member presses Escape three times
- **THEN** the date picker closes, then the drawer returns to the event, then the drawer closes

### Requirement: The drawer confirms what was saved

When the drawer closes, or steps to another event with previous or next, after a member said yes in it, and they are still going, the page that opened it SHALL show the toast "<event> is on your profile." The opening page SHALL then show the member as going.

#### Scenario: Toast after a yes

- **GIVEN** a member said yes to event A
- **WHEN** they close the drawer
- **THEN** a toast reads "A is on your profile."

### Requirement: Event drawer analytics

The drawer SHALL record these PostHog events, each with `event_uid`:

- `event-drawer-opened`, with `source` (`home`, `member-profile`, `team-profile`, `add-event`, `digest`, `all-events` or `embed`);
- `event-going-marked`, with `source`;
- `event-not-going-marked`, on "Mark as not going";
- `event-plans-saved`, with `roles`;
- `event-attendees-opened`;
- `event-drawer-link-copied`, on "Copy link" (LAB-3361);
- `event-drawer-stepped`, on previous or next, with `direction` (`previous` or `next`) and `source`; its `event_uid` is the event it moved to (LAB-3361).

#### Scenario: Going from Home

- **WHEN** a member opens event A from the Home rail and presses "Yes, I'm going"
- **THEN** `event-drawer-opened` is recorded with `source` = `home`
- **AND** `event-going-marked` is recorded with `event_uid` = A's uid and `source` = `home`

#### Scenario: Going from All Events

- **WHEN** a member opens event A on `/events/all` and presses "Yes, I'm going"
- **THEN** `event-going-marked` is recorded with `event_uid` = A's uid and `source` = `all-events`

### Requirement: The All Events page is native behind a flag

When the build flag `NEXT_PUBLIC_SHOW_EVENTS_PAGE_V2` is `true`, `/events/all` SHALL render the All Events page in LabOS, with no iframe. With the flag off, `/events/all` SHALL show the events app iframe exactly as before. The page SHALL be open to signed-out visitors, as before. It SHALL show the events that have not ended under "Live & upcoming" and those that have under "Past" (LAB-3418).

#### Scenario: Flag off

- **GIVEN** the build has `NEXT_PUBLIC_SHOW_EVENTS_PAGE_V2` unset
- **WHEN** a visitor opens `/events/all`
- **THEN** the page shows the events app in an iframe, as before

#### Scenario: Flag on

- **GIVEN** the build has `NEXT_PUBLIC_SHOW_EVENTS_PAGE_V2=true`
- **WHEN** a visitor opens `/events/all`
- **THEN** the page shows the header, the toolbar with Live & upcoming selected, Browse by city and the List view
- **AND** no iframe loads

#### Scenario: An event in progress stays until it ends

- **GIVEN** an event that started yesterday and ends tomorrow
- **WHEN** a visitor opens `/events/all`
- **THEN** the event is listed under today

#### Scenario: Past events are not under Live & upcoming

- **GIVEN** an event that ended yesterday and one that starts tomorrow
- **WHEN** a visitor opens `/events/all`
- **THEN** only the event that starts tomorrow is listed
- **AND** under Past, only the event that ended yesterday

### Requirement: Past events load after the page

An event SHALL be past from its end instant, on the visitor's clock (LAB-3418). While the page stays open, an event that ends SHALL leave Live & upcoming and enter Past at that instant, with no reload. An event that has started on that clock, and that either of the page's lists has held, SHALL be in exactly one of the two until the visitor leaves the page, whatever order the lists load, refresh or go stale. An event that has not started SHALL be under Live & upcoming only while the page's newest list has it: one that a later list no longer has SHALL leave the page and SHALL NOT come back when its start time comes, and one that only the past events route has SHALL be in neither until it starts.

The browser SHALL ask for past events once, after the page has loaded, from `GET /api/events/past`, so the page's own HTML does not wait for them; showing the tab again, a filter, a tab, a view or a year SHALL NOT ask again. An embed SHALL ask only when its link has `when=past` and it does not show the Calendar. The route SHALL be the same for every visitor and read signed out: every page of `GET /v1/irl/events` (100 events a page, at most 6 calls at once, at most 20 pages), cached on the server for five minutes under a key that holds no clock, then the events that have started or start within 24 hours, newest first, on every read; the browser tells the ended ones by its own clock. Each of its calls SHALL be stopped after 10 seconds, which fails the load. Requests that come while it loads SHALL share that load, and a failed load SHALL NOT be kept. Its answer SHALL be `Cache-Control: private, max-age=300`, and a failure `no-store`. It SHALL fail as a whole, with 502, when a page fails or takes more than 10 seconds, when a page is not a list with a total, when a page is empty before the total is reached, or when there are more events than 20 pages hold (2,000); it SHALL leave out a row without a uid, a name or readable dates, and list an event once. An event in both the page's own newest list and the route's SHALL show once, as the page's newest list has it; one that has started and is no longer in it SHALL show as the list that came last has it, of those that say it has started. An event that ends on a day before the day it starts SHALL be a one-day event on its first day.

#### Scenario: The end instant

- **GIVEN** an event that ends at 6:00:00 PM
- **WHEN** it is 5:59:59 PM
- **THEN** it is under Live & upcoming and not under Past
- **AND** at 6:00:00 PM it is under Past and not under Live & upcoming, with no reload

#### Scenario: A list that loads again

- **GIVEN** the page open since before event E ended, with a past list from before that too
- **WHEN** E ends and the page's list loads again without E
- **THEN** E is under Past, once, until the visitor leaves the page

#### Scenario: An event cancelled before it starts

- **GIVEN** an upcoming event E on the page, and in the past events route's list too
- **WHEN** the page's list loads again without E
- **THEN** E is in neither tab, also once its start time has come, unless a later list has it

#### Scenario: An event cancelled while live

- **GIVEN** event E under way on the page
- **WHEN** the page's list loads again without E
- **THEN** E stays under Live & upcoming, then under Past from its end, until the visitor leaves the page

#### Scenario: An event that has moved

- **GIVEN** an upcoming event E on the page
- **WHEN** the page's list loads again with new dates for E
- **THEN** E shows once, at the new dates, whatever the past events route's list has for it

#### Scenario: The backend never answers

- **GIVEN** a call for the events list that the backend never answers
- **WHEN** 10 seconds have passed
- **THEN** every request that waited responds 502 with `no-store`, and the next request loads again

#### Scenario: Coming back within five minutes

- **GIVEN** a past list kept from before event E ended, and a new server list without E
- **WHEN** the visitor opens the page again
- **THEN** E is under Past once it has ended on their clock, and under Live & upcoming until then

#### Scenario: A page fails

- **GIVEN** the second page of the events list responds with an error
- **WHEN** the route is asked
- **THEN** it responds 502, and no partial list is kept

#### Scenario: Past events fail to load

- **GIVEN** the route fails
- **WHEN** a visitor opens `/events/all`
- **THEN** Live & upcoming works as before, the Past tab has no count, and Calendar shows the upcoming events
- **AND** under Past the page says the events couldn't load, with "Try again", which asks again

#### Scenario: Asked once

- **WHEN** a visitor opens `/events/all`, switches to Past, picks a year, opens the Calendar and comes back to the tab
- **THEN** `/api/events/past` was asked once

### Requirement: The page header

The page SHALL open with the title "Events", the description "Meetups and conferences across the Protocol Labs network.", and "Submit an event" (LAB-3420). The page SHALL NOT show "Open PL Events" or another link to the PL events app on any screen size, because the event data will move to LabOS (LAB-3420). On phones (below 640px) "Submit an event" SHALL sit on the right of the title's row (Polina, 2026-11-24). "Submit an event" SHALL lead where the production submit link leads today.

#### Scenario: No link to the PL events app

- **WHEN** a visitor opens `/events/all` on a phone or a wider screen
- **THEN** the header shows "Meetups and conferences across the Protocol Labs network."
- **AND** the page shows no "Open PL Events" link

#### Scenario: Submit an event

- **WHEN** a visitor presses "Submit an event"
- **THEN** they go to the same submit address as the current Events menu link

### Requirement: Near you shows events in the member's city

In List view with no filter applied (Polina's design, 2026-11-20; LAB-3375), a signed-in member whose profile has a location SHALL see "Near you in <city>" with up to 3 upcoming events in its city, soonest first, as picture tiles. On phones (below 640px) they SHALL look like the List's cards (Polina, 2026-11-24): the date, title, host, place and going line, with a 64px square picture on the right. They SHALL be swiped sideways, so the list stays within reach; for that the title keeps to two lines and the host and place to one. The location's most specific part is used: its city, else its metro area, region or country (a location may hold no city; a city-state such as Singapore is saved as a country only). If no upcoming event is in that place, the section SHALL NOT show; in its place one row SHALL say "No upcoming events near <place>. Browse other cities below, or change your location." with a "Change location" button (LAB-3394); on phones, which have no Browse by city, it SHALL say "Choose another city in Filters, or change your location." instead. A signed-in member whose profile has no location SHALL see, in the same place, one row: "See events near you. Add your location to your profile and we'll show what's coming up where you are." and an "Add location" button. Beside the "Near you in <city>" heading, "Change" SHALL be offered too. Signed-out visitors SHALL see none of these.

"Add location", "Change" and "Change location" SHALL open the "Your location" dialog (LAB-3394): the profile's own Location field (place search), the line "This also updates the location on your profile.", the profile field's PLAA warning for a member with PLAA access, and Cancel and Save. Save SHALL be possible only once a place is picked and the member's current profile has loaded (a failed load SHALL say so), and SHALL write the member's profile location as the profile's Location field writes it (city; region from the place's metro area; country), keeping every other profile field. After a save the page SHALL reload its data, so Near you follows the new place. A refused save SHALL keep the dialog open with an error. Focus SHALL move into the dialog on open and back to the button that opened it on close.

#### Scenario: Member in Lisbon

- **GIVEN** a signed-in member whose profile city is Lisbon, and 4 upcoming events in Lisbon
- **WHEN** they open `/events/all`
- **THEN** "Near you in Lisbon" shows the 3 soonest Lisbon events

#### Scenario: Member whose location has no city

- **GIVEN** a signed-in member whose profile location is the country "Slovenia", with no city, and no upcoming event there
- **WHEN** they open the page
- **THEN** the Add location row does not show
- **AND** the page shows "No upcoming events near Slovenia." with "Change location"

#### Scenario: City-state saved as a country

- **GIVEN** a signed-in member whose profile location is the country "Singapore", with no city, and an upcoming event in Singapore
- **WHEN** they open the page
- **THEN** the page shows "Near you in Singapore" with that event

#### Scenario: Member with no location

- **GIVEN** a signed-in member whose profile has no location
- **WHEN** they open `/events/all`
- **THEN** the page shows "See events near you." with "Add location"
- **AND** pressing "Add location" opens the "Your location" dialog

#### Scenario: Member changes their location from Near you

- **GIVEN** a signed-in member in Lisbon with upcoming Lisbon events, and upcoming events in Berlin
- **WHEN** they press "Change" beside "Near you in Lisbon", pick Berlin and press Save
- **THEN** their profile location is Berlin
- **AND** the page shows "Near you in Berlin"

#### Scenario: Near you belongs to the plain List

- **GIVEN** a signed-in member in Lisbon with upcoming Lisbon events
- **WHEN** they apply a filter or switch to Calendar or Map
- **THEN** neither "Near you in Lisbon" nor the Add location or no-events row shows

#### Scenario: A chosen city replaces Near you

- **GIVEN** a signed-in member in Lisbon
- **WHEN** they choose Dubai in Browse by city
- **THEN** the Dubai city header shows and Near you does not

#### Scenario: Signed out

- **WHEN** a signed-out visitor opens `/events/all`
- **THEN** none of Near you, the Add location row or the no-events row shows

### Requirement: Browse by city scopes the page to one city

From 640px up, List view SHALL show "Browse by city" under the toolbar with the 5 cities that have the most upcoming events, each with its name and count. When there are more cities, "All N cities" SHALL show the rest in place, and "Show fewer" SHALL hide them again. On phones (below 640px) it SHALL NOT show: a city is chosen in Filters (LAB-3391). Choosing a city SHALL scope the page to it: in List, a city header with "← All cities", the city's name, its event count ("3 live & upcoming events", LAB-3425), its date range and its time zone, in place of Near you and Browse by city; every view SHALL show only that city's events. Under the List's bands, the dated list SHALL have the heading "All live & upcoming" (LAB-3425), or "Matching events" while a filter is applied. Calendar and Map SHALL show neither Near you, Browse by city nor the city header (LAB-3375): a chosen city SHALL show there as a removable chip. The city tile and the City filter SHALL be the same selection. The word "Gatherings" SHALL NOT appear on the page.

#### Scenario: Phones have no Browse by city

- **GIVEN** a screen narrower than 640px
- **WHEN** a visitor opens List view
- **THEN** Browse by city does not show
- **AND** they can choose a city in Filters

#### Scenario: Choosing a city

- **GIVEN** upcoming events in 7 cities
- **WHEN** a visitor presses "All 7 cities" and then "Dubai"
- **THEN** the page shows the Dubai header and only Dubai events
- **AND** with one event there, the header's count reads "1 live & upcoming event"
- **AND** the City filter shows Dubai as applied

#### Scenario: Leaving the city

- **GIVEN** the page is scoped to Dubai
- **WHEN** the visitor presses "← All cities"
- **THEN** every city's events show again and the City filter is cleared

### Requirement: The toolbar and filters

A toolbar, right under the page header (Polina's design, 2026-11-20; LAB-3374), SHALL show what the view shows, a Filters button and the view switch List · Calendar · Map, offering only the views this build has (no switch while there is one). In List and Map it SHALL start with the tabs Live & upcoming | Past, each with the number of its events that match (LAB-3418, see below); in Calendar with "Coming up" ("Coming up in <city>" when one is chosen) and the number of live and upcoming events that match. The tabs, the view switch, and Week | Month in the Calendar, SHALL look like the design system's enclosed tabs (LAB-3425): a grey track, 34px tall, of 26px tabs with 4px between them, the active one white. The view switch's track SHALL be darker than the page's grey; Week | Month SHALL keep the design system's track colour, on the white calendar card. Both SHALL be tab lists to assistive technology, each tab SHALL be reachable with the keyboard and SHALL show its focus, and no tab's label SHALL wrap. On desktop and tablet the toolbar SHALL stay in view under the navbar while the events scroll. The filter rail SHALL be closed by default. The Filters button SHALL open it and show the number of applied filters. The rail SHALL have a control that closes it and "Clear All". While the rail is closed, each applied filter SHALL show as a removable chip under the toolbar. The filters SHALL be, in this order: search (event name, host, city, focus area name or topic), "Events I'm going to" (signed-in members only), Mode (In person, Online, Hybrid; LAB-3370), Access type (RSVP, Paid, Invite only; the address keeps `access=Free` for RSVP, so links and embeds made before LAB-3407 still work), Focus area (the event's focus areas, by name; the address keeps the code, `focus=FA4`), Topic (every other tag; LAB-3404), City and Host (any of the event's hosts). Topic and Host SHALL have a search box. Values within one filter SHALL match any (OR); different filters SHALL all apply (AND). A filter list with fewer than 2 values in the loaded events SHALL NOT show, unless it is applied; so Access type, Focus area, Topic and Host stay hidden while the events carry no details. A Featured filter SHALL NOT show until the events data says which events are featured. Filters and the view SHALL be kept in the page address, so a copied link reopens the same view and filters, and switching view SHALL keep the filters. On phones the filters SHALL open as a bottom sheet from a Filters button.

#### Scenario: Filter survives a view switch

- **GIVEN** the Mode filter set to Online
- **WHEN** the visitor switches from List to Calendar
- **THEN** the calendar shows only online events and the Mode chip stays

#### Scenario: Removing a chip

- **GIVEN** the rail is closed with the chips "Hybrid", "Dubai" and "Lisbon"
- **WHEN** the visitor removes "Dubai"
- **THEN** the hybrid events in Lisbon show, and the Filters button reads 2

#### Scenario: Filter by host

- **GIVEN** upcoming events hosted by Protocol Labs and by Filecoin Foundation
- **WHEN** the visitor picks Host "Protocol Labs"
- **THEN** only the events Protocol Labs hosts or co-hosts show, with a "Protocol Labs" chip

#### Scenario: Filter by focus area

- **GIVEN** upcoming events tagged `FA3` and `FA4`
- **WHEN** the visitor picks Focus area "Neurotech"
- **THEN** only the events tagged `FA4` show, with a "Neurotech" chip, and the address has `focus=FA4`

#### Scenario: No details yet

- **GIVEN** upcoming events whose access, tags and hosts are all empty
- **WHEN** the visitor opens the rail
- **THEN** it shows no Access type, Focus area, Topic or Host section

#### Scenario: Events I'm going to

- **GIVEN** a signed-in member going to 2 upcoming events
- **WHEN** they turn on "Events I'm going to"
- **THEN** the page shows those 2 events only

#### Scenario: Nothing matches

- **GIVEN** filters that match no event
- **WHEN** the view loads
- **THEN** it says "No live or upcoming events match" and offers "Show all events", which clears every filter and keeps the view and an open event

#### Scenario: Events fail to load

- **GIVEN** the upcoming events request fails
- **WHEN** a visitor opens `/events/all`
- **THEN** the header stays, and the page says the events couldn't load, with "Try again"

### Requirement: Live & upcoming and Past

In List and Map the toolbar SHALL start with the tabs "Live & upcoming" and "Past" (LAB-3418, Polina's design on LAB-3424), in the view switch's style, each with its count in the design system's badge. Live & upcoming SHALL be the default; `?when=past` in the address SHALL open Past. `when` is not a filter: it SHALL NOT count as one, show a chip or be cleared with the filters, and it SHALL mean nothing in Calendar. Both counts SHALL follow the filters, whichever tab is on. Until past events have loaded, and when they fail to, Past SHALL have no count. Switching tabs SHALL change only what is under the toolbar: the toolbar's controls SHALL NOT move, nor when the count comes. The filters' options and their counts SHALL come from the events of the tab on show. Below 640px the tabs SHALL fill the row in equal halves, and their labels SHALL NOT wrap; the year and Embed SHALL be on the row under them, on every tab. Back and Forward SHALL bring back the tab of that address, and a tab chosen after them SHALL be in the address again.

#### Scenario: Switch to Past

- **GIVEN** 4 live and upcoming events and 577 past ones
- **WHEN** a visitor opens `/events/all` and presses "Past 577"
- **THEN** the past events show, the address has `when=past`, and the toolbar has not moved

#### Scenario: Counts follow the filters

- **GIVEN** no upcoming and 2 past events in Paris
- **WHEN** the visitor filters by Paris
- **THEN** the tabs read "Live & upcoming 0" and "Past 2"

#### Scenario: Clearing the filters keeps Past

- **GIVEN** `/events/all?when=past&mode=Online`
- **WHEN** the visitor presses "Show all events" or "Clear all"
- **THEN** every past event shows, and the address still has `when=past`

#### Scenario: Past, Back, Past

- **GIVEN** a visitor who pressed Past, then Back
- **WHEN** they press Past again
- **THEN** the address has `when=past`

#### Scenario: Calendar has no tabs

- **GIVEN** `/events/all?when=past&view=calendar`
- **WHEN** the visitor opens it
- **THEN** the toolbar reads "Coming up" with the number of live and upcoming events

### Requirement: The Past list

Past SHALL list ended events newest first, by first day and then by start, each under its first day (LAB-3418). A date outside the current year SHALL carry its year ("Nov 12, 2025"), in the list, the city header, the map and its lists. Past SHALL have no Near you, Add location, Browse by city or list heading. A chosen city SHALL keep its header, with "N past events", their span ("Dec 30, 2025 – Jan 3, 2026" over New Year) and the newest one's time zone. A card SHALL read "N went" in place of "N going", and "Went" in place of the viewer's "Going", and SHALL have no access note and no Live pill; an event that hides its attendance SHALL show no count. Map SHALL show past events with the same pins and lists, newest first, and "you went". With no match Past SHALL say "No past events match" and "Try another search or filter, or see every past event.", with "Show all events".

The events the viewer went to SHALL be those of `GET /v1/members/:uid/events?group=past`, 50 a call, every page, and those they were going to that have just ended. They SHALL be asked for a signed-in member only, once Past is shown or "Events I'm going to" is on, and never in the embed. "Events I'm going to" SHALL narrow Past to them, and both counts SHALL follow it on either tab. A change of the viewer's answer SHALL NOT move a past event's count.

#### Scenario: Newest first across a year

- **GIVEN** today is November 25, 2030, and past events on November 12, 2030, January 2, 2030, and December 30, 2029 to January 3, 2030
- **WHEN** a visitor opens Past
- **THEN** they are listed under "Nov 12", "Jan 2" and "Dec 30, 2029", in that order

#### Scenario: The viewer went

- **GIVEN** a signed-in member who went to event A
- **WHEN** they open Past
- **THEN** A's card reads "Went"
- **AND** a signed-out visitor's browser asks for no member's events

#### Scenario: A city's past events

- **GIVEN** 2 past events in Paris
- **WHEN** a visitor opens `/events/all?when=past&city=Paris`
- **THEN** the header reads "2 past events", their span and Paris's time zone

#### Scenario: No past event matches

- **GIVEN** a search no past event matches
- **WHEN** the visitor is on Past
- **THEN** it says "No past events match", and "Show all events" clears the filters and the year and stays on Past, so it always leads to a list when there are past events

### Requirement: Past's year

When past events span more than one year, Past SHALL show a dropdown right after the tabs, in List and Map (LAB-3418, Polina's design on LAB-3424): "All years", then each year with a past event, newest first, whatever the filters. An event's year SHALL be that of its first day. `?year=2025` SHALL narrow the List, the Map, the Past count, the city header, the drawer's previous and next, and the embed. The filters' options and their counts SHALL be those of that year; a value already picked SHALL stay listed when the year has none of it. The year is not a filter: it SHALL NOT count as one or be cleared by "Clear all"; "Show all events" SHALL clear it. It SHALL mean nothing on Live & upcoming and in Calendar, stay in the address there, and apply again on Past. A value that is not 4 digits SHALL be ignored. A year with no past event SHALL show Past's empty state, and be listed in the dropdown while it is the one picked. Picking a year SHALL ask for nothing. The dropdown SHALL look like the Filters button, have the name "Year: <choice>" and show its focus.

#### Scenario: Pick a year

- **GIVEN** past events in 2026 and 2025
- **WHEN** the visitor picks 2025
- **THEN** only the events whose first day is in 2025 show, the Past count is theirs, and the address has `year=2025`

#### Scenario: An event over New Year

- **GIVEN** a past event from December 30, 2029 to January 3, 2030
- **WHEN** the visitor opens `?when=past&year=2029`
- **THEN** it is listed
- **AND** it is not under `year=2030`

#### Scenario: One year only

- **GIVEN** every past event is of 2026
- **WHEN** the visitor opens Past
- **THEN** there is no year dropdown

#### Scenario: The filters don't narrow the years

- **GIVEN** past events in 2026 and 2025, and a search that matches none of 2025
- **WHEN** the visitor opens the dropdown on `year=2025`
- **THEN** it lists All years, 2026 and 2025, and reads 2025
- **AND** "Clear all" keeps the year

#### Scenario: An invalid year and an empty one

- **WHEN** the visitor opens `?when=past&year=20255`
- **THEN** every past event shows and the dropdown reads "All years"
- **AND** `?when=past&year=1999` shows "No past events match", with 1999 picked

#### Scenario: A year with no event leads out

- **GIVEN** `?when=past&year=2019`, with no past event in 2019 and no filter
- **WHEN** the visitor presses "Show all events"
- **THEN** every past event shows and the address has no `year`

#### Scenario: The filters' options are the year's

- **GIVEN** past events in Paris in 2025 and in Lisbon in 2026 only
- **WHEN** the visitor picks 2025
- **THEN** City lists Paris and not Lisbon, unless Lisbon was already picked

#### Scenario: Calendar ignores the year

- **WHEN** the visitor opens `?when=past&year=2025&view=calendar`
- **THEN** the Calendar shows the events of every year

### Requirement: The List view

The List view SHALL be the default. On Live & upcoming it SHALL group events by start day, soonest first. Each day SHALL have a date label (for example "Dec 3 / Thursday"), at the size of a card's time line, that stays in view while its events scroll. From 1200px the cards SHALL end at the right edge of the 4th "Browse by city" tile; below 1200px, where that row has 3 tiles, they SHALL fill the width (LAB-3425). The loading state SHALL have the same width. Each card SHALL show: the start time in the event's time zone with its UTC offset, and "Day n of m" for a multi-day event; the title; the host when known; the place ("Online" for an online event, the city with "also online" for a hybrid one); the going count with up to 3 faces when the event shows attendance; and the picture. On phones the date SHALL sit above its cards.

#### Scenario: Multi-day event

- **GIVEN** an event on Dec 3–4 starting 9:00 in Asia/Kolkata
- **WHEN** the visitor opens the List view
- **THEN** its card under Dec 3 reads "9:00 AM UTC+5:30 · Day 1 of 2"

#### Scenario: The cards line up with the city tiles

- **GIVEN** a 1440px screen and events in 5 cities or more
- **WHEN** the visitor opens the List view
- **THEN** the event cards end where the 4th city tile ends
- **AND** on a 1024px screen they fill the width

#### Scenario: Online event

- **GIVEN** an online event
- **THEN** its card's place reads "Online"

### Requirement: An event under way reads Live

On the All Events page and in its embed, a green "Live" pill SHALL start the time line of a List card and of a Near you tile while the event is under way (LAB-3425, Polina's design on LAB-3424). An event that lasts 24 hours or less SHALL be live from its start until it ends, also when it crosses midnight. A longer event SHALL be live on every day of its span: from midnight of its first day, in its own time zone, until it ends; where the browser does not know that zone, from its start. An event that has ended SHALL NOT be live. The viewer's time zone SHALL NOT matter. The pill SHALL be in the server's HTML, and SHALL appear and go within a minute of the event's start and end while the page stays open, with no reload; at its end the event moves to Past (LAB-3418). On a narrow card the time SHALL wrap beside the pill and stay whole. Calendar and Map SHALL show no Live pill.

#### Scenario: Event longer than 24 hours

- **GIVEN** an event on Dec 3–5 in Asia/Kolkata, 9:00 AM to 6:00 PM
- **WHEN** it is 1:00 AM on Dec 3, or any time on Dec 4, in Kolkata
- **THEN** its card reads Live
- **AND** from 6:00 PM on Dec 5 there it does not

#### Scenario: Event of 24 hours or less

- **GIVEN** an event on Dec 3, 6:00–9:00 PM in New York, and a viewer in Tokyo
- **WHEN** it is 7:00 PM in New York, already Dec 4 in Tokyo
- **THEN** the event's card reads Live
- **AND** at 5:59 PM and at 9:00 PM in New York it does not

#### Scenario: Evening event that ends after midnight

- **GIVEN** an event from 10:00 PM on Dec 3 to 1:00 AM on Dec 4 in New York
- **WHEN** it is 9:00 AM on Dec 3 in New York
- **THEN** its card does not read Live
- **AND** from 10:00 PM until 1:00 AM it does

#### Scenario: The page stays open

- **GIVEN** the List view open at 5:58 PM, with an event that starts at 6:00 PM
- **WHEN** it is 6:00 PM
- **THEN** the event's card shows the Live pill with no reload

### Requirement: The Calendar view

The Calendar view SHALL have Week and Month. Month SHALL be the default on screens 960px wide and wider, and Week below 960px (LAB-3353). A mode the visitor picks SHALL be kept in the address (`cal=week` or `cal=month`) and SHALL win over the screen width. Weeks SHALL start on Monday, and every event SHALL sit on its days in its own time zone. In Week and in Month, every day before today SHALL be greyed, today marked. Week SHALL show one column per day of the week. An event that runs several days SHALL be one card across its days. One-day events SHALL stack in their day's column, earliest first, each card showing title, its first topic with "+n" for the rest when it has topics, its start and end time ("6:00 PM – 9:00 PM"), and the place and zone in the event's time zone ("Lisbon · UTC+0", "Lisbon · also online · UTC+0", "Online · UTC+0"). A Week card SHALL show up to 3 faces and "N going" when the event shows attendance and someone is going. A week with no matching event SHALL say "Nothing this week." On phones the cards SHALL stack by day, and empty days SHALL be skipped. Month SHALL show the month grid with a bar per event per week. Pressing a day number in Month SHALL open that week in Week, and switching to Month SHALL show the month of the week in view. Previous and next controls SHALL move by one week or one month, and "Today" SHALL return to the current week or month. Past days SHALL show the events that have ended, under the same filters, as soon as past events have loaded (LAB-3418); a Week card of one reads "N went", and "Went" when the page knows the viewer went. In the embed, Calendar SHALL show the live and upcoming events only, as before. With no live, upcoming or past match the view SHALL show the empty state. The calendar SHALL open on the linked event's week, else the chosen city's first event, else today's week or month, even when that week or month has no event. It SHALL NOT move when the event it opened on ends, nor, once the visitor has moved it, when a linked past event comes (LAB-3418).

#### Scenario: Day number opens its week

- **GIVEN** the Month view of December
- **WHEN** the visitor presses 10
- **THEN** the Week view opens on the week that holds December 10

#### Scenario: Quiet week

- **GIVEN** a week with no matching event
- **WHEN** the visitor moves to it in Week
- **THEN** the board says "Nothing this week." and "Next week" still moves on

#### Scenario: Event across days

- **GIVEN** an event from Monday to Wednesday
- **WHEN** the visitor opens that week
- **THEN** the event shows as one card spanning Monday to Wednesday

#### Scenario: Default mode by screen width

- **GIVEN** a visitor opens `/events/all?view=calendar` with no `cal`
- **WHEN** the screen is 1280px wide
- **THEN** Month opens on the current month
- **AND** on a 390px phone, Week opens on the current week

#### Scenario: Past days

- **GIVEN** events in October of last year
- **WHEN** the visitor opens the Calendar in Month and steps back to that month
- **THEN** its days show those events, and nothing more was asked for

#### Scenario: A linked past event comes late

- **GIVEN** `?view=calendar&event=<a past event>`, before past events have loaded
- **WHEN** the visitor steps to another month and past events then load
- **THEN** that month stays; without the step, the calendar opens on the event

#### Scenario: Opens on today

- **GIVEN** today is Friday November 20 and the next matching event is on December 3
- **WHEN** the visitor opens the Calendar view
- **THEN** it shows November (or the week of November 16), with November 16–19 greyed

### Requirement: The Map view

When a Maps key is configured, the Map view SHALL show a street map. Zoomed out (below zoom 9), it SHALL show one pin per city that has matching in-person or hybrid events, labelled with the city's count; pressing a city pin SHALL zoom the map into that city (LAB-3353). From zoom 9 in, every matching in-person or hybrid event SHALL have its own round pin with its picture (or the event placeholder), and a city's event pins SHALL sit around the city's point without covering one another. Pressing an event pin SHALL open its drawer. An event pin SHALL have a green ring when the viewer is going and a brand ring when it is the linked or opened event, drawn on top. "Show all" SHALL fit every city. The map SHALL zoom with the mouse wheel or trackpad, the + and − buttons, and, on wider screens, a slider. The page SHALL NOT scroll while the pointer is over the map. Online events SHALL be listed under the map, and so SHALL in-person events whose city has no known position ("Not on the map"), so no matching event is missing from the view; each row SHALL show up to 3 faces and "N going" like a Week card. A city pin holding an event the viewer is going to SHALL be marked. If the map can't load, it SHALL say so and offer "Try again"; the lists under it still show. Without a Maps key, the view switch SHALL NOT offer Map.

#### Scenario: City pin with several events

- **GIVEN** 3 matching events in Dubai, and the map zoomed out
- **WHEN** the visitor presses the Dubai pin
- **THEN** the map zooms into Dubai, and the 3 events show as 3 picture pins around it
- **AND** pressing one opens its drawer

#### Scenario: Link to one event in Map

- **GIVEN** 3 matching events in Dubai, one of them event A
- **WHEN** a visitor opens `/events/all?view=map&event=<A's uid>`
- **THEN** the map is zoomed into Dubai on its 3 event pins, with A's pin in the brand ring
- **AND** the drawer is open on A

#### Scenario: City with no known position

- **GIVEN** a matching in-person event in a city the locations list has no position for
- **WHEN** the visitor opens the Map view
- **THEN** the event is listed under the map in "Not on the map"

#### Scenario: No Maps key

- **GIVEN** the build has no Maps key
- **WHEN** a visitor opens `/events/all`
- **THEN** the view switch shows List and Calendar only
- **AND** `?view=map` opens the List view

### Requirement: Every event opens the drawer, and a link opens one event

Pressing an event in any view or in Near you SHALL open the event drawer for that event. Opening `/events/all?event=<uid>` SHALL open the page with that event's drawer open and the event marked in the active view: its list card, its calendar card on its own week, or its event pin, with the map zoomed into its city. Closing the drawer SHALL remove `event` from the address. An unknown uid SHALL open the drawer's "no longer available" state.

The drawer's previous and next SHALL step through the events the page shows under the current filters, in the List's order (by list day, then start time), whichever view is open (LAB-3361). On Past they SHALL follow Past's order, newest first, narrowed to its year; in Calendar the past events come first, oldest first, then the List's order (LAB-3418). Stepping SHALL replace the event in the open drawer and the `event` in the address, without closing and reopening the drawer. Previous SHALL be disabled on the first event and next on the last. Other pages that open the drawer SHALL show no previous or next.

#### Scenario: Next event

- **GIVEN** the List shows events A, B and C in that order
- **WHEN** a visitor opens B and presses next
- **THEN** the drawer shows C and the address has `event=<C's uid>`
- **AND** previous then shows B again

#### Scenario: Link to one event in Calendar

- **GIVEN** an event on January 12
- **WHEN** a visitor opens `/events/all?view=calendar&event=<its uid>`
- **THEN** the Week view opens on the week of January 12 with that card marked
- **AND** the drawer is open on that event

### Requirement: Embed opens a dialog with the link and the code

The toolbar on `/events/all` SHALL show an "Embed" button with a `</>` glyph, styled like the Filters button, after the List / Calendar / Map switch, in every view and at every width (LAB-3352). A press SHALL open the dialog "Embed these events" in the standard modal shell (LAB-3365, Polina's design on LAB-3352) and copy nothing. It embeds what the page shows, one link `<origin>/events/embed` with the active `view`, the calendar mode on show as `cal` (also when the address has none), `when=past` and its `year` while Past is on show (LAB-3418), and each applied filter of search, Mode, Access type, Focus area, Topic, City and Host, under the page address's own keys. The link SHALL NOT carry "Events I'm going to" (`going`), the open event (`event`) or any other parameter, except `details=labos` when the host ticks "Open event details on LabOS" (LAB-3392).

The dialog SHALL show:

- under the title, what the embed shows: "List view", "Week calendar", "Month calendar" or "Map view", then each applied filter's chip label (the search text in curly quotes), joined by " · ", or with none "All live & upcoming events" (LAB-3425), on Past "All past events" (LAB-3418);
- a live preview: `/events/embed` with that query, 320px high, loaded only while the dialog is open;
- "Embed code": one line, `<iframe src="<link>" width="100%" height="640" style="border: 1px solid #e2e8f0; border-radius: 12px;" title="<title>" allow="clipboard-write" loading="lazy"></iframe>`, whose title is "Protocol Labs events: " and the filter labels joined by " · ", or "Protocol Labs events" with none; `&`, `"` and `<` escaped; with the line "New events that match appear on their own. Change height to fit your page.";
- the checkbox "Open event details on LabOS", unticked whenever the dialog opens, with the line "In a new tab. Otherwise they open inside the embed, with a link to RSVP on LabOS." Ticked, the preview, the code and the copied link SHALL end with `details=labos` (LAB-3392);
- Copy link (a text button, left) and Copy code (primary, right). Each copies its text and reads "Link copied" / "Code copied" for 2 seconds; a second press starts the 2 seconds again. When the browser refuses the clipboard, a toast SHALL say "Could not copy the link" / "Could not copy the code", the button SHALL keep its label and nothing SHALL be recorded.

Escape, Close and the backdrop SHALL close the dialog, focus SHALL go back to the Embed button, and the page SHALL keep its view and filters.

#### Scenario: Embed the month calendar of Lisbon

- **GIVEN** a visitor on `/events/all?view=calendar&cal=month&city=Lisbon`
- **WHEN** they press Embed
- **THEN** the dialog reads "Month calendar · Lisbon" and previews `/events/embed?view=calendar&cal=month&city=Lisbon`
- **AND** its code has that link and `title="Protocol Labs events: Lisbon"`

#### Scenario: Embed a year of past events

- **GIVEN** a visitor on `/events/all?when=past&year=2025`
- **WHEN** they press Embed
- **THEN** the dialog reads "List view · All past events" and previews `/events/embed?when=past&year=2025`
- **AND** on Live & upcoming, and in Calendar, the link has neither `when` nor `year`

#### Scenario: Copy the link to the map of online events

- **GIVEN** a visitor on `/events/all?view=map&mode=Online&going=true`
- **WHEN** they press Embed, then Copy link
- **THEN** the clipboard holds `<origin>/events/embed?view=map&mode=Online` and the button reads "Link copied" for 2 seconds

### Requirement: The embed shows one view for other sites

`/events/embed` SHALL show only the view and filters in its address, on the page's grey, for anyone, signed in or not, with no member data: no Near you, no Add location, no "Events I'm going to", no Going marks (LAB-3352). Under the view it SHALL show the link "All events on PL Directory ↗", which opens `/events/all` with the same view and filters (not the open event) in a new tab. It SHALL NOT show the site header, the mobile bottom bar, the feedback button, contact support, the rating prompts, the page header ("Submit an event", the events app link), Browse by city, the city header, the toolbar (the tabs and their counts, the year, Filters, the view switch, Embed), the filters or the applied-filter chips (Polina's design, 2026-11-20): the person embedding it chose the view and filters. Pressing an event SHALL open its drawer inside the embed (LAB-3392): the same drawer as the page, with previous / next through the events on show, read signed out whoever is signed in. In the embed the drawer SHALL NOT ask to sign in or offer "Yes, I'm going": its card and pinned bar SHALL offer "RSVP on LabOS ↗", which opens `/events/all?event=<uid>` in a new tab, and "N members going" SHALL be text that opens nothing; an event that has ended shows the ended card, with no "RSVP on LabOS" (LAB-3426). Opening, stepping and closing the drawer SHALL leave the embed's address and the framing page's history alone, and closing it SHALL leave the view and filters as they were. With `details=labos` in its address, pressing an event SHALL instead open `/events/all?event=<uid>` in a new tab, with no drawer. The embed SHALL NOT open a drawer for `event` in its own address. With no match it SHALL show the page's empty state, and when the events fail to load the page's error state. It SHALL be served only while the native page flag is on (else not found), and SHALL NOT be indexed. Any https site (and LabOS itself) may frame it (see the runtime platform's security headers).

#### Scenario: plrd.org frames online events

- **GIVEN** a plrd.org page with an iframe on `/events/embed?view=map&mode=Online`
- **WHEN** the page loads
- **THEN** the iframe shows the map with only online events, without the LabOS header, "Submit an event" or the toolbar
- **AND** under the map, "All events on PL Directory ↗" links to `/events/all?view=map&mode=Online`
- **WHEN** the reader presses an event
- **THEN** its drawer opens inside the iframe, with "RSVP on LabOS ↗" in place of "Yes, I'm going"
- **WHEN** they close it
- **THEN** the iframe still shows the map with only online events

#### Scenario: An embed of past events

- **GIVEN** an iframe on `/events/embed?when=past`
- **WHEN** the page loads
- **THEN** it shows the past events, newest first, and links to `/events/all?when=past`
- **AND** an embed made before LAB-3418 shows what it showed, its Calendar too, and asks for no past events

#### Scenario: A host sends events to LabOS

- **GIVEN** an iframe on `/events/embed?view=calendar&details=labos`
- **WHEN** the reader presses an event
- **THEN** that event opens on LabOS in a new tab, with its drawer open, and the embed opens no drawer

### Requirement: One Going mark on the page

On the All Events page, an event the signed-in viewer is going to SHALL carry one "Going" pill: a green pill with a white tick and the word "Going", on its List card, Near you tile, Week card and map row. A Month bar is too small for the pill and SHALL carry no going mark; the "Events I'm going to" filter lists those events. On the map, the city pin is marked and the event pin has a green ring instead. No other going mark (badge or tick) SHALL appear on the page. When the viewer says they are going, or no longer going, the event's "N going" on the page SHALL move by one at once, though the page's list of events is cached. Once an event has ended its pill SHALL read "Went" (LAB-3418).

#### Scenario: Going event in the list

- **GIVEN** a signed-in member going to event A
- **WHEN** they open the List view
- **THEN** A's card shows the Going pill

### Requirement: All Events analytics

The page SHALL record these PostHog events:

- `event-drawer-opened` with `source` = `all-events` when the drawer opens from the page, and `embed` when it opens inside `/events/embed` (LAB-3392);
- `events-view-changed` with `view` (`list`, `calendar` or `map`) and, for the calendar, `mode` (`week` or `month`);
- `events-when-changed` with `when` (`upcoming` or `past`) and `view`, when the visitor switches tabs (LAB-3418);
- `events-year-changed` with `year` (`2025`, or `all`) and `view`, when the visitor picks a year on Past (LAB-3418);
- `events-filters-applied` with the filter `key` (`search`, `going`, `mode` or `city`) and its `values`, for every filter change whichever control made it (the rail, a chip, a city tile, "Clear all"), once that filter has been still for 300ms; "Clear all" records each filter it empties, with no values;
- `events-city-selected` with `city` and `from` (`tile`, `filter` or `near-you`), in addition, whenever a single city is chosen.
- `events-location-dialog-opened` with `from` (`add`, `change` or `no-events`), when a Near you row opens the "Your location" dialog, and `events-location-saved` with the same `from` when a location is saved there (LAB-3394);
- `events-embed-link-copied` with `view`, `filters_count` (the applied values the link carries) and `details` (`embed`, or `labos` when ticked, LAB-3392), when Copy link in the Embed dialog copies the link (LAB-3352, LAB-3365);
- `events-embed-code-copied` with `view`, `filters_count` and `details`, when Copy code copies the iframe code (LAB-3365);
- `events-embed-viewed` with the `view` it opened on, `referrer_host` (the framing site's host, or null) and `details` (`embed` or `labos`), once per load of `/events/embed`, but not for the Embed dialog's preview, where LabOS frames itself (LAB-3365).

No filter event SHALL be recorded for filters read from the address on landing, and a later change to another param (the view, the open event) SHALL NOT cancel a pending filter event.

#### Scenario: Opening an event from the list

- **WHEN** a visitor opens event A from the List view
- **THEN** `event-drawer-opened` is recorded with `event_uid` = A's uid and `source` = `all-events`

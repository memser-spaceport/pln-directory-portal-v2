# Spec Delta

## ADDED Requirements

### Requirement: The All Events page is native behind a flag

When the build flag `NEXT_PUBLIC_SHOW_EVENTS_PAGE_V2` is `true`, `/events/all` SHALL render the All Events page in LabOS, with no iframe. With the flag off, `/events/all` SHALL show the events app iframe exactly as before. The page SHALL be open to signed-out visitors, as before. It SHALL show upcoming events only: events that have not ended.

#### Scenario: Flag off

- **GIVEN** the build has `NEXT_PUBLIC_SHOW_EVENTS_PAGE_V2` unset
- **WHEN** a visitor opens `/events/all`
- **THEN** the page shows the events app in an iframe, as before

#### Scenario: Flag on

- **GIVEN** the build has `NEXT_PUBLIC_SHOW_EVENTS_PAGE_V2=true`
- **WHEN** a visitor opens `/events/all`
- **THEN** the page shows the header, Browse by city, the Coming up toolbar and the List view
- **AND** no iframe loads

#### Scenario: Past events are not listed

- **GIVEN** an event that ended yesterday and one that starts tomorrow
- **WHEN** a visitor opens `/events/all`
- **THEN** only the event that starts tomorrow is listed

### Requirement: The page header

The page SHALL open with the title "Events", one line of description, a link "Open PL Events" to the events app (new tab), and "Submit an event". "Submit an event" SHALL lead where the production submit link leads today.

#### Scenario: Submit an event

- **WHEN** a visitor presses "Submit an event"
- **THEN** they go to the same submit address as the current Events menu link

### Requirement: Near you shows events in the member's city

On a plain landing (List view, no filter, no city scope), a signed-in member whose profile has a city SHALL see "Near you in <city>" with up to 3 upcoming events in that city, soonest first, as picture tiles. If no upcoming event is in that city, the section SHALL NOT show. A signed-in member whose profile has no location SHALL see, in the same place, one row: "See events near you. Add your location to your profile and we'll show what's coming up where you are." and an "Add location" button that opens their profile. Signed-out visitors SHALL see neither.

#### Scenario: Member in Lisbon

- **GIVEN** a signed-in member whose profile city is Lisbon, and 4 upcoming events in Lisbon
- **WHEN** they open `/events/all`
- **THEN** "Near you in Lisbon" shows the 3 soonest Lisbon events

#### Scenario: Member with no location

- **GIVEN** a signed-in member whose profile has no location
- **WHEN** they open `/events/all`
- **THEN** the page shows "See events near you." with "Add location"
- **AND** pressing "Add location" opens their profile

#### Scenario: Filters hide Near you

- **GIVEN** a signed-in member in Lisbon with upcoming Lisbon events
- **WHEN** they apply any filter or switch to Calendar
- **THEN** Near you is not shown

#### Scenario: Signed out

- **WHEN** a signed-out visitor opens `/events/all`
- **THEN** neither Near you nor the Add location row shows

### Requirement: Browse by city scopes the page to one city

The page SHALL show "Browse by city" with the 5 cities that have the most upcoming events, each with its name and count. When there are more cities, "All N cities" SHALL show the rest in place, and "Show fewer" SHALL hide them again. Choosing a city SHALL scope the page to it: a city header with "← All cities", the city's name, its event count, its date range and its time zone, and every view showing only that city's events. The city tile and the City filter SHALL be the same selection. The word "Gatherings" SHALL NOT appear on the page.

#### Scenario: Choosing a city

- **GIVEN** upcoming events in 7 cities
- **WHEN** a visitor presses "All 7 cities" and then "Dubai"
- **THEN** the page shows the Dubai header and only Dubai events
- **AND** the City filter shows Dubai as applied

#### Scenario: Leaving the city

- **GIVEN** the page is scoped to Dubai
- **WHEN** the visitor presses "← All cities"
- **THEN** every city's events show again and the City filter is cleared

### Requirement: The Coming up toolbar and filters

A "Coming up" toolbar SHALL show the number of events that match, a Filters button and the view switch List · Calendar · Map, offering only the views this build has (no switch while there is one). On desktop and tablet it SHALL stay in view under the navbar while the events scroll. The filter rail SHALL be closed by default. The Filters button SHALL open it and show the number of applied filters. The rail SHALL have a control that closes it and "Clear All". While the rail is closed, each applied filter SHALL show as a removable chip under the toolbar. The filters SHALL be: search (event name, host, city or topic), City, Mode (In person, Virtual, Hybrid) and "Events I'm going to" (signed-in members only). A filter with no values in the data SHALL NOT show. Filters and the view SHALL be kept in the page address, so a copied link reopens the same view and filters, and switching view SHALL keep the filters. On phones the filters SHALL open as a bottom sheet from a Filters button.

#### Scenario: Filter survives a view switch

- **GIVEN** the Mode filter set to Virtual
- **WHEN** the visitor switches from List to Calendar
- **THEN** the calendar shows only online events and the Mode chip stays

#### Scenario: Removing a chip

- **GIVEN** the rail is closed with the chips "Hybrid", "Dubai" and "Lisbon"
- **WHEN** the visitor removes "Dubai"
- **THEN** the hybrid events in Lisbon show, and the Filters button reads 2

#### Scenario: Events I'm going to

- **GIVEN** a signed-in member going to 2 upcoming events
- **WHEN** they turn on "Events I'm going to"
- **THEN** the page shows those 2 events only

#### Scenario: Nothing matches

- **GIVEN** filters that match no event
- **WHEN** the view loads
- **THEN** it says no upcoming events match and offers "Show all events", which clears every filter and keeps the view and an open event

#### Scenario: Events fail to load

- **GIVEN** the upcoming events request fails
- **WHEN** a visitor opens `/events/all`
- **THEN** the header stays, and the page says the events couldn't load, with "Try again"

### Requirement: The List view

The List view SHALL be the default. It SHALL group events by start day, soonest first. Each day SHALL have a date label (for example "Dec 3 / Thursday") that stays in view while its events scroll. Each card SHALL show: the start time in the event's time zone with its UTC offset, and "Day n of m" for a multi-day event; the title; the host when known; the place ("Online" for an online event, the city with "also online" for a hybrid one); the going count with up to 3 faces when the event shows attendance; and the picture. On phones the date SHALL sit above its cards.

#### Scenario: Multi-day event

- **GIVEN** an event on Dec 3–4 starting 9:00 in Asia/Kolkata
- **WHEN** the visitor opens the List view
- **THEN** its card under Dec 3 reads "9:00 AM UTC+5:30 · Day 1 of 2"

#### Scenario: Online event

- **GIVEN** an online event
- **THEN** its card's place reads "Online"

### Requirement: The Calendar view

The Calendar view SHALL have Week (default) and Month. Week SHALL show one column per day of the week, today marked and past days dimmed. An event that runs several days SHALL be one card across its days. One-day events SHALL stack in their day's column, earliest first, each card showing title, time, and "city · UTC±n" in the event's time zone. On phones the cards SHALL stack by day, and empty days SHALL be skipped. Month SHALL show the month grid with a bar per event per week, today marked. Pressing a day number in Month SHALL open that week in Week. Previous and next controls SHALL move by one week or one month.

#### Scenario: Day number opens its week

- **GIVEN** the Month view of December
- **WHEN** the visitor presses 10
- **THEN** the Week view opens on the week that holds December 10

#### Scenario: Event across days

- **GIVEN** an event from Monday to Wednesday
- **WHEN** the visitor opens that week
- **THEN** the event shows as one card spanning Monday to Wednesday

### Requirement: The Map view

When a Maps key is configured, the Map view SHALL show a street map with one pin per city that has matching in-person or hybrid events, labelled with the city's count. "Show all" SHALL fit every pin. Pressing a pin with one event SHALL open the drawer. Pressing a pin with several events SHALL show a small card listing them, each opening the drawer. The map SHALL zoom with the mouse wheel or trackpad, the + and − buttons, and, on wider screens, a slider. The page SHALL NOT scroll while the pointer is over the map. Online events SHALL be listed under the map. A pin holding an event the viewer is going to SHALL be marked. Without a Maps key, the view switch SHALL NOT offer Map.

#### Scenario: City pin with several events

- **GIVEN** 3 matching events in Dubai
- **WHEN** the visitor presses the Dubai pin
- **THEN** a card lists the 3 events
- **AND** pressing one opens its drawer

#### Scenario: No Maps key

- **GIVEN** the build has no Maps key
- **WHEN** a visitor opens `/events/all`
- **THEN** the view switch shows List and Calendar only
- **AND** `?view=map` opens the List view

### Requirement: Every event opens the drawer, and a link opens one event

Pressing an event in any view or in Near you SHALL open the event drawer for that event. Opening `/events/all?event=<uid>` SHALL open the page with that event's drawer open and the event marked in the active view: its list card, its calendar card on its own week, or its map pin centred. Closing the drawer SHALL remove `event` from the address. An unknown uid SHALL open the drawer's "no longer available" state.

#### Scenario: Link to one event in Calendar

- **GIVEN** an event on January 12
- **WHEN** a visitor opens `/events/all?view=calendar&event=<its uid>`
- **THEN** the Week view opens on the week of January 12 with that card marked
- **AND** the drawer is open on that event

### Requirement: One Going mark on the page

On the All Events page, an event the signed-in viewer is going to SHALL carry one "Going" pill: a green pill with a white tick and the word "Going". No other going mark (badge or tick) SHALL appear on the page.

#### Scenario: Going event in the list

- **GIVEN** a signed-in member going to event A
- **WHEN** they open the List view
- **THEN** A's card shows the Going pill

### Requirement: All Events analytics

The page SHALL record these PostHog events:

- `event-drawer-opened` with `source` = `all-events` when the drawer opens from the page;
- `events-view-changed` with `view` (`list`, `calendar` or `map`) and, for the calendar, `mode` (`week` or `month`);
- `events-filters-applied` with the filter `key` and its `values`;
- `events-city-selected` with `city` and `from` (`tile`, `filter` or `near-you`).

#### Scenario: Opening an event from the list

- **WHEN** a visitor opens event A from the List view
- **THEN** `event-drawer-opened` is recorded with `event_uid` = A's uid and `source` = `all-events`

## MODIFIED Requirements

### Requirement: The drawer shows one event as the events app draws it

The drawer SHALL open on one event and show, top to bottom:

1. A Back bar.
2. "EVENT DETAILS".
3. The event's picture when it has one, title, and date line.
4. A place row: the address with its region for an in-person event, "Online" for an online event, and the address with "also online" for a hybrid event (LAB-3283).
5. The event's own page (for example its Luma page) when it has one, as a link under the place row (LAB-3271). The link SHALL open in a new tab. It SHALL show the address without `https://`. An event without a page, or whose page is not an `http` or `https` address, SHALL have no link row.
6. An access row when the access is known, with an icon and two lines: "Invite only / The hosts approve each guest", "Paid / Tickets on the host's site" or "Free / RSVP to save your spot" (LAB-3283). Mode and access SHALL NOT show as badges.
7. Tags, Host, Description and Agenda.

A block whose data is empty SHALL be left out rather than shown empty. On a narrow screen the drawer SHALL take the full width.

#### Scenario: Event with its own page

- **GIVEN** event A with the page `https://lu.ma/labweek-lisbon`
- **WHEN** a viewer opens event A
- **THEN** the drawer shows "lu.ma/labweek-lisbon" under the place row
- **AND** pressing it opens that page in a new tab

#### Scenario: Event without a page

- **GIVEN** event B without a page
- **WHEN** a viewer opens event B
- **THEN** the drawer shows no link row

#### Scenario: Event with agenda and tags

- **GIVEN** an upcoming in-person, free-with-RSVP event with two tags, one host, a description and a two-day agenda
- **WHEN** a member opens it
- **THEN** the drawer shows "EVENT DETAILS", the title, the date line, the address, "Free" with "RSVP to save your spot", both tags, the host, the description and both agenda days
- **AND** no mode or access badge

#### Scenario: Hybrid event

- **GIVEN** a hybrid event in Lisbon
- **WHEN** a viewer opens it
- **THEN** the place row reads the Lisbon address with "also online"

#### Scenario: Access unknown

- **GIVEN** an event whose access is not known
- **WHEN** a viewer opens it
- **THEN** the drawer shows no access row

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

### Requirement: The drawer shows the gathering and the event's attendees

The drawer SHALL show a going card before the agenda (LAB-3225) with up to three faces and "N members going" ("1 member going" for one). When the event has its own page, the card SHALL have "Register", which opens that page in a new tab. The drawer SHALL NOT show the event's gathering: no "<city> gathering" label, no gathering schedule link, no gathering resources (such as Telegram or shared notes) and no gathering event count (LAB-3283). The gathering stays behind the going card and the plans, which still save to it.

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

### Requirement: Event drawer analytics

The drawer SHALL record these PostHog events, each with `event_uid`:

- `event-drawer-opened`, with `source` (`home`, `member-profile`, `team-profile`, `add-event`, `digest` or `all-events`);
- `event-going-marked`, with `source`;
- `event-not-going-marked`, on "Mark as not going";
- `event-plans-saved`, with `roles`;
- `event-attendees-opened`.

#### Scenario: Going from Home

- **WHEN** a member opens event A from the Home rail and presses "Yes, I'm going"
- **THEN** `event-drawer-opened` is recorded with `source` = `home`
- **AND** `event-going-marked` is recorded with `event_uid` = A's uid and `source` = `home`

#### Scenario: Going from All Events

- **WHEN** a member opens event A on `/events/all` and presses "Yes, I'm going"
- **THEN** `event-going-marked` is recorded with `event_uid` = A's uid and `source` = `all-events`

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
2. "EVENT DETAILS".
3. The event's picture when it has one, title, and date line.
4. A place row: the address with its region for an in-person event, "Online" for an online event, and the address with "also online" for a hybrid event (LAB-3283). When the event has a map link (the events service's `location_url`) and an address, the place text and its arrow SHALL be one link that opens the map in a new tab, as on the PL events app (LAB-3324). An event without a map link, or whose map link is not an `http` or `https` address, SHALL show the place as plain text with no arrow. "Online" SHALL never link to a map.
5. The event's own page (for example its Luma page) when it has one, as a link under the place row (LAB-3271). The link SHALL open in a new tab. It SHALL show the address without `https://`. The row SHALL look like the date row (LAB-3333): a link icon in the calendar icon's size, stroke and colour, then the link text in the date's font size, weight, colour and spacing, with no arrow. The page SHALL be the event's `websiteUrl`. When `websiteUrl` is empty or not an `http` or `https` address, the page SHALL be the link of the event's resource named "Registration" (any case, end spaces ignored), and "Register" SHALL open the same page (LAB-3334). An event without a page, or whose page is not an `http` or `https` address, SHALL have no link row and no "Register".
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

#### Scenario: Event with a map link

- **GIVEN** event C with the map link `https://www.google.com/maps/search/?api=1&query=Lisbon`
- **WHEN** a viewer opens event C
- **THEN** the address and its arrow are one link to that map
- **AND** pressing it opens the map in a new tab

#### Scenario: Event without a map link

- **GIVEN** event D without a map link
- **WHEN** a viewer opens event D
- **THEN** the drawer shows the address as plain text with no arrow

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

### Requirement: The attendee list is for one event and searchable

The count SHALL open the list of that event's attendees above the drawer, titled "N going to <event>". It SHALL show the viewer first as "You" when they are going. Each other row SHALL show the member's photo, name, role and team, with a Host, Speaker or Sponsor tag when they have that role at this event. A row SHALL open that member's profile in a new tab.

A search box SHALL filter by name or team. With no match, the list SHALL say "Nobody going matches that search."

#### Scenario: Searching the list

- **GIVEN** an event with 40 attendees, three of them on the team "Lighthouse"
- **WHEN** the member opens "40 members going" and types "lighthouse"
- **THEN** the list shows those three members
- **AND** closing the list returns to the drawer

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

### Requirement: Members who cannot mark attendance see the event only

A signed-in member without permission to mark attendance SHALL see the event, the gathering links and the attendees in a "Who's going" card, and SHALL NOT see the question or any button that saves.

#### Scenario: Member without attendance permission

- **GIVEN** a signed-in member without `irlg.going.write` or directory admin
- **WHEN** they open an event
- **THEN** the drawer shows the event and "Who's going" with "N members going"
- **AND** there is no "Are you going?" question and no "Yes, I'm going" button

### Requirement: Signed-out visitors see the event and are asked to sign in

A signed-out visitor SHALL be able to open the drawer from Home (LAB-3271). The drawer SHALL show the event, the gathering links and a "Who's going" card, and "Yes, I'm going" in the sticky footer. "Yes, I'm going" and the people count SHALL close the drawer and open the sign-in modal on the same page. Nothing SHALL save.

#### Scenario: Signed out

- **GIVEN** a signed-out visitor on Home with the event drawer flag on
- **WHEN** they open event A and press "Yes, I'm going"
- **THEN** the drawer closes and the sign-in modal opens
- **AND** no attendance is saved

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

In every view (List, Calendar, Map) and with any filter applied, unless a city is chosen (the city header takes its place), a signed-in member whose profile has a location SHALL see "Near you in <city>" with up to 3 upcoming events in its city, soonest first, as picture tiles. The location's most specific part is used: its city, else its metro area, region or country (a location may hold no city; a city-state such as Singapore is saved as a country only). If no upcoming event is in that place, the section SHALL NOT show. A signed-in member whose profile has no location SHALL see, in the same place, one row: "See events near you. Add your location to your profile and we'll show what's coming up where you are." and an "Add location" button that opens their profile. Signed-out visitors SHALL see neither.

#### Scenario: Member in Lisbon

- **GIVEN** a signed-in member whose profile city is Lisbon, and 4 upcoming events in Lisbon
- **WHEN** they open `/events/all`
- **THEN** "Near you in Lisbon" shows the 3 soonest Lisbon events

#### Scenario: Member whose location has no city

- **GIVEN** a signed-in member whose profile location is the country "Slovenia", with no city
- **WHEN** they open the page
- **THEN** neither Near you nor the Add location row shows

#### Scenario: City-state saved as a country

- **GIVEN** a signed-in member whose profile location is the country "Singapore", with no city, and an upcoming event in Singapore
- **WHEN** they open the page
- **THEN** the page shows "Near you in Singapore" with that event

#### Scenario: Member with no location

- **GIVEN** a signed-in member whose profile has no location
- **WHEN** they open `/events/all`
- **THEN** the page shows "See events near you." with "Add location"
- **AND** pressing "Add location" opens their profile

#### Scenario: Near you stays across views and filters

- **GIVEN** a signed-in member in Lisbon with upcoming Lisbon events
- **WHEN** they apply a filter or switch to Calendar or Map
- **THEN** "Near you in Lisbon" still shows, with the same events

#### Scenario: A chosen city replaces Near you

- **GIVEN** a signed-in member in Lisbon
- **WHEN** they choose Dubai in Browse by city
- **THEN** the Dubai city header shows and Near you does not

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

A "Coming up" toolbar SHALL show the number of events that match, a Filters button and the view switch List · Calendar · Map, offering only the views this build has (no switch while there is one). On desktop and tablet it SHALL stay in view under the navbar while the events scroll. The filter rail SHALL be closed by default. The Filters button SHALL open it and show the number of applied filters. The rail SHALL have a control that closes it and "Clear All". While the rail is closed, each applied filter SHALL show as a removable chip under the toolbar. The filters SHALL be, in this order: search (event name, host, city or topic), "Events I'm going to" (signed-in members only), Mode (In person, Virtual, Hybrid), Access type (Free, Paid, Invite only: the words the cards and the drawer use), Focus area (the event's tags), City and Host (any of the event's hosts). Focus area and Host SHALL have a search box. Values within one filter SHALL match any (OR); different filters SHALL all apply (AND). A filter list with fewer than 2 values in the loaded events SHALL NOT show, unless it is applied; so Access type, Focus area and Host stay hidden while the events carry no details. A Featured filter SHALL NOT show until the events data says which events are featured. Filters and the view SHALL be kept in the page address, so a copied link reopens the same view and filters, and switching view SHALL keep the filters. On phones the filters SHALL open as a bottom sheet from a Filters button.

#### Scenario: Filter survives a view switch

- **GIVEN** the Mode filter set to Virtual
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

#### Scenario: No details yet

- **GIVEN** upcoming events whose access, tags and hosts are all empty
- **WHEN** the visitor opens the rail
- **THEN** it shows no Access type, Focus area or Host section

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

The Calendar view SHALL have Week (default) and Month, kept in the address (`cal=month`). Weeks SHALL start on Monday, and every event SHALL sit on its days in its own time zone. Week SHALL show one column per day of the week, today marked and past days dimmed. An event that runs several days SHALL be one card across its days. One-day events SHALL stack in their day's column, earliest first, each card showing title, its first topic with "+n" for the rest when it has topics, its start and end time ("6:00 PM – 9:00 PM"), and the place and zone in the event's time zone ("Lisbon · UTC+0", "Lisbon · also online · UTC+0", "Online · UTC+0"). A week with no matching event SHALL say "Nothing this week." On phones the cards SHALL stack by day, and empty days SHALL be skipped. Month SHALL show the month grid with a bar per event per week, today marked. Pressing a day number in Month SHALL open that week in Week, and switching to Month SHALL show the month of the week in view. Previous and next controls SHALL move by one week or one month, and "Today" SHALL return to the current week or month. The calendar SHALL open on the linked event's week, else the chosen city's first event, else the first week from today that has an event.

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

### Requirement: The Map view

When a Maps key is configured, the Map view SHALL show a street map with one pin per city that has matching in-person or hybrid events, labelled with the city's count. "Show all" SHALL fit every pin. Pressing a pin with one event SHALL open the drawer. Pressing a pin with several events SHALL show a small card listing them, each opening the drawer. The map SHALL zoom with the mouse wheel or trackpad, the + and − buttons, and, on wider screens, a slider. The page SHALL NOT scroll while the pointer is over the map. Online events SHALL be listed under the map, and so SHALL in-person events whose city has no known position ("Not on the map"), so no matching event is missing from the view. A pin holding an event the viewer is going to SHALL be marked. If the map can't load, it SHALL say so and offer "Try again"; the lists under it still show. Without a Maps key, the view switch SHALL NOT offer Map.

#### Scenario: City pin with several events

- **GIVEN** 3 matching events in Dubai
- **WHEN** the visitor presses the Dubai pin
- **THEN** a card lists the 3 events
- **AND** pressing one opens its drawer

#### Scenario: Link to one event in Map

- **GIVEN** 3 matching events in Dubai, one of them event A
- **WHEN** a visitor opens `/events/all?view=map&event=<A's uid>`
- **THEN** the map is centred on Dubai with its pin marked, and the Dubai card lists the 3 events with A's row marked
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

Pressing an event in any view or in Near you SHALL open the event drawer for that event. Opening `/events/all?event=<uid>` SHALL open the page with that event's drawer open and the event marked in the active view: its list card, its calendar card on its own week, or its map pin centred. Closing the drawer SHALL remove `event` from the address. An unknown uid SHALL open the drawer's "no longer available" state.

#### Scenario: Link to one event in Calendar

- **GIVEN** an event on January 12
- **WHEN** a visitor opens `/events/all?view=calendar&event=<its uid>`
- **THEN** the Week view opens on the week of January 12 with that card marked
- **AND** the drawer is open on that event

### Requirement: Share / embed copies a link to the view

The "Coming up" toolbar on `/events/all` SHALL show a "Share / embed" button in every view and at every width (LAB-3352). A press SHALL copy one link, `<origin>/events/embed`, with the active `view`, `cal` and each applied filter of search, Mode, Access type, Focus area, City and Host, under the page address's own keys. The link SHALL NOT carry "Events I'm going to" (`going`), the open event (`event`) or any other parameter. After the copy a toast SHALL say "Link copied"; when the browser refuses the clipboard it SHALL say "Could not copy the link" and record nothing.

#### Scenario: Share the map of online events

- **GIVEN** a visitor on `/events/all?view=map&mode=Virtual&going=true`
- **WHEN** they press Share / embed
- **THEN** the clipboard holds `<origin>/events/embed?view=map&mode=Virtual` and "Link copied" shows

### Requirement: The embed shows one view for other sites

`/events/embed` SHALL show the All Events "Coming up" toolbar (with Filters and the view switch) and the view and filters in its address, for anyone, signed in or not, with no member data: no Near you, no Add location, no "Events I'm going to", no Going marks (LAB-3352). It SHALL NOT show the site header, the mobile bottom bar, the feedback button, contact support, the rating prompts, the page header ("Submit an event", the events app link) or Share / embed. Pressing an event SHALL open `/events/all?event=<uid>` in a new tab; the embed SHALL NOT open the drawer, also not for `event` in its own address. With no match it SHALL show the page's empty state, and when the events fail to load the page's error state. It SHALL be served only while the native page flag is on (else not found), and SHALL NOT be indexed. Any https site (and LabOS itself) may frame it (see the runtime platform's security headers).

#### Scenario: plrd.org frames online events

- **GIVEN** a plrd.org page with an iframe on `/events/embed?view=map&mode=Virtual`
- **WHEN** the page loads
- **THEN** the iframe shows the map with only online events, without the LabOS header or "Submit an event"
- **WHEN** the reader presses an event
- **THEN** that event opens on LabOS in a new tab, with its drawer open

### Requirement: One Going mark on the page

On the All Events page, an event the signed-in viewer is going to SHALL carry one "Going" pill: a green pill with a white tick and the word "Going", on its List card, Near you tile and Week card. A Month bar is too small for the pill and SHALL carry no going mark; the "Events I'm going to" filter lists those events. No other going mark (badge or tick) SHALL appear on the page.

#### Scenario: Going event in the list

- **GIVEN** a signed-in member going to event A
- **WHEN** they open the List view
- **THEN** A's card shows the Going pill

### Requirement: All Events analytics

The page SHALL record these PostHog events:

- `event-drawer-opened` with `source` = `all-events` when the drawer opens from the page;
- `events-view-changed` with `view` (`list`, `calendar` or `map`) and, for the calendar, `mode` (`week` or `month`);
- `events-filters-applied` with the filter `key` (`search`, `going`, `mode` or `city`) and its `values`, for every filter change whichever control made it (the rail, a chip, a city tile, "Clear all"), once that filter has been still for 300ms; "Clear all" records each filter it empties, with no values;
- `events-city-selected` with `city` and `from` (`tile`, `filter` or `near-you`), in addition, whenever a single city is chosen.
- `events-embed-link-copied` with `view` and `filters_count`, when Share / embed copies the link (LAB-3352);
- `events-embed-viewed` with the `view` it opened on and `referrer_host` (the framing site's host, or null), once per load of `/events/embed`.

No filter event SHALL be recorded for filters read from the address on landing, and a later change to another param (the view, the open event) SHALL NOT cancel a pending filter event.

#### Scenario: Opening an event from the list

- **WHEN** a visitor opens event A from the List view
- **THEN** `event-drawer-opened` is recorded with `event_uid` = A's uid and `source` = `all-events`

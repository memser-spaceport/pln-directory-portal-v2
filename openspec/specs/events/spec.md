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

1. A toolbar that stays at the top while the drawer scrolls (LAB-3361). On the left: "Copy link", which copies `/events/all?event=<uid>` on the current site and reads "Copied" for two seconds (only its icon on a phone); and "Open in PL Events", which opens the event in the PL events app (`<PL events app>/calendar#<the event's events-app id>`) in a new tab, left out when the event has no events-app id. On the right: previous and next, when the page that opened the drawer passes a list of more than one event (see the All Events requirement); then Close.
2. The event's picture as a 56px thumbnail when it has one, beside the title and "Hosted by <hosts>" ("A and B", "A, B and C"). Hosts are names, not links.
3. A date row: a tile with the month and day, then the day ("Thursday, November 19", or "Tue, Dec 1 – Sat, Dec 5" for an event across days) and the time with its zone ("6:00 PM – 9:00 PM · UTC−5"), all in the event's own time zone. When the dates can't be read, the row SHALL show the events app's date line instead.
4. A place row with a pin tile: the address for an in-person event; "Online" with "Link sent after you register" for an online event; the address with "Hybrid, also online" under it for a hybrid event (LAB-3283). When the event has a map link (the events service's `location_url`) and an address, the place text and its arrow SHALL be one link that opens the map in a new tab, as on the PL events app (LAB-3324). An event without a map link, or whose map link is not an `http` or `https` address, SHALL show the place as plain text with no arrow. "Online" SHALL never link to a map.
5. The event's own page (for example its Luma page) when it has one, as a link under the place row (LAB-3271). The link SHALL open in a new tab. It SHALL show the address without `https://`. The row SHALL look like the other fact rows (LAB-3333, LAB-3361): a link icon in a tile like the place row's, then the link text styled like the day line, with no arrow. The page SHALL be the event's `websiteUrl`. When `websiteUrl` is empty or not an `http` or `https` address, the page SHALL be the link of the event's resource named "Registration" (any case, end spaces ignored), and "Register" SHALL open the same page (LAB-3334). An event without a page, or whose page is not an `http` or `https` address, SHALL have no link row and no "Register".
6. An access row when the access is known, with an icon and two lines: "Invite only / The hosts approve each guest", "Paid / Tickets on the host's site" or "Free / RSVP to save your spot" (LAB-3283). Mode and access SHALL NOT show as badges.
7. The going card (see below).
8. "About": the description, then the tags as neutral badges.
9. "Agenda": a row per session with its time beside its title and description, under a day title ("Tue, 1st Dec") when the agenda spans several days.

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
- **THEN** the drawer shows the title, "Hosted by" the host, the date tile with the days and the time, the address, "Free" with "RSVP to save your spot", the description with both tags under it, and both agenda days
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

#### Scenario: The event in the PL events app

- **GIVEN** event A whose events-app id is `abc`
- **WHEN** a viewer opens event A and presses "Open in PL Events"
- **THEN** the PL events app opens on `/calendar#abc` in a new tab

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

The drawer SHALL show a going card right after the fact rows, before About and the agenda (LAB-3225, LAB-3361), with up to three faces and "N members going" ("1 member going" for one). When the event has its own page, the card SHALL have "Register", which opens that page in a new tab. The drawer SHALL NOT show the event's gathering: no "<city> gathering" label, no gathering schedule link, no gathering resources (such as Telegram or shared notes) and no gathering event count (LAB-3283). The gathering stays behind the going card and the plans, which still save to it.

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

A signed-in member without permission to mark attendance SHALL see the event and the attendees in a "Who's going" card, and SHALL NOT see the question, the bottom bar or any button that saves.

#### Scenario: Member without attendance permission

- **GIVEN** a signed-in member without `irlg.going.write` or directory admin
- **WHEN** they open an event
- **THEN** the drawer shows the event and "Who's going" with "N members going"
- **AND** there is no "Are you going?" question and no "Yes, I'm going" button

### Requirement: Signed-out visitors see the event and are asked to sign in

A signed-out visitor SHALL be able to open the drawer from Home (LAB-3271). The drawer SHALL show the event, and the going card SHALL ask "Are you going?" with "Yes, I'm going" as for a member (LAB-3361), with the same bottom bar. "Yes, I'm going" and the people count SHALL open the sign-in modal over the drawer, which stays open, so a visitor who signs in is back on the same event (LAB-3368, LAB-3371). Nothing SHALL save.

#### Scenario: Signed out

- **GIVEN** a signed-out visitor on Home with the event drawer flag on
- **WHEN** they open event A and press "Yes, I'm going"
- **THEN** the sign-in modal opens over the drawer, and the drawer stays on the event
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
- `event-drawer-events-app-opened`, on "Open in PL Events" (LAB-3361);
- `event-drawer-stepped`, on previous or next, with `direction` (`previous` or `next`) and `source`; its `event_uid` is the event it moved to (LAB-3361).

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
- **THEN** the page shows the header, the Coming up toolbar, Browse by city and the List view
- **AND** no iframe loads

#### Scenario: Past events are not listed

- **GIVEN** an event that ended yesterday and one that starts tomorrow
- **WHEN** a visitor opens `/events/all`
- **THEN** only the event that starts tomorrow is listed

### Requirement: The page header

The page SHALL open with the title "Events", one line of description, a link "Open PL Events" to the events app (new tab), and "Submit an event". On phones (below 640px) "Submit an event" SHALL sit on the right of the title's row, and "Open PL Events" SHALL be an inline link at the end of the description, shown once (Polina, 2026-11-24). "Submit an event" SHALL lead where the production submit link leads today.

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

From 640px up, List view SHALL show "Browse by city" under the toolbar with the 5 cities that have the most upcoming events, each with its name and count. When there are more cities, "All N cities" SHALL show the rest in place, and "Show fewer" SHALL hide them again. On phones (below 640px) it SHALL NOT show: a city is chosen in Filters (LAB-3391). Choosing a city SHALL scope the page to it: in List, a city header with "← All cities", the city's name, its event count, its date range and its time zone, in place of Near you and Browse by city; every view SHALL show only that city's events. Under the List's bands, the dated list SHALL have the heading "All upcoming", or "Matching events" while a filter is applied. Calendar and Map SHALL show neither Near you, Browse by city nor the city header (LAB-3375): a chosen city SHALL show there as a removable chip. The city tile and the City filter SHALL be the same selection. The word "Gatherings" SHALL NOT appear on the page.

#### Scenario: Phones have no Browse by city

- **GIVEN** a screen narrower than 640px
- **WHEN** a visitor opens List view
- **THEN** Browse by city does not show
- **AND** they can choose a city in Filters

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

A "Coming up" toolbar, right under the page header (Polina's design, 2026-11-20; LAB-3374), SHALL show the number of events that match, a Filters button and the view switch List · Calendar · Map, offering only the views this build has (no switch while there is one). On desktop and tablet it SHALL stay in view under the navbar while the events scroll. The filter rail SHALL be closed by default. The Filters button SHALL open it and show the number of applied filters. The rail SHALL have a control that closes it and "Clear All". While the rail is closed, each applied filter SHALL show as a removable chip under the toolbar. The filters SHALL be, in this order: search (event name, host, city or topic), "Events I'm going to" (signed-in members only), Mode (In person, Online, Hybrid; LAB-3370), Access type (Free, Paid, Invite only: the words the cards and the drawer use), Focus area (the event's tags), City and Host (any of the event's hosts). Focus area and Host SHALL have a search box. Values within one filter SHALL match any (OR); different filters SHALL all apply (AND). A filter list with fewer than 2 values in the loaded events SHALL NOT show, unless it is applied; so Access type, Focus area and Host stay hidden while the events carry no details. A Featured filter SHALL NOT show until the events data says which events are featured. Filters and the view SHALL be kept in the page address, so a copied link reopens the same view and filters, and switching view SHALL keep the filters. On phones the filters SHALL open as a bottom sheet from a Filters button.

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

The Calendar view SHALL have Week and Month. Month SHALL be the default on screens 960px wide and wider, and Week below 960px (LAB-3353). A mode the visitor picks SHALL be kept in the address (`cal=week` or `cal=month`) and SHALL win over the screen width. Weeks SHALL start on Monday, and every event SHALL sit on its days in its own time zone. In Week and in Month, every day before today SHALL be greyed, today marked. Week SHALL show one column per day of the week. An event that runs several days SHALL be one card across its days. One-day events SHALL stack in their day's column, earliest first, each card showing title, its first topic with "+n" for the rest when it has topics, its start and end time ("6:00 PM – 9:00 PM"), and the place and zone in the event's time zone ("Lisbon · UTC+0", "Lisbon · also online · UTC+0", "Online · UTC+0"). A Week card SHALL show up to 3 faces and "N going" when the event shows attendance and someone is going. A week with no matching event SHALL say "Nothing this week." On phones the cards SHALL stack by day, and empty days SHALL be skipped. Month SHALL show the month grid with a bar per event per week. Pressing a day number in Month SHALL open that week in Week, and switching to Month SHALL show the month of the week in view. Previous and next controls SHALL move by one week or one month, and "Today" SHALL return to the current week or month. The calendar SHALL open on the linked event's week, else the chosen city's first event, else today's week or month, even when that week or month has no event.

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

The drawer's previous and next SHALL step through the events the page shows under the current filters, in the List's order (by list day, then start time), whichever view is open (LAB-3361). Stepping SHALL replace the event in the open drawer and the `event` in the address, without closing and reopening the drawer. Previous SHALL be disabled on the first event and next on the last. Other pages that open the drawer SHALL show no previous or next.

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

The "Coming up" toolbar on `/events/all` SHALL show an "Embed" button with a `</>` glyph, styled like the Filters button, after the List / Calendar / Map switch, in every view and at every width (LAB-3352). A press SHALL open the dialog "Embed these events" in the standard modal shell (LAB-3365, Polina's design on LAB-3352) and copy nothing. It embeds what the page shows, one link `<origin>/events/embed` with the active `view`, the calendar mode on show as `cal` (also when the address has none) and each applied filter of search, Mode, Access type, Focus area, City and Host, under the page address's own keys. The link SHALL NOT carry "Events I'm going to" (`going`), the open event (`event`) or any other parameter, except `details=labos` when the host ticks "Open event details on LabOS" (LAB-3392).

The dialog SHALL show:

- under the title, what the embed shows: "List view", "Week calendar", "Month calendar" or "Map view", then each applied filter's chip label (the search text in curly quotes), joined by " · ", or "All upcoming events" with none;
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

#### Scenario: Copy the link to the map of online events

- **GIVEN** a visitor on `/events/all?view=map&mode=Online&going=true`
- **WHEN** they press Embed, then Copy link
- **THEN** the clipboard holds `<origin>/events/embed?view=map&mode=Online` and the button reads "Link copied" for 2 seconds

### Requirement: The embed shows one view for other sites

`/events/embed` SHALL show only the view and filters in its address, on the page's grey, for anyone, signed in or not, with no member data: no Near you, no Add location, no "Events I'm going to", no Going marks (LAB-3352). Under the view it SHALL show the link "All events on PL Directory ↗", which opens `/events/all` with the same view and filters (not the open event) in a new tab. It SHALL NOT show the site header, the mobile bottom bar, the feedback button, contact support, the rating prompts, the page header ("Submit an event", the events app link), Browse by city, the city header, the "Coming up" toolbar (count, Filters, the view switch, Embed), the filters or the applied-filter chips (Polina's design, 2026-11-20): the person embedding it chose the view and filters. Pressing an event SHALL open its drawer inside the embed (LAB-3392): the same drawer as the page, with previous / next through the events on show, read signed out whoever is signed in. In the embed the drawer SHALL NOT ask to sign in or offer "Yes, I'm going": its card and pinned bar SHALL offer "RSVP on LabOS ↗", which opens `/events/all?event=<uid>` in a new tab, and "N members going" SHALL be text that opens nothing. Opening, stepping and closing the drawer SHALL leave the embed's address and the framing page's history alone, and closing it SHALL leave the view and filters as they were. With `details=labos` in its address, pressing an event SHALL instead open `/events/all?event=<uid>` in a new tab, with no drawer. The embed SHALL NOT open a drawer for `event` in its own address. With no match it SHALL show the page's empty state, and when the events fail to load the page's error state. It SHALL be served only while the native page flag is on (else not found), and SHALL NOT be indexed. Any https site (and LabOS itself) may frame it (see the runtime platform's security headers).

#### Scenario: plrd.org frames online events

- **GIVEN** a plrd.org page with an iframe on `/events/embed?view=map&mode=Online`
- **WHEN** the page loads
- **THEN** the iframe shows the map with only online events, without the LabOS header, "Submit an event" or the toolbar
- **AND** under the map, "All events on PL Directory ↗" links to `/events/all?view=map&mode=Online`
- **WHEN** the reader presses an event
- **THEN** its drawer opens inside the iframe, with "RSVP on LabOS ↗" in place of "Yes, I'm going"
- **WHEN** they close it
- **THEN** the iframe still shows the map with only online events

#### Scenario: A host sends events to LabOS

- **GIVEN** an iframe on `/events/embed?view=calendar&details=labos`
- **WHEN** the reader presses an event
- **THEN** that event opens on LabOS in a new tab, with its drawer open, and the embed opens no drawer

### Requirement: One Going mark on the page

On the All Events page, an event the signed-in viewer is going to SHALL carry one "Going" pill: a green pill with a white tick and the word "Going", on its List card, Near you tile, Week card and map row. A Month bar is too small for the pill and SHALL carry no going mark; the "Events I'm going to" filter lists those events. On the map, the city pin is marked and the event pin has a green ring instead. No other going mark (badge or tick) SHALL appear on the page. When the viewer says they are going, or no longer going, the event's "N going" on the page SHALL move by one at once, though the page's list of events is cached.

#### Scenario: Going event in the list

- **GIVEN** a signed-in member going to event A
- **WHEN** they open the List view
- **THEN** A's card shows the Going pill

### Requirement: All Events analytics

The page SHALL record these PostHog events:

- `event-drawer-opened` with `source` = `all-events` when the drawer opens from the page, and `embed` when it opens inside `/events/embed` (LAB-3392);
- `events-view-changed` with `view` (`list`, `calendar` or `map`) and, for the calendar, `mode` (`week` or `month`);
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

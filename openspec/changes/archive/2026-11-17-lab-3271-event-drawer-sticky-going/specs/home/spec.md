# Spec Delta

## MODIFIED Requirements

### Requirement: Open roles and upcoming events beside the news

The sidebar SHALL list the newest open roles, with "See all N jobs" where N is the total number of open roles. It SHALL list up to three events that start in the next 30 days, soonest first, with "See all N events" ("See all 1 event" for one) to the events page. Signed out, a full-width primary "Sign up to apply" button SHALL sit above "See all N jobs" and open sign-up.

When no event starts in the next 30 days, the events section SHALL be absent and the roles section SHALL list five roles instead of three.

Each event SHALL open All Events with that event's details open (`/events/all?embedPath=/embed/calendar#<slug>`). The slug is rebuilt from the event's name the way the events calendar makes it, because the Directory doesn't store it; where two calendar events share a slug, the calendar opens the first, and a name that matches none opens the calendar with no event open.

With the event drawer flag on, an event row SHALL instead open the event drawer on that event, over Home, for signed-in members and, since LAB-3271, for signed-out visitors. The row asks nothing itself. Once a signed-in member is going to that event, the row's arrow SHALL be replaced by "Going". `home-event-clicked` SHALL keep firing on a row press.

Each event row SHALL show "N going" after the location when N is 1 or more (LAB-3271). N counts everyone going to the event. With N = 0, or when the API sends no count, the row SHALL show no count. The count comes from `goingCount` on `GET /v1/irl/events/upcoming` (backend PR memser-spaceport/pln-directory-portal#3725). Invite-only events send `null`, and the row SHALL show no count.

#### Scenario: Events this month

- **GIVEN** events starting in 3, 20 and 45 days
- **WHEN** a signed-out visitor opens `/`
- **THEN** the sidebar shows three roles, then the events in 3 and 20 days

#### Scenario: No events this month

- **GIVEN** no event starts in the next 30 days
- **WHEN** a signed-out visitor opens `/`
- **THEN** there is no events section and five roles show

#### Scenario: A data source fails

- **GIVEN** the roles or the events request fails
- **WHEN** the page renders
- **THEN** that section is absent, and the rest of the page renders

#### Scenario: Signed-in row opens the drawer

- **GIVEN** the event drawer flag is on
- **WHEN** a signed-in member presses an event in the rail
- **THEN** the event drawer opens on that event over Home, and the URL does not change

#### Scenario: Going from the rail

- **GIVEN** the event drawer flag is on and a signed-in member not going to event A
- **WHEN** they open event A from the rail, say "Yes, I'm going", and close the drawer
- **THEN** event A's row reads "Going"
- **AND** a toast reads "A is on your profile." with a "View profile" link to their profile

#### Scenario: Signed out with the flag on

- **GIVEN** the event drawer flag is on
- **WHEN** a signed-out visitor presses an event in the sidebar
- **THEN** the event drawer opens on that event over Home
- **AND** its "Yes, I'm going" opens the sign-in modal

#### Scenario: Attendee count on a row

- **GIVEN** event A with 12 people going and event B with none
- **WHEN** a viewer opens `/`
- **THEN** event A's row reads "… · 12 going" and event B's row shows no count

#### Scenario: Signed out with the flag off

- **GIVEN** the event drawer flag is off
- **WHEN** a signed-out visitor presses an event in the sidebar
- **THEN** All Events opens with that event's details, as today

#### Scenario: The viewer's events fail to load

- **GIVEN** the event drawer flag is on and the request for a signed-in member's own upcoming events fails
- **WHEN** they open `/`
- **THEN** the rail shows its events with no "Going" marks
- **AND** pressing an event still opens the event drawer

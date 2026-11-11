# Spec Delta

## MODIFIED Requirements

### Requirement: Open roles and upcoming events beside the news

The sidebar SHALL list the newest open roles, with "See all N jobs" where N is the total number of open roles. It SHALL list up to three events that start in the next 30 days, soonest first, with "See all" to the events page. Signed out, a full-width primary "Sign up to apply" button SHALL sit above "See all N jobs" and open sign-up.

When no event starts in the next 30 days, the events section SHALL be absent and the roles section SHALL list five roles instead of three.

Each event SHALL open All Events with that event's details open (`/events/all?embedPath=/embed/calendar#<slug>`). The slug is rebuilt from the event's name the way the events calendar makes it, because the Directory doesn't store it; where two calendar events share a slug, the calendar opens the first, and a name that matches none opens the calendar with no event open.

With the event drawer flag on, a signed-in member's event row SHALL instead open the event drawer on that event, over Home. The row asks nothing itself. Once the member is going to that event, the row's arrow SHALL be replaced by "Going". `home-event-clicked` SHALL keep firing on a row press.

#### Scenario: Events this month

- **GIVEN** events starting in 3, 20 and 45 days
- **WHEN** a signed-out visitor opens `/home`
- **THEN** the sidebar shows three roles, then the events in 3 and 20 days

#### Scenario: No events this month

- **GIVEN** no event starts in the next 30 days
- **WHEN** a signed-out visitor opens `/home`
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
- **WHEN** they open event A from the rail, say "Yes, I'm going" with "Show on my profile" ticked, and close the drawer
- **THEN** event A's row reads "Going"
- **AND** a toast reads "A is on your profile." with a "View profile" link to their profile

#### Scenario: Signed out with the flag on

- **GIVEN** the event drawer flag is on
- **WHEN** a signed-out visitor presses an event in the sidebar
- **THEN** All Events opens with that event's details, as today

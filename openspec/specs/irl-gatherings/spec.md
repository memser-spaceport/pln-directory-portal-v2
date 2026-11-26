# irl-gatherings Specification

> How the IRL Gatherings page loads when the member session cannot authorize its calls.

## Purpose

The IRL Gatherings page shows locations, events, and attendees. A failed signed-in call must leave that page on screen.

## Requirements

### Requirement: A stale session still shows gatherings

The page SHALL show the public gatherings when a signed-in guest or preferences call fails. The page SHALL show the error view only when the public guest call also fails.

#### Scenario: Signed-in guest call fails

- **GIVEN** a member whose access token is rejected
- **WHEN** the member opens IRL Gatherings
- **THEN** the page shows the public gatherings
- **AND** the page does not show the error view

#### Scenario: Public guest call fails

- **GIVEN** the public guest call fails
- **WHEN** a member opens IRL Gatherings
- **THEN** the page shows the error view

### Requirement: Schedule links stay in LabOS when the All Events page is on

When the All Events page is on (`NEXT_PUBLIC_SHOW_EVENTS_PAGE_V2` and `NEXT_PUBLIC_SHOW_EVENT_DRAWER`), the gathering's "Schedule" button and the schedule link in an empty guest list SHALL open `/events/all` scoped to the gathering's city, in the same tab and without the outward arrow (LAB-3337). The city SHALL be the one the All Events page shows for the gathering ("london" → "London", "Lisbon, Portugal" → "Lisbon"). A gathering with no city ("Others") SHALL link to `/events/all`. The "View All Events" card SHALL open `/events/all` in the same tab.

A gathering's own schedule link (`additionalInfo.schedule_url`) SHALL win over both, in a new tab. With either flag off, every link SHALL open the events app in a new tab, as before. "Submit an event" and "Manage events" SHALL stay on the events app.

#### Scenario: Schedule link with the All Events page on

- **GIVEN** the All Events page is on and the london gathering
- **WHEN** an admin clicks the gathering's "Schedule" button
- **THEN** `/events/all?city=London` opens in the same tab

#### Scenario: A gathering with its own schedule

- **GIVEN** the Buenos Aires gathering has its own schedule link
- **WHEN** an admin clicks the gathering's "Schedule" button
- **THEN** that link opens in a new tab

#### Scenario: All Events page off

- **GIVEN** either flag is off
- **WHEN** an admin clicks a schedule link or "View All Events"
- **THEN** the events app opens in a new tab

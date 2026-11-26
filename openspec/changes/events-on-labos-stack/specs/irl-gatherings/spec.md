# Spec Delta

## MODIFIED Requirements

### Requirement: Schedule links stay in LabOS when the All Events page is on

The gathering's "Schedule" button and the schedule link in an empty guest list SHALL open `/events/all` scoped to the gathering's city, in the same tab and without the outward arrow (LAB-3337). The city SHALL be the one the All Events page shows for the gathering ("london" → "London", "Lisbon, Portugal" → "Lisbon"). A gathering with no city ("Others") SHALL link to `/events/all`. The "View All Events" card SHALL open `/events/all` in the same tab.

A gathering's own schedule link (`additionalInfo.schedule_url`) SHALL win over both, in a new tab. "Submit an event" SHALL open the LabOS submit form (`/events/submit`) in the same tab. The page SHALL NOT show "Manage events"; a member manages their events on My events (`/events/mine`). No link on the page SHALL open the events app or the old submission portal.

#### Scenario: Schedule link with the All Events page on

- **GIVEN** the london gathering
- **WHEN** an admin clicks the gathering's "Schedule" button
- **THEN** `/events/all?city=London` opens in the same tab

#### Scenario: A gathering with its own schedule

- **GIVEN** the Buenos Aires gathering has its own schedule link
- **WHEN** an admin clicks the gathering's "Schedule" button
- **THEN** that link opens in a new tab

#### Scenario: All Events page off

- **GIVEN** any build
- **WHEN** an admin clicks a schedule link or "View All Events"
- **THEN** `/events/all` opens in the same tab, because the page has no off state

#### Scenario: Submit an event from a gathering

- **WHEN** a member clicks "Submit an event" on the IRL Gatherings page
- **THEN** `/events/submit` opens in the same tab

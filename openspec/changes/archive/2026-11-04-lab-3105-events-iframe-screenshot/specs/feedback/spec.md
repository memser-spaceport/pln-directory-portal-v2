## ADDED Requirements

### Requirement: The page screenshot shows an embedded events calendar

When a member sends feedback from a LabOS page that embeds the events calendar, the screenshot SHALL show the events calendar and the LabOS page around it. The picture of the calendar SHALL come from the events page through the same bridge an AI app uses. A page that does not embed the events calendar SHALL screenshot as before. If the events page does not answer, the screenshot SHALL still show the LabOS page.

#### Scenario: Feedback on the events page

- **GIVEN** a member is on the LabOS events page
- **WHEN** the member opens the feedback form
- **THEN** the screenshot shows the events calendar

#### Scenario: Feedback on another page

- **GIVEN** a member is on a LabOS page that does not embed the events calendar
- **WHEN** the member opens the feedback form
- **THEN** the screenshot shows that page as before

#### Scenario: The events page does not answer

- **GIVEN** the events calendar does not answer the bridge
- **WHEN** the screenshot is taken
- **THEN** the screenshot still shows the LabOS page

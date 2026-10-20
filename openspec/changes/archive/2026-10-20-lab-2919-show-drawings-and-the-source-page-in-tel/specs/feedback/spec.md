## Purpose

Feedback and support requests that members send from LabOS to the support team, with their screenshots and the page they came from.

## ADDED Requirements

### Requirement: Drawn-on screenshots are sent with the drawings in the picture
When a member sends LabOS feedback with a screenshot that has drawings, text, shapes or pins, the request SHALL carry, for that screenshot, the raw screenshot, its drawing data, and a hosted picture with the drawings in it. A screenshot with no drawings SHALL be sent as the raw screenshot only, with no extra upload.

#### Scenario: A member draws on a screenshot
- **GIVEN** a member adds a screenshot to LabOS feedback and draws on it
- **WHEN** the member sends the feedback
- **THEN** the request carries the raw screenshot and its drawing data
- **AND** the request carries a hosted picture of the screenshot with the drawings in it

#### Scenario: A screenshot with no drawings
- **GIVEN** a member adds a screenshot to LabOS feedback and does not draw on it
- **WHEN** the member sends the feedback
- **THEN** the request carries the raw screenshot only, and only one image is uploaded

### Requirement: Feedback still sends when the picture with drawings fails
If the picture with the drawings cannot be made or uploaded, the feedback SHALL still send with the raw screenshot and its drawing data, and the size limit SHALL apply to the request as sent.

#### Scenario: The picture with drawings cannot be made
- **GIVEN** a member drew on a screenshot and the browser cannot draw the picture
- **WHEN** the member sends the feedback
- **THEN** the feedback is sent with the raw screenshot only

### Requirement: Support requests name the page they came from
The feedback drawer and the help-menu support form SHALL send the address of the page the member is on with every support request.

#### Scenario: Feedback from a profile page
- **GIVEN** a member is on a member profile page
- **WHEN** the member sends LabOS feedback or a support request
- **THEN** the request carries the address of that profile page

# feedback Specification

## Purpose
Feedback and support requests that members send from LabOS to the support team, with their screenshots and the page they came from.

## Requirements

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

### Requirement: The page screenshot works on pages with video
The feedback screenshot of a LabOS page SHALL show the page when the page has a video. A video SHALL NOT delay the screenshot or stop playing because of it. A video on screen SHALL be drawn from the frame it shows when the browser allows reading that frame; otherwise its area SHALL be empty. Images the page shows SHALL appear even when the browser cached them without CORS headers.

#### Scenario: A page with a pitch video
- **GIVEN** a member is on the active Demo Day page with a team pitch video on screen
- **WHEN** the member opens the feedback form
- **THEN** the screenshot shows the page, with the pitch deck preview and the video area

#### Scenario: The video is still loading
- **GIVEN** the pitch video on screen has not loaded its first frame
- **WHEN** the screenshot is taken
- **THEN** the screenshot shows the page without waiting for the video, and the video area is empty

#### Scenario: The video plays
- **GIVEN** the pitch video on screen is playing
- **WHEN** the screenshot is taken
- **THEN** the screenshot shows the page and the frame on screen, or an empty video area when the browser does not allow reading the frame
- **AND** the video keeps playing

### Requirement: A failed screenshot says why when the cause is known
When an instant screenshot in the feedback form fails because the page or app took too long, the form SHALL say that it took too long. When the cause is anything else, the form SHALL show the general message. A failed automatic screenshot SHALL ask the member to add a screenshot; a failed Whole page or Pick a part SHALL say that trying again uses screen sharing.

#### Scenario: The automatic screenshot fails
- **GIVEN** the member opens the feedback form
- **WHEN** the automatic screenshot fails for a cause the form does not name
- **THEN** the form says it could not capture the page and asks the member to add a screenshot

#### Scenario: The capture takes too long
- **GIVEN** the member opens the feedback form on a page that takes too long to draw
- **WHEN** the automatic screenshot runs out of time
- **THEN** the form says that the page took too long and asks the member to add a screenshot

#### Scenario: Whole page or Pick a part fails
- **GIVEN** the member chooses Whole page or Pick a part
- **WHEN** the capture takes too long
- **THEN** the form says that the page took too long and that trying again uses screen sharing

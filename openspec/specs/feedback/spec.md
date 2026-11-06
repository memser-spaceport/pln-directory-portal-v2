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

### Requirement: An image in the feedback note can be annotated

A member SHALL be able to annotate an image that sits in the feedback note, with the same annotate tools as a screenshot in the screenshot list. The note SHALL show an Annotate control and a remove control on the image, including an image the member pastes in, and SHALL show that image's drawings on the image. Removing an image SHALL take it out of the note. Saving SHALL keep the image in the note and SHALL store the drawing data on that image. Discarding SHALL leave the image and any drawing data it already had unchanged. A screenshot copied from the screenshot list into the note SHALL keep the drawing data it already had, and SHALL stay in the list. The sent request SHALL follow the same rule as a screenshot in the list: the raw picture, its drawing data, and a hosted picture with the drawings when that picture can be made.

#### Scenario: A member annotates an image in the note

- **GIVEN** a member has an image in the feedback note
- **WHEN** the member annotates that image and saves
- **THEN** the image stays in the note
- **AND** the note carries that image's drawing data

#### Scenario: A member discards the annotator

- **GIVEN** a member opens the annotate tools on an image in the note
- **WHEN** the member discards them
- **THEN** the note is unchanged

#### Scenario: A screenshot is copied into the note

- **GIVEN** a screenshot in the list has drawings on it
- **WHEN** the member drops that screenshot into the note
- **THEN** the note image carries those drawings
- **AND** the screenshot stays in the list

### Requirement: The feedback drawer does not change the page layout

On an AI app page, the Feedback drawer SHALL open on top of the page. The page width, layout, and scroll position SHALL stay as they were when the drawer opens, when it switches between narrow and wide, and when it closes. The Comments tab SHALL still make the page give up the narrow drawer's width, so a member can place a comment on the app beside the drawer.

#### Scenario: Feedback on an AI app page

- **GIVEN** a member is on an AI app page on a desktop window
- **WHEN** the member opens the feedback drawer
- **THEN** the app keeps its width
- **AND** the drawer covers the right edge of the page

#### Scenario: Wider and narrower

- **GIVEN** the feedback drawer is open on an AI app page
- **WHEN** the member switches between the narrow drawer and the wide drawer
- **THEN** the app keeps its width

#### Scenario: The Comments tab

- **GIVEN** a member is on an AI app page
- **WHEN** the member opens the Comments tab
- **THEN** the page gives up the narrow drawer's width

### Requirement: A support submit is recorded
A successful Contact Support submit SHALL record `contact-support-submitted` with the chosen topic and the page path. The event SHALL NOT include the message, the name or the email. A failed submit SHALL record no submit event. Choosing a topic SHALL still record `contact-support-topic-pill-selected`.

#### Scenario: Report a bug
- **WHEN** a member chooses "Report a bug" and the submit succeeds
- **THEN** PostHog gets one `contact-support-submitted` with that topic

#### Scenario: Submit fails
- **WHEN** the submit request fails
- **THEN** PostHog gets no `contact-support-submitted`

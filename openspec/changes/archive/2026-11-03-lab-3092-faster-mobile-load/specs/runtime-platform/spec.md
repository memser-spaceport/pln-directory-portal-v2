## ADDED Requirements

### Requirement: Images load in step with what the visitor sees

On `/home`, images below the fold SHALL load lazily and every image SHALL declare its width and height. The image that is the largest element of a member profile SHALL be discoverable from the HTML, not only from a stylesheet.

#### Scenario: Home below the fold

- **GIVEN** a signed-out visitor on `/home`
- **WHEN** the page loads
- **THEN** no image below the fold is requested before the visitor scrolls toward it
- **AND** nothing on the page shifts as images arrive

#### Scenario: Member profile hero

- **GIVEN** a signed-out visitor opening a member profile
- **WHEN** the browser reads the page's HTML
- **THEN** the request for the largest element's image starts without waiting for a stylesheet

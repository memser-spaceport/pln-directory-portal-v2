## ADDED Requirements

### Requirement: Signed-out mobile pages meet a performance budget

For a signed-out visitor, measured with Lighthouse's mobile preset (median of three runs on one deployment), Total Blocking Time SHALL be under 300 ms on `/home` and `/jobs`, and Largest Contentful Paint SHALL be 2.5 s or less on `/jobs` and on a member profile.

#### Scenario: Job board on a phone

- **GIVEN** a signed-out visitor on a mobile connection
- **WHEN** Lighthouse measures `/jobs` with the mobile preset
- **THEN** Total Blocking Time is under 300 ms and LCP is 2.5 s or less

#### Scenario: Member profile on a phone

- **GIVEN** a signed-out visitor on a mobile connection
- **WHEN** Lighthouse measures a member profile with the mobile preset
- **THEN** LCP is 2.5 s or less

#### Scenario: Home on a phone

- **GIVEN** a signed-out visitor on a mobile connection
- **WHEN** Lighthouse measures `/home` with the mobile preset
- **THEN** Total Blocking Time is under 300 ms

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

# Spec Delta

## ADDED Requirements

### Requirement: Public Demo Day pages are in the server HTML

The first HTML response for a Demo Day's landing page (`/demoday/<id>`) and its completed view (`/demoday/<id>/completed`) SHALL contain the page's content, readable without running JavaScript: the Demo Day's name and description, and on the completed view each presenting team's name with a link to `/teams/<uid>`. It SHALL NOT be a loading skeleton. The server HTML SHALL hydrate without a mismatch.

#### Scenario: Completed view, fetched without JavaScript

- **GIVEN** a Demo Day whose status is completed
- **WHEN** a client without cookies requests `/demoday/<id>/completed` and reads the HTML without running scripts
- **THEN** the HTML contains the Demo Day's name as its `<h1>` and its description
- **AND** the HTML lists the participating teams, each with an `<a href="/teams/<uid>">` link

#### Scenario: Landing page of a Demo Day that is not finished, fetched without JavaScript

- **GIVEN** a Demo Day that is open for registration or active
- **WHEN** a client without cookies requests `/demoday/<id>`
- **THEN** the HTML contains the Demo Day's name as its `<h1>`, its description and its date

#### Scenario: Signed-in investor or founder

- **WHEN** a signed-in investor or founder opens the same pages
- **THEN** they are redirected and shown their views as before

### Requirement: An unknown Demo Day is a 404

A Demo Day page whose id the API reports as not found SHALL answer HTTP 404 with the not-found page, for the landing page and the completed view. Any other API failure SHALL keep the page as it was, so an outage never tells crawlers a live Demo Day is gone.

#### Scenario: Unknown id

- **WHEN** a crawler requests `/demoday/<unknown-id>` or `/demoday/<unknown-id>/completed`
- **THEN** the response status is 404 and the page is marked `noindex`

#### Scenario: API outage

- **GIVEN** the Demo Day API answers with an error other than 404
- **WHEN** a visitor requests `/demoday/<id>`
- **THEN** the page does not answer 404

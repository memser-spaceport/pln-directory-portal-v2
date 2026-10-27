# seo Specification

> Seeded from code on 2026-10-20 (lab-2876, LAB-2923/LAB-2924); correct me.
> Site-wide rules for what search engines may index and under which address. Page-specific rules live in their own specs (`job-board`, `profiles`, `teams`).

## Purpose

Which addresses of the site search engines are told to index, and how every other address points them there: sitemap entries, canonical addresses, permanent redirects and `noindex` pages.

## Requirements

### Requirement: The sitemap lists only addresses meant to be indexed

`/sitemap.xml` SHALL list each page under the address it is indexed at. It SHALL NOT list an address that redirects. The events calendar is listed as `/events/all` and the Demo Day landing page as `/demoday`.

#### Scenario: Static entries

- **GIVEN** the sitemap is generated
- **WHEN** a crawler reads it
- **THEN** it lists `/events/all` and `/demoday`
- **AND** it does not list `/events`

### Requirement: One address for the events calendar

`/events` SHALL redirect permanently (308) to `/events/all`, and `/events/all` SHALL declare itself as its canonical address. Other pages under `/events/` SHALL NOT redirect.

#### Scenario: Old events address

- **GIVEN** a link to `/events`
- **WHEN** a visitor or a crawler requests it
- **THEN** the response is a 308 redirect to `/events/all`

#### Scenario: Calendar canonical

- **WHEN** a crawler requests `/events/all`
- **THEN** its canonical address is `/events/all`

### Requirement: Demo Day landing canonical

The Demo Day landing page SHALL declare `/demoday` as its canonical address. Pages under `/demoday/` SHALL NOT inherit that canonical.

#### Scenario: Landing page

- **WHEN** a crawler requests `/demoday`
- **THEN** its canonical address is `/demoday`

### Requirement: The sign-up flow is not indexed

Every page under `/sign-up` SHALL be marked `noindex, follow`, whatever its query string.

#### Scenario: Sign-up with a return address

- **WHEN** a crawler requests `/sign-up?returnTo=/members/M`
- **THEN** the page carries `<meta name="robots" content="noindex, follow">`

### Requirement: Main pages name the searches they should be found for

The home page, members, teams, projects, the events calendar, the job board and the Demo Day landing page SHALL each have a title and a description of their own, and no two of them SHALL share either. Each SHALL name "Protocol Labs". The home page SHALL also name "innovation network", and Demo Day SHALL name "venture investors" and "VC". The job board keeps the title "Protocol Labs Jobs | LabOS".

#### Scenario: Home page

- **WHEN** a crawler requests `/home`
- **THEN** its title and description both contain "Protocol Labs" and "innovation network"

#### Scenario: Demo Day

- **WHEN** a crawler requests `/demoday`
- **THEN** its title and description both contain "venture investors" and "VC"

### Requirement: Share cards match the search result

On those pages, `og:title`, `og:description`, `twitter:title` and `twitter:description` SHALL equal the page's title and description.

#### Scenario: A listing page is shared

- **WHEN** a link to `/members` is shared
- **THEN** the card's title and description are the page's own title and description

### Requirement: Demo Day dashboards are not indexed

Pages under a Demo Day (`/demoday/<id>/…`) SHALL be marked `noindex, follow`; they are dashboards for its admins, founders and investors. The event's landing page (`/demoday/<id>`) and its completed view (`/demoday/<id>/completed`) SHALL be indexable, each with its own address as canonical.

#### Scenario: Investor dashboard

- **WHEN** a crawler requests `/demoday/<id>/investor`
- **THEN** the page is marked `noindex, follow`

#### Scenario: Completed view

- **WHEN** a crawler requests `/demoday/<id>/completed`
- **THEN** the page is indexable and its canonical address is `/demoday/<id>/completed`

### Requirement: Canonical addresses have one slash after the host

Every canonical address SHALL be the page's path on the site's base URL, with exactly one slash between them, whether or not the configured base URL ends in "/".

#### Scenario: Base URL with a trailing slash

- **GIVEN** the base URL is configured as `https://os.pl.xyz/`
- **WHEN** a crawler requests `/teams/T`
- **THEN** its canonical address is `https://os.pl.xyz/teams/T`

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

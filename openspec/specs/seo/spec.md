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

#### Scenario: Teams hidden from signed-out visitors

- **GIVEN** the directory API serves `GET /v1/teams/crawl-index`
- **WHEN** the sitemap is generated
- **THEN** it lists the teams of the crawl index
- **AND** it does not list a team at access level `L0`, whose profile answers 404 to a crawler

#### Scenario: API without a team crawl index

- **GIVEN** `GET /v1/teams/crawl-index` fails
- **WHEN** the sitemap is generated
- **THEN** it lists the teams of the full team list, as before

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

### Requirement: Non-production deployments are not indexed

Every response SHALL carry `X-Robots-Tag: noindex, nofollow`, whatever host serves it, when the build is a Vercel preview (`VERCEL_ENV=preview`) or was built with `SEO_NOINDEX=true` (the k8s feature envs). Any other build SHALL send no `X-Robots-Tag` of its own. That includes production, local development, a build with neither variable set, and any other `SEO_NOINDEX` value. robots.txt SHALL NOT block the crawl, so crawlers can see the header.

#### Scenario: Preview on a custom domain

- **WHEN** a crawler requests `/home` on `pr-<n>.preview.dev.os.pl.xyz`
- **THEN** the response carries `X-Robots-Tag: noindex, nofollow`

#### Scenario: Feature env

- **WHEN** a crawler requests `/home` on `directory-portal-lab-<n>.os.pl.xyz`, deployed with `SEO_NOINDEX=true`
- **THEN** the response carries `X-Robots-Tag: noindex, nofollow`

#### Scenario: Production

- **WHEN** a crawler requests `/home` on `os.pl.xyz`
- **THEN** the response carries no `X-Robots-Tag`

### Requirement: Main pages name the searches they should be found for

The home page, members, teams, projects, the events calendar, the job board and the Demo Day landing page SHALL each have a title and a description of their own, and no two of them SHALL share either. Each SHALL name "Protocol Labs". The home page SHALL also name "innovation network", and Demo Day SHALL name "venture investors" and "VC". The job board keeps the title "Protocol Labs Jobs | LabOS".

#### Scenario: Home page

- **WHEN** a crawler requests `/home`
- **THEN** its title and description both contain "Protocol Labs" and "innovation network"

#### Scenario: Demo Day

- **WHEN** a crawler requests `/demoday`
- **THEN** its title and description both contain "venture investors" and "VC"

### Requirement: Every page has one h1

Each page SHALL have exactly one `<h1>` element in its server-rendered HTML. A page that renders a separate copy of its title for narrow screens SHALL make that copy a heading by role (`role="heading" aria-level="1"`) or hide it from assistive technology, not a second `<h1>`. A job posting's own `h1` and `h2` SHALL render as `h3`, under the role page's `h1` (the role title) and `h2` ("About the role").

#### Scenario: Listing and profile pages

- **WHEN** a crawler requests `/members`, `/teams`, `/projects`, `/jobs`, a team profile or a project profile
- **THEN** the HTML has one `<h1>`

#### Scenario: Job posting with h1 sections

- **GIVEN** a role whose description has `<h1>The Role</h1>`
- **WHEN** a crawler requests the role page
- **THEN** the HTML has one `<h1>`, the role title, and "The Role" is an `<h3>`

### Requirement: The home page says what the network is

`/home` SHALL have the `<h1>` "Protocol Labs Directory". For a signed-out visitor it SHALL be followed by a definition of the Protocol Labs network and the directory of 40 to 60 words; for a signed-in member the heading MAY be visible to screen readers only.

#### Scenario: Crawler on the home page

- **WHEN** a crawler requests `/home` without cookies
- **THEN** the HTML has one `<h1>` and the definition

### Requirement: The home page names Protocol Labs as structured data

`/home` SHALL carry JSON-LD with an `Organization` (Protocol Labs, with `sameAs` links to protocol.ai, Wikidata Q63930216, X, LinkedIn and YouTube) and a `WebSite` (Protocol Labs Directory, at the home page's canonical address) published by it.

#### Scenario: Home page markup

- **WHEN** a crawler requests `/home`
- **THEN** the HTML has an `application/ld+json` script with the `Organization` and the `WebSite`

### Requirement: Links reach every profile

`/members`, `/teams` and `/projects` SHALL each link, in their server HTML, to a browse index at `/<listing>/browse`. The index SHALL list every profile the sitemap lists for that listing, A to Z, 200 per page, as plain links, with links to every page of the index. Each page SHALL have a self-canonical; page 1 SHALL have no `?page=`. A `?page=` that is not a whole number from 1 up, or is past the last page, SHALL answer 404.

#### Scenario: Crawler follows links only

- **WHEN** a crawler starts at `/teams`, `/members` or `/projects` and follows only `<a href>` links
- **THEN** it reaches every team, member and project profile in the sitemap

#### Scenario: Page past the end

- **WHEN** a client requests `/teams/browse?page=99` and there are fewer pages
- **THEN** the response status is 404

#### Scenario: Teams and contributors on a project page

- **WHEN** a crawler reads a project profile
- **THEN** its maintaining team, contributing teams and contributors are `<a href>` links to their profiles

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

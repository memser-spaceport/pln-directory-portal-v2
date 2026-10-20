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

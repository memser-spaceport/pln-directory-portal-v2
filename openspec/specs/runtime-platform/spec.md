# runtime-platform Specification

> Added by LAB-2947 (2026-10-22). Runtime facts live in AGENTS.md; this spec is the contract for which Node release each environment serves and the no-regression bar for changing it.

## Purpose

Defines which Node.js runtime the v2 directory app is built, tested and served on in each environment. It also sets the no-regression bar that any runtime change must clear before it reaches production.

## Requirements

### Requirement: Supported, patched Node 22 runtime in every environment

The app SHALL be built and served on Node.js 22 at 22.23.4 or later. This applies to the feature-env container image, Vercel previews, dev, staging and production. No environment SHALL serve the app on an end-of-life Node release or on a Node 22 release older than 22.23.4.

#### Scenario: Feature-env container

- **GIVEN** a feature env is deployed from this repository's container image
- **WHEN** an operator runs `node -v` inside the running app container
- **THEN** it prints a version that is `v22.23.4` or a later `v22.x` release

#### Scenario: Vercel deployment

- **GIVEN** a Vercel preview, dev, staging or production deployment built from a commit with this change
- **WHEN** an operator reads that deployment's build log
- **THEN** the log shows the build used Node.js 22.x
- **AND** the log has no warning that the Node version will auto-upgrade to a new major

### Requirement: One declared Node version shared by local, CI and image builds

The repository SHALL declare one Node 22 release, and local development, the Jest CI check and the container image SHALL all use it. The declared major SHALL satisfy the package's `engines.node` range.

#### Scenario: CI uses the declared release

- **GIVEN** the repository declares Node 22.23.4
- **WHEN** the Jest coverage check runs on a pull request
- **THEN** the job's Node runtime is v22.23.4
- **AND** dependency install shows no `EBADENGINE` warning about the Node version

#### Scenario: Wrong major used locally

- **GIVEN** a developer runs Node 20 or Node 24
- **WHEN** they run `npm ci`
- **THEN** npm warns that the Node version does not satisfy the package's engines range

### Requirement: Runtime change causes no regression

A Node runtime change SHALL NOT reach production unless the lint, Jest, build and smoke-check results on the new runtime match the results on the old runtime for the same commit of `develop`. A check that fails only on the new runtime blocks the change. A check that fails on both runtimes is recorded but does not block.

#### Scenario: Same results before and after

- **GIVEN** the baseline results for lint, Jest and build on the old runtime
- **WHEN** the same commands run on Node 22.23.4
- **THEN** the set of passing and failing checks is identical

#### Scenario: Main pages still render with live data

- **GIVEN** the app runs on the new runtime against the dev Directory API
- **WHEN** a visitor opens the home, members, teams, projects, events, forum, jobs, AI search and Explore PL Network pages and a member, team and project detail page
- **THEN** each page answers with a non-5xx status and shows data loaded from the API
- **AND** the server log has no new runtime errors compared with the old runtime

#### Scenario: Image optimisation and generated assets still work

- **GIVEN** the app runs on the new runtime
- **WHEN** a client requests an optimised image through the Next.js image endpoint, an Open Graph image, `sitemap.xml`, `robots.txt` and `llms.txt`
- **THEN** each answers 200 with the expected content type

#### Scenario: Signed-in flows still work

- **GIVEN** a member signs in on a deployment that runs the new runtime
- **WHEN** they open their settings, notifications and the AI Apps (PL Infra) dashboard
- **THEN** the pages load their data with no errors compared with the old runtime

### Requirement: Image optimizer fetches only from listed hosts

The Next.js image endpoint SHALL fetch and optimise remote images only from an explicit list of https hosts (LAB-2978). It SHALL refuse a URL whose host is not on the list, and the list SHALL contain no wildcard host. A new image host is added to the list by a code change.

#### Scenario: Image from a listed host

- **GIVEN** an image URL on a listed host, for example `pl-directory-images-prod.s3.us-west-1.amazonaws.com`
- **WHEN** a page renders it through the Next.js image endpoint
- **THEN** the image renders as before

#### Scenario: Image from a host that is not listed

- **GIVEN** an image URL on a host that is not on the list
- **WHEN** a client requests it through the Next.js image endpoint
- **THEN** the endpoint refuses the request and does not fetch the URL

### Requirement: Server reads of the directory API identify the frontend

Every read (`GET`, `HEAD`) the frontend server makes to the origin of `DIRECTORY_API_URL` SHALL carry the header `x-frontend-render-token` with the value of `FRONTEND_RENDER_THROTTLE_TOKEN`, so the API's rate limit lets the reads that render pages through (LAB-3086). The header SHALL NOT be sent on writes, to any other origin, or from the browser. With no token configured, no header SHALL be sent.

#### Scenario: Crawler burst on profiles

- **GIVEN** `FRONTEND_RENDER_THROTTLE_TOKEN` is set on the frontend and the API
- **WHEN** a crawler requests many team profiles at once
- **THEN** every API read made to render them carries the token
- **AND** the API answers none of them 429

#### Scenario: Request to another host

- **WHEN** the frontend server fetches a URL outside the API's origin
- **THEN** the request does not carry the token

#### Scenario: Browser bundle

- **WHEN** a page is loaded in the browser
- **THEN** neither the HTML nor the JavaScript contains the token

### Requirement: Every response carries the security headers

Every response SHALL carry `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: SAMEORIGIN`, `Content-Security-Policy: frame-ancestors 'self'` and `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()`, and no `X-Powered-By`. The pages SHALL have one viewport tag, `width=device-width, initial-scale=1`, with no zoom limit (LAB-3094).

#### Scenario: Home page response

- **WHEN** a client requests `/home`
- **THEN** the response has the five headers and no `X-Powered-By`
- **AND** the HTML has one viewport tag, without `maximum-scale` or `user-scalable`

#### Scenario: Another site frames a page

- **WHEN** a page on another origin puts a directory page in an iframe
- **THEN** the browser refuses to show it

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

### Requirement: A new page opens at the top

When an in-app link or push opens a different page (a new pathname, or a new `view` on the same path, such as `/home?view=news`), the page SHALL open scrolled to the top, whatever the previous page's offset (LAB-3169). A change of other query parameters on the same page (filters, `?news=` story modals) SHALL keep the scroll position. Back and Forward, the first page load, and URLs with a `#hash` SHALL be left to the browser and Next.

#### Scenario: Focus-area link from the bottom of Home

- **GIVEN** a visitor scrolled down to "Browse by focus area" on `/home`
- **WHEN** they open Teams or Projects on a card
- **THEN** the list page opens at its top

#### Scenario: Filter on a list

- **GIVEN** a visitor scrolled down `/teams`
- **WHEN** they tick a filter
- **THEN** the page stays where it was

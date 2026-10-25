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

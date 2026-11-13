# accessibility Specification

## Purpose

What assistive technology, AI agents and touch users can rely on across the directory's main pages: images that say what they show, controls that have names, and tap targets big enough to hit.

## Requirements

### Requirement: Images and controls have names

Every meaningful image SHALL have an `alt` that says what it shows (a member photo its member's name, a team logo "<team> logo", a badge its meaning such as "Team lead"); a decorative image SHALL have `alt=""`. Every button, link and form control SHALL have an accessible name: icon-only controls through `aria-label`, filter checkboxes through their visible label (LAB-3095).

#### Scenario: Filter checkbox

- **GIVEN** the "Remote" option in a filter list
- **WHEN** assistive technology reads its checkbox
- **THEN** the checkbox is named "Remote"

#### Scenario: Icon-only search button

- **WHEN** assistive technology reads the search button that holds only an icon
- **THEN** it is named "Search"

### Requirement: Tap targets are at least 24px

Every interactive target on `/`, `/members`, `/jobs` and the team news rail SHALL be at least 24×24px or spaced so a 24px circle around it touches no other target (WCAG 2.5.8). A target may grow its hit area with transparent padding offset by a negative margin, so that it looks and lays out as before.

#### Scenario: News card actions

- **WHEN** an axe target-size check runs on `/`
- **THEN** the source pill, like, comment and "Show more" buttons pass, and look as they did

#### Scenario: Audit of the main pages

- **WHEN** axe runs the image-alt, label, button-name, link-name and target-size rules on `/members`, `/jobs` and `/` at 1280px and 390px
- **THEN** it reports no violations

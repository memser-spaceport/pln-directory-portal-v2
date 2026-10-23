# explore-pl-network Specification

> Seeded on 2026-10-23 (LAB-2968) for the top bar's section links only; correct me.
> The rest of the page (statement, figures, portfolio map, logo wall) is not specified here yet.

## Purpose

`/explore-pl-network` is a long, chromeless landing page about the Protocol Labs Network. Its sticky top bar lets a visitor go to each section of the page.

## Requirements

### Requirement: Section links in the top bar

The sticky top bar SHALL show four section links after the "Protocol Labs Network" mark, in this order: Focus areas (`#focus-areas`), Entities (`#entities`), Portfolio (`#portfolio`), Investors (`#investors`). It SHALL NOT show a FAQ link. A click on a link SHALL scroll smoothly to its section, SHALL show the section below the sticky bar, and SHALL set the address hash to the section id. The other pages that use the same top bar (SPV Spotlight) SHALL NOT show section links.

#### Scenario: Click on a section link

- **GIVEN** a visitor at the top of the page
- **WHEN** the visitor clicks "Portfolio" in the top bar
- **THEN** the page scrolls smoothly to the portfolio section, below the bar
- **AND** the address ends with `#portfolio`

#### Scenario: Shared section address

- **GIVEN** the address `/explore-pl-network#investors`
- **WHEN** the page loads
- **THEN** it opens at the Investors section, below the bar

### Requirement: The current section is marked

While the visitor scrolls, the link of the section under the bar SHALL be marked as current (`aria-current="location"` and a visible style). At most one link SHALL be marked at a time; above the first section, no link is marked.

#### Scenario: Scroll through the page

- **WHEN** the Entities section reaches the bottom of the bar
- **THEN** the Entities link is the only link marked as current

### Requirement: The mark goes back to the top

The mark and name SHALL be a "Back to top" button. A click SHALL scroll smoothly to the top of the page and SHALL remove the section hash from the address.

#### Scenario: Click on the mark

- **GIVEN** a visitor at the Entities section
- **WHEN** the visitor clicks the mark
- **THEN** the page scrolls smoothly to the top
- **AND** the address has no hash

### Requirement: Second row on narrow screens

Below 1200px wide, the section links SHALL show in a second row of the bar that scrolls sideways, and the current link SHALL stay in view in that row.

#### Scenario: Phone width

- **GIVEN** a screen 390px wide
- **WHEN** the page shows
- **THEN** the section links are in a second row of the bar that scrolls sideways

### Requirement: Navigation events

A click on a section link SHALL send `explore-pl-network-section-link-clicked` with `section` (the section id) and `source` (`header`, or `header-mobile` in the second row). A click on the mark SHALL send `explore-pl-network-logo-clicked`.

#### Scenario: Section link event

- **WHEN** a visitor on a desktop screen clicks "Portfolio"
- **THEN** `explore-pl-network-section-link-clicked` is sent with `section: portfolio` and `source: header`

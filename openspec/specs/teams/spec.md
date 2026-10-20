# teams Specification

## Purpose

What the teams directory listing at `/teams` gives a search engine crawler and a visitor: the first page of teams, with a link to each team profile, in the first HTML response.

## Requirements

### Requirement: The teams list is in the server HTML

The first HTML response for `/teams` SHALL contain the first page of teams for the URL's filters. Each listed team SHALL have its name and a link to `/teams/<uid>`, readable without running JavaScript.

#### Scenario: Unfiltered list, fetched without JavaScript

- **GIVEN** the directory has more teams than one page holds
- **WHEN** a client without cookies requests `/teams` and reads the HTML without running scripts
- **THEN** the HTML contains one page of teams, each with its name and an `<a href="/teams/<uid>">` link
- **AND** the HTML contains the list's toolbar with the total team count

#### Scenario: Filtered URL, fetched without JavaScript

- **GIVEN** a URL with a filter, such as `/teams?searchBy=<text>`
- **WHEN** a client without cookies requests it and reads the HTML without running scripts
- **THEN** the listed teams are the same teams the browser shows for that URL after it loads

#### Scenario: API failure on the server

- **GIVEN** the teams API fails while the server renders `/teams`
- **WHEN** the page loads in the browser
- **THEN** the browser loads the list itself, as it does today

### Requirement: The teams list behaves as before once loaded

Once `/teams` has loaded in the browser, filtering, sorting, the All and Following tabs, infinite scroll and following a team SHALL work as they do today. The server-rendered first page SHALL NOT be shown for any other combination of filters.

#### Scenario: Visitor changes a filter

- **GIVEN** `/teams` has loaded with the server-rendered first page
- **WHEN** the visitor selects a filter
- **THEN** the list shows the teams for that filter, not the server-rendered page

#### Scenario: Visitor scrolls past the first page

- **GIVEN** `/teams` has loaded with the server-rendered first page
- **WHEN** the visitor scrolls to the end of the list
- **THEN** the next page of teams loads and appends, as today

#### Scenario: No hydration error

- **GIVEN** a browser opens `/teams`, with or without filters in the URL
- **WHEN** the page hydrates
- **THEN** the browser console shows no hydration mismatch error

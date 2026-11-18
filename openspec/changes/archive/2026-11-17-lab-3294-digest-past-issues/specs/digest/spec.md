## ADDED Requirements

### Requirement: Past issues

The side cards SHALL end with "Past issues" when the API's `issues` lists more than one issue, and SHALL leave it out otherwise. Its title SHALL be a button that opens and closes the list. The list SHALL be closed when the page shows the newest listed issue and open when it shows an older one. Each row SHALL show the issue's date ("18 November 2026"), "· Latest" on the newest, and the issue's `title` when there is one, and SHALL link to the same page with the same link token: without `issue` for the link's own issue (`isLinkIssue`), with `issue=<sentAt>` for any other. The row of the issue on show SHALL be marked as the current page. `/digest?t=<token>&issue=<sentAt>` SHALL read that past issue, and More / Less on its stories SHALL send the same `issue`.

#### Scenario: Older issue

- **GIVEN** the API lists issues of 18, 16 and 12 November and the page shows 16 November from its own link
- **WHEN** the page loads
- **THEN** Past issues is open, 18 November shows "· Latest", 16 November is marked current, and 18 and 12 November link with `issue`

#### Scenario: One issue

- **GIVEN** the API lists only the link's own issue
- **WHEN** the page loads
- **THEN** there is no Past issues card

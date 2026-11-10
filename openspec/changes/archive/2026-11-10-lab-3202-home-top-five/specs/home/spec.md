## MODIFIED Requirements

### Requirement: This week's stories

The stories SHALL be the editorial top stories (rank 1 to 5) when there are any, then the newest stories. Beside the sidebar, the list SHALL show as many whole rows as fit that sidebar's height, and at least four when the sidebar is shorter. It SHALL measure again when the sidebar grows after the news has rendered. On a phone the list SHALL show three rows, then part of the next one. Each row SHALL show the team, the event type, the time, and the title. Opening a row SHALL open the story. Follow SHALL ask a signed-out visitor to sign up. Like SHALL open the "Join the network" card as a modal, with Sign up and Sign in. "See all updates →" SHALL open `/home?view=news`.

#### Scenario: Editorial picks first

- **GIVEN** two stories with editorial rank 1 and 2, and newer unranked stories
- **WHEN** a signed-out visitor opens `/home`
- **THEN** the two ranked stories come first, then the newest unranked stories

### Requirement: One stream of news and forum posts

Network Updates SHALL be one stream of the last 14 days' news stories and, for members with forum access, forum posts, each shown in full. There SHALL be no All / News / Forum or focus-area tabs. A member without forum access SHALL see news only. Hiring roll-ups, deals and For You job entries SHALL NOT be in the stream; roles and deals are in the rail.

Above the stream, the filter row SHALL offer For You · All · Top · Discussions · Funding · Launch · Announcement, each with its count. It SHALL also offer "Sort by" with Latest, Following and Most popular. Pill behaviour:

- A pill whose count is 0 SHALL be hidden.
- Pressing the active pill SHALL reset to All.
- On phones the pills SHALL be a "Type:" dropdown.
- Discussions SHALL show forum posts only, and is present only for members with forum access.
- Top SHALL show the editorial top stories (rank 1 to 5).
- For You SHALL show what production's For You shows.

Under the pills, on every filter, a line SHALL read "For you · Curated from your profile, your team, and the teams you follow." followed by a "News preferences" link to `/settings/news-preferences` (LAB-3174).

Milestone, Partnership and Other stories SHALL stay under All and keep their label on the card.

The editorial top stories SHALL be labelled "Top story" on their card where they stand in the stream. They are not pinned.

#### Scenario: Member without forum access

- **GIVEN** a member without forum access
- **WHEN** they open `/home`
- **THEN** the stream has news only, and there is no Discussions pill

#### Scenario: Top pill

- **GIVEN** five stories with editorial rank 1 to 5, and one unranked story
- **WHEN** the member presses Top
- **THEN** only those five show, each labelled "Top story"
- **AND** pressing Top again returns to All

#### Scenario: Empty pill

- **GIVEN** no Launch stories in the last 14 days
- **WHEN** the member opens `/home`
- **THEN** there is no Launch pill

#### Scenario: News preferences link

- **WHEN** the member follows the "News preferences" link under the pills
- **THEN** it opens `/settings/news-preferences`

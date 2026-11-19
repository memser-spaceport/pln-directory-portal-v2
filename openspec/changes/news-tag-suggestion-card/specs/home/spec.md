# Spec Delta

## MODIFIED Requirements

### Requirement: One stream of news and forum posts

Network Updates SHALL be one stream of the last 14 days' news stories and, for members with forum access, forum posts, each shown in full. There SHALL be no All / News / Forum or focus-area tabs. A member without forum access SHALL see news only. Hiring roll-ups, deals and For You job entries SHALL NOT be in the stream; roles and deals are in the rail.

Above the stream, the filter row SHALL offer For You · All · Top · Discussions · Funding · Launch · Announcement, each with its count. It SHALL also offer "Sort by" with Latest, Following and Most popular. Pill behaviour:

- A pill whose count is 0 SHALL be hidden.
- Pressing the active pill SHALL reset to All.
- On phones the pills SHALL be a "Type:" dropdown.
- Discussions SHALL show forum posts only, and is present only for members with forum access.
- Top SHALL show the editorial top stories (rank 1 to 5).
- For You SHALL show what production's For You shows.

Under the pills, on every filter, a member who is shown neither the set-up line nor the tag card SHALL see a line that reads "For you · Curated from your profile, your team, and the teams you follow." followed by a "News preferences" link to `/settings/news-preferences` (LAB-3174).

A signed-in member whose default news tags are not approved and not set by the member, while News preferences is on, SHALL instead see the tag card (team-news spec, "Tag card") in that place, on the For You filter and on the All view when no topic filter and no search text is set. On any other filter, with a topic filter, or with search text, the card SHALL be hidden; the curated line SHALL then show, unless the member is one the set-up line is for.

A signed-in member with no For You stories, no news tags and no followed teams, while News preferences is on and the tag card is not shown, SHALL instead see "For you · Get news picked for you. Choose your topics and teams in News preferences." on the All view when no topic filter and no search text is set. Own teams do not hide the line. The link SHALL read "Open News preferences →" and open `/settings/news-preferences?from=feed`. A topic filter, a pill other than All, or search text SHALL hide that line and SHALL NOT show the curated line. The line SHALL record `team-news-for-you-setup-shown` once per page load, and a click SHALL record `team-news-for-you-setup-clicked`. When the member's tags are unknown, the member follows a team, the member has a news tag, For You has stories, or News preferences is off, the curated line SHALL stay.

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

- **GIVEN** a member who is shown neither the set-up line nor the tag card
- **WHEN** the member follows the "News preferences" link under the pills
- **THEN** it opens `/settings/news-preferences`

#### Scenario: Member with unapproved default tags

- **GIVEN** a signed-in member whose default news tags are not approved, and News preferences on
- **WHEN** they open `/home` on All, with no topic filter and no search, or on For You
- **THEN** the tag card shows under the pills, and the curated line and the set-up line do not
- **AND** pressing the Top pill hides the card and shows the curated line

#### Scenario: Member with nothing For You can match on

- **GIVEN** a signed-in member with no For You stories, no news tags and no followed teams, and News preferences on, whose default tags are empty
- **WHEN** they open `/home` on All, with no topic filter and no search
- **THEN** the line reads "For you · Get news picked for you. Choose your topics and teams in News preferences." and "Open News preferences →" opens `/settings/news-preferences?from=feed`
- **AND** a topic filter, another pill or search text hides that line, and the curated line does not show

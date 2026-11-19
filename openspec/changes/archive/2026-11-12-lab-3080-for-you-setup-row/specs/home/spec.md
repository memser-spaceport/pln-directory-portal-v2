## MODIFIED Requirements

### Requirement: One stream of news and forum posts

Under the pills, on every filter, a member who has an own team, a followed team or a news tag SHALL see a line that reads "For you · Curated from your profile, your team, and the teams you follow." followed by a "News preferences" link to `/settings/news-preferences` (LAB-3174).

A signed-in member with no own teams, no followed teams and no news tags, while News preferences is on, SHALL instead see "For you · Get news picked for you. Choose your topics and teams in News preferences." on the All view when no topic filter and no search text is set. The link SHALL read "Open News preferences →" and open `/settings/news-preferences?from=feed`. A topic filter, a pill other than All, or search text SHALL hide that line and SHALL NOT show the curated line. The line SHALL record `team-news-for-you-setup-shown` once per page load, and a click SHALL record `team-news-for-you-setup-clicked`. When the member's tags are unknown, or News preferences is off, the curated line SHALL stay.

#### Scenario: News preferences link

- **GIVEN** a member who has an own team, a followed team or a news tag
- **WHEN** the member follows the "News preferences" link under the pills
- **THEN** it opens `/settings/news-preferences`

#### Scenario: Member with nothing For You can match on

- **GIVEN** a signed-in member with no own teams, no followed teams and no news tags, and News preferences on
- **WHEN** they open `/home` on All, with no topic filter and no search
- **THEN** the line reads "For you · Get news picked for you. Choose your topics and teams in News preferences." and "Open News preferences →" opens `/settings/news-preferences?from=feed`
- **AND** a topic filter, another pill or search text hides that line, and the curated line does not show

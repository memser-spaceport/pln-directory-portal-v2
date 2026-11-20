## MODIFIED Requirements

### Requirement: Digest page

The page `/digest?t=<token>` SHALL show the digest named by the link token to anyone who opens it, signed in or not, with no sign-in prompt. It SHALL show the LabOS top bar on desktop and the bottom bar on mobile. The page SHALL be a plain white page with the stories in a 760px column, with no grey background, white sheet or PL logo. It SHALL start with a dateline ("Weekly digest · 9 November 2026 · 5 stories", "Daily digest" for a daily link), then the greeting "Hi <first name>," as the page title (or "Hi there," without a name) and the intro line, all left-aligned. Then it SHALL show every story in the order the API returns it, each in full, as an open section with a hairline between stories and no card: the team header (logo or initials, the team name linking to the team profile, Follow), the title and summary beside the image, the full text, and a Sources line listing every source with a link that opens in a new tab. The first story is the hero: its title and summary beside a big image, with no background picture. The other stories put the image beside the text, alternating sides. The top story keeps its "Top story" badge. The page SHALL NOT show "Read on <source>", Read more or Show less. Then it SHALL show a "Recent forum posts" section with each post in full and a "Reply in the forum" link. The page SHALL NOT open a story modal. The page SHALL NOT be indexed by search engines. Dates SHALL print the same on the server and in the browser.

#### Scenario: Signed-out member

- **GIVEN** a signed-out visitor with a valid link
- **WHEN** they open the page
- **THEN** they see the whole digest, and no sign-in prompt shows

#### Scenario: Forum unavailable

- **GIVEN** the API returns no forum posts because the forum did not answer
- **WHEN** the page shows
- **THEN** the stories show, and the forum section is not shown

#### Scenario: Story with three sources

- **GIVEN** a story with sources techcrunch.com, theblock.co and cryptobriefing.com
- **WHEN** the page shows
- **THEN** the story ends with "Sources: techcrunch.com · theblock.co · cryptobriefing.com", each a link to its article

## ADDED Requirements

### Requirement: Follow, Comments and Share on a story

Each story's team header SHALL have Follow, which starts from the API's `followsTeam` for the link's member. A press SHALL follow or unfollow the team for the signed-in member, update every story of that team on the page, and revert if the save fails. Each story's actions row SHALL have More like this and Less like this, then Comments (the feed's button, with the API's comment count) and Share (the feed's share menu, sharing the story's Home link, never the digest link). Comments SHALL open the feed's comment thread under the story. A signed-out reader who presses Follow, or signs in from the comment thread, SHALL go to sign-in and come back to the same digest link.

#### Scenario: Follow when signed out

- **GIVEN** a signed-out reader on a valid link
- **WHEN** they press Follow on a story
- **THEN** sign-in opens and no follow is saved

#### Scenario: Two stories from one team

- **GIVEN** a signed-in reader and two stories from the same team, not followed
- **WHEN** they press Follow on the first
- **THEN** both stories show Following

### Requirement: End of the issue and side cards

After the stories and forum posts, the page SHALL show "You're all caught up" with a check, "The next digest arrives on <weekday>, <day> <month>." from the API's `nextSendAt` (the line is left out when it is missing), and a "See all network news" link to Home. When the API's `isTeamMember` is true, the page SHALL show the outlined "Got news from your team?" card with "Post your team news →". It SHALL open the Post news modal for the signed-in member's main team, or their only team, or their first team; a signed-out reader goes to sign-in instead, and a member with no team sees "Your profile has no team to post for yet." A link with `postnews=open` SHALL open the modal on load the same way. From 1100px the side cards SHALL sit in a sticky column on the right; under 1100px they SHALL follow "You're all caught up". The side cards SHALL include "How personalization works": "Stories come from your topics first, then the teams you follow, then the network's top stories."

#### Scenario: Not on a team

- **GIVEN** the API returns `isTeamMember: false`
- **WHEN** the page shows
- **THEN** "Got news from your team?" is not shown

#### Scenario: Narrow screen

- **GIVEN** a 390px wide screen
- **WHEN** the page shows
- **THEN** there is no side column, and "How personalization works" follows "You're all caught up"

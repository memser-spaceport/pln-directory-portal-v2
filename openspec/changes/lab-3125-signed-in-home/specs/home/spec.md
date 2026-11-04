## ADDED Requirements

### Requirement: The signed-in Home

With `NEXT_PUBLIC_SHOW_HOME_V2` on, a signed-in member's `/home` SHALL show:

- **Network Updates:** a stream beside one rail. On phones the rail stacks after the stream.
- **The focus-area cards** under both. They are the same as on the signed-out page.

It SHALL NOT show Quick Actions, the focus-area tabs, the Top stories band, the previous rail or the previous focus-area section. With the flag off, the signed-in Home SHALL be unchanged.

#### Scenario: Signed in with the flag on

- **GIVEN** the flag is on
- **WHEN** a signed-in member opens `/home` at 1440, 768 or 375 px wide
- **THEN** the page shows Network Updates, the rail and the focus-area cards, with no Quick Actions and no horizontal scroll

### Requirement: One stream of news and forum posts

Network Updates SHALL be one stream of the last 14 days' news stories and, for members with forum access, forum posts, each shown in full. There SHALL be no All / News / Forum or focus-area tabs. A member without forum access SHALL see news only. Hiring roll-ups, deals and For You job entries SHALL NOT be in the stream; roles and deals are in the rail.

Above the stream, the filter row SHALL offer For You · All · Top · Discussions · Funding · Launch · Announcement, each with its count. It SHALL also offer "Sort by" with Latest, Following and Most popular. Pill behaviour:

- A pill whose count is 0 SHALL be hidden.
- Pressing the active pill SHALL reset to All.
- On phones the pills SHALL be a "Type:" dropdown.
- Discussions SHALL show forum posts only, and is present only for members with forum access.
- Top SHALL show the editorial top stories (rank 1 to 3).
- For You SHALL show what production's For You shows.

Milestone, Partnership and Other stories SHALL stay under All and keep their label on the card.

The editorial top stories SHALL be labelled "Top" on their card where they stand in the stream. They are not pinned.

#### Scenario: Member without forum access

- **GIVEN** a member without forum access
- **WHEN** they open `/home`
- **THEN** the stream has news only, and there is no Discussions pill

#### Scenario: Top pill

- **GIVEN** three stories with editorial rank 1 to 3
- **WHEN** the member presses Top
- **THEN** only those three show, each labelled Top
- **AND** pressing Top again returns to All

#### Scenario: Empty pill

- **GIVEN** no Launch stories in the last 14 days
- **WHEN** the member opens `/home`
- **THEN** there is no Launch pill

### Requirement: The stream ends where the rail ends

On screens wide enough for the rail to sit beside the stream, the stream SHALL be cut level with the bottom of the rail. The last visible card fades out, and under it "See all news" opens `/home?view=news`. The faded card SHALL NOT respond to clicks. On phones the stream SHALL show three cards, then 140px of a fourth, faded, then "See all news".

#### Scenario: Desktop cut

- **GIVEN** a 1440 px wide screen
- **WHEN** the member scrolls to the end of Network Updates
- **THEN** the stream's faded edge and the rail's bottom line up, with "See all news" under the fade

### Requirement: The signed-in rail

The rail SHALL be one card, with sections divided by hairlines, in this order:

1. **Open roles:** as on the signed-out page, without the sign-up note.
2. **Upcoming events:** as on the signed-out page, absent when there are none.
3. **Teams to follow:** the member's suggestions, with Follow.
4. **Deals:**
   - Only for members with deals access. Without access the section is absent, with no locked teaser.
   - It sits on a tinted panel under the "Portfolio perks" label.
   - It lists the three newest deals, each with the vendor mark, the name, the line, and a green value pill when the deal has an offer value.
   - It ends with "See all N deals →".
5. **Popular this week:** the week's most-liked stories. A row opens the story.

#### Scenario: Member without deals access

- **GIVEN** a member without `deals.read`
- **WHEN** they open `/home`
- **THEN** the rail has no deals section

#### Scenario: Deal value pill

- **GIVEN** a member with deals access, and a deal whose offer value is "12 mo free"
- **WHEN** the rail renders
- **THEN** that deal's row shows a "12 mo free" pill
- **AND** a deal with no offer value shows no pill

### Requirement: Signed-in Home analytics

The signed-in Home SHALL record these PostHog events:

- `home-deal-clicked`, with `deal_uid` and `position`;
- `home-feed-tag-scope-changed`, with `tags` (the selected list) and `action` (`add`, `remove`, `clear` or `narrow`).

It SHALL also record `home-role-clicked`, `home-event-clicked`, `home-see-all-clicked` and `home-focus-area-clicked`, as on the signed-out page. The existing team-news and forum feed events SHALL keep firing.

#### Scenario: Deal opened from the rail

- **WHEN** a member with deals access opens the second deal in the rail
- **THEN** `home-deal-clicked` is recorded with that deal's uid and `position` = 2

# home Specification

## Purpose

What `/home` shows to signed-out visitors and signed-in members, in what order, and where its data comes from. The new Home (LAB-3070) is behind `NEXT_PUBLIC_SHOW_HOME_V2`.

## Requirements

### Requirement: The new Home is behind a flag

`/home` SHALL show the new Home only when the build-time flag `NEXT_PUBLIC_SHOW_HOME_V2` is `true`. With the flag off, `/home` SHALL render as it did before this change for every viewer. With the flag on, a signed-out visitor SHALL get the signed-out story below. Until the signed-in view ships, a signed-in member SHALL keep the previous Home.

#### Scenario: Flag off

- **GIVEN** `NEXT_PUBLIC_SHOW_HOME_V2` is not `true`
- **WHEN** anyone opens `/home`
- **THEN** the page is the previous Home, with the Welcome card, the news feed and the focus areas

#### Scenario: Flag on, signed out

- **GIVEN** the flag is on
- **WHEN** a signed-out visitor opens `/home`
- **THEN** the page is the signed-out story

### Requirement: The signed-out story

With the flag on, a signed-out visitor's `/home` SHALL show these sections in order, all in the server HTML:

1. **Hero:**
   - The mission "Protocol Labs drives breakthroughs in computing to push humanity forward." as the page's `<h1>`, at 40/48 on desktop and 32/40 on phones, with no overline.
   - One sentence under it.
   - A "Join the network" card with "Sign up for free" (primary) and "Sign in".
2. **Figures band:** the four network figures on a full-width white strip.
3. **This week:**
   - Three news stories, with "See all updates →".
   - Beside them, one sidebar with open roles and upcoming events.
4. **The portfolio:**
   - The islands map, then four focus-area cards.
   - On phones the map is clamped to 640px with a fade and a "Show the whole map" button that unclamps it.
5. **Protocol Labs entities:** a row of the PL entities, each linking out.
6. **Investor logo wall.**
7. **Footer:**
   - The logo and mission.
   - Directory, Network and Protocol Labs link columns.
   - "©" and "Contact support", which opens the support form.

The page SHALL NOT show the Welcome card, the previous news feed, the previous focus-area section or the About foot.

#### Scenario: Sections in order

- **GIVEN** the flag is on
- **WHEN** a signed-out visitor opens `/home` at 1440, 768 or 375 px wide
- **THEN** the hero, figures, This week, portfolio, entities, logo wall and footer appear in that order with no horizontal scroll

#### Scenario: Auth doors

- **GIVEN** the flag is on and a signed-out visitor on `/home`
- **WHEN** they press "Sign up for free"
- **THEN** sign-up opens
- **AND** "Sign in" starts the same sign-in as the navbar's Sign in

#### Scenario: Map on a phone

- **GIVEN** a 375 px wide screen
- **WHEN** the visitor reaches the portfolio
- **THEN** the map is cut at 640 px under a fade with "Show the whole map"
- **AND** pressing it shows the whole map

### Requirement: This week's stories

The three stories SHALL be the editorial top stories (rank 1 to 3) when there are any, topped up with the newest stories so that there are always three when three exist. Each row SHALL show the team, the event type, the time, and the title. Opening a row SHALL open the story. Follow and Like SHALL ask a signed-out visitor to sign up. "See all updates →" SHALL open `/home?view=news`.

#### Scenario: Editorial picks first

- **GIVEN** two stories with editorial rank 1 and 2, and newer unranked stories
- **WHEN** a signed-out visitor opens `/home`
- **THEN** This week shows the two ranked stories, then the newest unranked story

### Requirement: Open roles and upcoming events beside the news

The sidebar SHALL list the newest open roles, with "See all N jobs" where N is the total number of open roles. It SHALL list up to three events that start in the next 30 days, soonest first, with "See all" to the events page. Signed out, the roles section SHALL carry the note "Sign up to apply with your directory profile.", where "Sign up" opens sign-up.

When no event starts in the next 30 days, the events section SHALL be absent and the roles section SHALL list five roles instead of three.

#### Scenario: Events this month

- **GIVEN** events starting in 3, 20 and 45 days
- **WHEN** a signed-out visitor opens `/home`
- **THEN** the sidebar shows three roles, then the events in 3 and 20 days

#### Scenario: No events this month

- **GIVEN** no event starts in the next 30 days
- **WHEN** a signed-out visitor opens `/home`
- **THEN** there is no events section and five roles show

#### Scenario: A data source fails

- **GIVEN** the roles or the events request fails
- **WHEN** the page renders
- **THEN** that section is absent, and the rest of the page renders

### Requirement: Focus-area cards

Under the map, the page SHALL show one card for each of the portfolio's four focus areas. Each card SHALL show:

- the number of portfolio teams on that area's island, as "N portfolio teams";
- a pile of those teams' logos;
- the area's name and its one-line description;
- "Teams →" to `/teams?focusAreas=<title>`;
- "Projects →" to `/projects?focusAreas=<title>`, only when the directory has at least one project in that area. Without it, "Teams →" takes the whole foot of the card.

`<title>` SHALL be the directory's own focus-area title (for example "Neurotech", not "Neurotechnology"), so that every link lands on a list that is not empty. When the project counts can't be loaded, every card SHALL keep its "Projects →" link.

#### Scenario: Neurotech link

- **WHEN** a visitor presses "Teams →" on the neurotechnology card
- **THEN** `/teams?focusAreas=Neurotech` opens, filtered to at least one team

#### Scenario: An area with no projects

- **GIVEN** no project is in the Neurotech focus area
- **WHEN** a visitor looks at the neurotechnology card
- **THEN** it has "Teams →" and no "Projects →"

### Requirement: Home click analytics

The new Home SHALL record these PostHog events:

| Event                     | Properties                                     |
| ------------------------- | ---------------------------------------------- |
| `home-auth-door-clicked`  | `door` (`sign_up` or `sign_in`), `section`     |
| `home-news-pick-clicked`  | `news_uid`, `position`                         |
| `home-role-clicked`       | `team_uid`, `position`, `signed_in`            |
| `home-event-clicked`      | `event_uid`, `position`, `signed_in`           |
| `home-focus-area-clicked` | `area`, `target` (`teams` or `projects`)       |
| `home-see-all-clicked`    | `section` (`news`, `roles`, `events` or `map`) |

#### Scenario: Sign-up door in the hero

- **WHEN** a signed-out visitor presses "Sign up for free" in the hero
- **THEN** `home-auth-door-clicked` is recorded with `door` = `sign_up` and `section` = `hero`

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

The editorial top stories SHALL be labelled "Top story" on their card where they stand in the stream. They are not pinned.

#### Scenario: Member without forum access

- **GIVEN** a member without forum access
- **WHEN** they open `/home`
- **THEN** the stream has news only, and there is no Discussions pill

#### Scenario: Top pill

- **GIVEN** three stories with editorial rank 1 to 3
- **WHEN** the member presses Top
- **THEN** only those three show, each labelled "Top story"
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
   - It sits under the "Portfolio perks" label, as bordered white rows between the rail's hairlines (the prototype dropped the blue tint on 2026-11-03).
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

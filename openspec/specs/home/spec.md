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
- "Projects →" to `/projects?focusAreas=<title>`.

`<title>` SHALL be the directory's own focus-area title (for example "Neurotech", not "Neurotechnology"), so that every link lands on a list that is not empty.

#### Scenario: Neurotech link

- **WHEN** a visitor presses "Teams →" on the neurotechnology card
- **THEN** `/teams?focusAreas=Neurotech` opens, filtered to at least one team

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

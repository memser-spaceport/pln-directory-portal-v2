# home Specification

## Purpose

What `/home` shows to signed-out visitors and signed-in members, in what order, and where its data comes from. The new Home (LAB-3070) is behind `NEXT_PUBLIC_SHOW_HOME_V2`.

## Requirements

### Requirement: The new Home is behind a flag

`/home` SHALL show the new Home only when the build-time flag `NEXT_PUBLIC_SHOW_HOME_V2` is `true`. With the flag off, `/home` SHALL render as it did before this change for every viewer, and `?view=news` SHALL be ignored. With the flag on, a signed-out visitor SHALL get the signed-out story below, a signed-in member the signed-in Home, and anyone who opens `/home?view=news` the news page.

#### Scenario: Flag off

- **GIVEN** `NEXT_PUBLIC_SHOW_HOME_V2` is not `true`
- **WHEN** anyone opens `/home` or `/home?view=news`
- **THEN** the page is the previous Home, with the Welcome card, the news feed and the focus areas

#### Scenario: Flag on, signed out

- **GIVEN** the flag is on
- **WHEN** a signed-out visitor opens `/home`
- **THEN** the page is the signed-out story

#### Scenario: Flag on, news view

- **GIVEN** the flag is on
- **WHEN** a member or a signed-out visitor opens `/home?view=news`
- **THEN** the page is the news page

### Requirement: The signed-out story

With the flag on, a signed-out visitor's `/home` SHALL show these sections in order, all in the server HTML:

1. **Hero:**
   - The mission "Protocol Labs drives breakthroughs in computing to push humanity forward." as the page's `<h1>`, at 40/48 on desktop, 32/40 on tablets and 24/32 on phones, with no overline.
   - One sentence under it.
   - On phones only, the four network figures, between that sentence and the Join card.
   - A "Join the network" card with "Sign up for free" (primary) and "Sign in".
2. **Figures band:** the four network figures on a full-width white strip, from 640px (phones have them in the hero).
3. **This week:**
   - News stories, with "See all updates →" in the header and again as "See all N updates", the list's last row, where N is the news page's story count. Beside the sidebar, the list is cut to the sidebar height.
   - Beside them, one sidebar with open roles and upcoming events.
4. **The portfolio:**
   - The islands map, then four focus-area cards.
   - On phones the map is clamped to 640px with a fade and a "Show the whole map" button that unclamps it.
5. **Protocol Labs entities:** a row of the PL entities, each linking out.
6. **Join the network again:** the hero's card as a band across the content (copy and faces on the left, Sign up and Sign in in a row on the right from 960px; the stacked card below that).
7. **Investor logo wall:** each logo with a known site links to it in a new tab; the rest stay plain images.
8. **Footer:**
   - The logo and mission.
   - Directory, Network and Protocol Labs link columns.
   - "©" and "Contact support", which opens the support form.

The page SHALL NOT show the Welcome card, the previous news feed, the previous focus-area section or the About foot.

#### Scenario: Sections in order

- **GIVEN** the flag is on
- **WHEN** a signed-out visitor opens `/home` at 1440, 768 or 375 px wide
- **THEN** the hero, figures, This week, portfolio, entities, the second Join card, logo wall and footer appear in that order with no horizontal scroll

#### Scenario: A shorter top on phones (LAB-3174)

- **GIVEN** a 375 px wide screen
- **WHEN** a signed-out visitor opens `/home`
- **THEN** the headline is 24/32 and the four figures show before "Sign up for free"
- **AND** there is no separate figures band

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

The stories SHALL be the editorial top stories (rank 1 to 3) when there are any, then the newest stories. Beside the sidebar, the list SHALL show as many whole rows as fit that sidebar's height, and at least four when the sidebar is shorter. It SHALL measure again when the sidebar grows after the news has rendered. On a phone the list SHALL show three rows, then part of the next one. Each row SHALL show the team, the event type, the time, and the title. Opening a row SHALL open the story. Follow SHALL ask a signed-out visitor to sign up. Like SHALL open the "Join the network" card as a modal, with Sign up and Sign in. "See all updates →" SHALL open `/home?view=news`.

#### Scenario: Editorial picks first

- **GIVEN** two stories with editorial rank 1 and 2, and newer unranked stories
- **WHEN** a signed-out visitor opens `/home`
- **THEN** the two ranked stories come first, then the newest unranked stories

### Requirement: Open roles and upcoming events beside the news

The sidebar SHALL list the newest open roles, with "See all N jobs" where N is the total number of open roles. It SHALL list up to three events that start in the next 30 days, soonest first, with "See all" to the events page. Signed out, a full-width primary "Sign up to apply" button SHALL sit above "See all N jobs" and open sign-up.

When no event starts in the next 30 days, the events section SHALL be absent and the roles section SHALL list five roles instead of three.

Each event SHALL open All Events with that event's details open (`/events/all?embedPath=/embed/program#<slug>`). The slug is rebuilt from the event's name the way the events calendar makes it, because the Directory doesn't store it; where two calendar events share a slug, the calendar opens the first, and a name that matches none opens the calendar with no event open.

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

- the number of teams "Teams →" lists, as "N teams" (LAB-3162), read from the same search the Teams page counts;
- a pile of up to four logos: the island's portfolio teams that have a Directory logo, in their own colours on white (LAB-3174);
- the area's name and its one-line description;
- "Teams →" to `/teams?focusAreas=<title>`;
- "Projects →" to `/projects?focusAreas=<title>`, only when the directory has at least one project in that area. Without it, "Teams →" takes the whole foot of the card.

`<title>` SHALL be the directory's own focus-area title (for example "Neurotech", not "Neurotechnology"), so that every link lands on a list that is not empty. When the project counts can't be loaded, every card SHALL keep its "Projects →" link. When the team counts can't be loaded, the cards SHALL show no number.

#### Scenario: Neurotech link

- **WHEN** a visitor presses "Teams →" on the neurotechnology card
- **THEN** `/teams?focusAreas=Neurotech` opens, filtered to at least one team

#### Scenario: The count matches the list

- **GIVEN** the Teams page lists 360 teams for `/teams?focusAreas=Digital Human Rights`
- **WHEN** a visitor looks at the Digital Human Rights card
- **THEN** it says "360 teams"

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

### Requirement: The signed-in network overview

Under the focus-area cards, the signed-in Home SHALL show a full-width white band (LAB-3174): "Protocol Labs portfolio" with the portfolio map (Map and List, clamped on phones as signed out), then the PL entities, then the investor logo wall with its links.

#### Scenario: Below the focus areas

- **GIVEN** a signed-in member on `/home` with the flag on
- **WHEN** they scroll past "Browse by focus area"
- **THEN** they see the portfolio map, the PL entities and the investor logos, in that order

### Requirement: One stream of news and forum posts

Network Updates SHALL be one stream of the last 14 days' news stories and, for members with forum access, forum posts, each shown in full. There SHALL be no All / News / Forum or focus-area tabs. A member without forum access SHALL see news only. Hiring roll-ups, deals and For You job entries SHALL NOT be in the stream; roles and deals are in the rail.

Above the stream, the filter row SHALL offer For You · All · Top · Discussions · Funding · Launch · Announcement, each with its count. It SHALL also offer "Sort by" with Latest, Following and Most popular. Pill behaviour:

- A pill whose count is 0 SHALL be hidden.
- Pressing the active pill SHALL reset to All.
- On phones the pills SHALL be a "Type:" dropdown.
- Discussions SHALL show forum posts only, and is present only for members with forum access.
- Top SHALL show the editorial top stories (rank 1 to 3).
- For You SHALL show what production's For You shows.

Under the pills, on every filter, a line SHALL read "For you · Curated from your profile, your team, and the teams you follow." followed by an "Update your profile" link to `/settings/profile` (LAB-3174).

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

### Requirement: Forum posts under Most popular

Under Most popular, forum posts SHALL rank by likes against the stories' upvotes. The best-ranked post that has a like or a comment SHALL come second, after the first story. A post with no likes and no comments SHALL NOT be promoted; it keeps its ranked place, below every story with an upvote (LAB-3163).

#### Scenario: A post nobody engaged with

- **GIVEN** a forum post with 0 likes and 0 comments, and stories with upvotes
- **WHEN** the member sorts by Most popular
- **THEN** the post shows after those stories, not second

### Requirement: The stream ends where the rail ends

On screens wide enough for the rail to sit beside the stream, the stream SHALL be cut level with the bottom of the rail, using the rail's content height when that is taller than its box. The stream SHALL show at least four whole cards when the rail is shorter than that. The cut SHALL be measured again when the rail grows after the news has rendered. The last visible card fades out, and under it "See all news" opens `/home?view=news`. The faded card SHALL NOT respond to clicks. On phones the stream SHALL show three cards, then 140px of a fourth, faded, then "See all news". Every filter, including For You, uses this cut.

#### Scenario: Desktop cut

- **GIVEN** a 1440 px wide screen
- **WHEN** the member scrolls to the end of Network Updates
- **THEN** the stream's faded edge and the rail's bottom line up, with "See all news" under the fade

### Requirement: News stories show their image

With the flag on, a news story whose `imageUrl` is set SHALL show that image (LAB-3134). The image SHALL be 16:9 with `object-fit: cover`, a 1px `--border-neutral-subtle` border and `alt=""`, and SHALL load lazily. Its radius SHALL be 10px on cards and 12px in the story dialog. The stored URL SHALL be served as is, with no `srcset` (resized copies come with LAB-3135).

- **Signed-in stream card:** a 168 × 95 thumbnail right of the text from 640px wide. Below 640px it SHALL take the card's full width under the text, before the meta line.
- **Story dialog:** the header image under the headline and above the body, at the dialog's full width up to 632 × 356. This applies to the dialog the new Home opens, signed in or signed out.
- **News page card** (`?view=news`, LAB-3126): the card's full width under the tags and above the meta line, on every width, at most 592 × 333. Image and meta line SHALL sit on the card's floor, so the images in a row line up.
- The signed-out This week rows SHALL NOT show an image.

The image SHALL NOT be a separate control: clicking it SHALL open the story as the rest of the row does. While it loads, and if it fails, the frame SHALL show a soft brand gradient tile, never a broken image. A story without `imageUrl` SHALL be text-only.

With the flag off nothing SHALL change. The previous Home's cards and its story dialog, and the team and member profiles' news, SHALL stay text-only.

#### Scenario: Thumbnail on desktop

- **GIVEN** the flag is on and a story in the signed-in stream has an `imageUrl`
- **WHEN** the member views `/home` at 1440 px wide
- **THEN** the card shows the image as a 168 × 95 thumbnail right of the headline, summary and tags
- **AND** clicking the image opens the story's dialog once

#### Scenario: Full width on phones

- **GIVEN** the same story
- **WHEN** the member views `/home` at 375 px wide
- **THEN** the image takes the card's full width under the text and above the meta line

#### Scenario: The image fails to load

- **GIVEN** a story whose `imageUrl` returns an error
- **WHEN** its card or dialog renders
- **THEN** the frame shows the brand gradient tile and no broken image

#### Scenario: Story without an image

- **GIVEN** a story with no `imageUrl`
- **WHEN** its card renders in the stream
- **THEN** the card is text-only, as before

#### Scenario: Dialog header

- **GIVEN** the flag is on and a story with an `imageUrl`
- **WHEN** the reader opens it from the new Home
- **THEN** the dialog shows the image under the headline and above the body, at most 632 × 356

#### Scenario: Previous Home unchanged

- **GIVEN** the flag is off and a story with an `imageUrl`
- **WHEN** a member opens `/home` and then the story
- **THEN** neither the card nor the dialog shows the image

#### Scenario: News page card

- **GIVEN** the flag is on and a story with an `imageUrl`
- **WHEN** anyone opens `/home?view=news`
- **THEN** the story's card shows the image at the card's full width under its tags, with the meta line under it

### Requirement: The signed-in rail

The rail SHALL be one card, with sections divided by hairlines, in this order:

1. **Open roles:** as on the signed-out page, without the sign-up note.
2. **Upcoming events:** as on the signed-out page, absent when there are none.
3. **Teams to follow:** the member's suggestions, with Follow; once followed it reads Following, and pressing it again unfollows (LAB-3185).
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

### Requirement: The news page

"See all news" (signed in) and "See all updates" (signed out) SHALL open `/home?view=news`: the last 14 days' network news only, with no forum posts, roll-ups or deals. The head SHALL show "← Home", "Network news" as the page's only `<h1>`, and "N stories from network teams". The stories SHALL be production's boxed news card with its `#tag` links, in 2 columns from 640px and 1 below. Signed out, Follow SHALL open sign-up. Like SHALL open the "Join the network" card as a modal. Closing the sign-up form opened from that modal, or from "Personalize my news", SHALL leave the reader at the same scroll position. The story dialog SHALL open without a scale animation, and closing it SHALL NOT show the dialog again.

#### Scenario: News only

- **GIVEN** the flag is on and a member with forum access
- **WHEN** they open `/home?view=news` at 1440, 768 or 375 px wide
- **THEN** only news cards show, in 2, 2 and 1 columns

#### Scenario: Signed out

- **GIVEN** a signed-out visitor on the news page
- **WHEN** they press Follow on a card
- **THEN** sign-up opens
- **AND WHEN** they press Like on a card
- **THEN** the "Join the network" modal opens, and sign-up does not
- **AND** pressing the card itself opens the story

#### Scenario: No news

- **GIVEN** the news call fails
- **WHEN** anyone opens the news page
- **THEN** the page says news isn't available right now, and does not show the error page

### Requirement: Back to top on the news page

Once the reader is more than one screen down the news page, a "Back to top" button SHALL show in the bottom-right corner, whichever way they are scrolling, and pressing it SHALL scroll smoothly to the top (LAB-3164). It SHALL be hidden, and out of the tab order, within the first screen. On phones it SHALL sit above the bottom bar, and above the feedback button when that is on the page. Pressing it SHALL send the go-to-top event with page name `Home news`.

#### Scenario: Back up from deep in the list

- **GIVEN** a reader far down `/home?view=news`
- **WHEN** they start scrolling back up
- **THEN** "Back to top" stays visible
- **AND** pressing it brings them to the page head

### Requirement: News page filters

The news page SHALL offer For You (signed in, and only when it has stories) · All · Top · Funding · Launch · Announcement with counts, and Sort by (Latest, Following, Most popular). It SHALL have no Discussions pill and SHALL open on All. A pill with a count of 0 SHALL be hidden, pressing the active pill SHALL reset to All, and phones SHALL get the "Type:" dropdown.

#### Scenario: Active pill pressed again

- **GIVEN** the Funding pill is active
- **WHEN** the reader presses it again
- **THEN** the filter goes back to All

#### Scenario: Opens on All

- **GIVEN** a member whose For You has stories
- **WHEN** they open the news page
- **THEN** For You is offered, and All is the active pill

### Requirement: Personalize my news

Signed out, the news page SHALL show no For You pill. Under the filters it SHALL show a row reading "For you · Sign up to see news picked for your skills, your team, and the teams you follow." with a "Personalize my news" button that opens the sign-up modal over the page (LAB-3174). A member SHALL NOT see the row.

#### Scenario: A visitor asks for personal news

- **GIVEN** a signed-out visitor on `/home?view=news`
- **WHEN** they press "Personalize my news"
- **THEN** the sign-up form opens over the news page

### Requirement: News page search and tags

Production's news search SHALL be held open beside the title, and on phones be the full-width field under the head. It SHALL match team, headline, summary and tags, with a leading `#` dropped, and narrow on top of the pill and the tags; the pill counts and the scope count SHALL follow it. `#tag` clicks SHALL stack into the stream's scope row: "Filter: #tag ✕ · N stories", with Clear all and Narrow by.

#### Scenario: Search follows the counts

- **GIVEN** stories tagged `ai` and stories that aren't
- **WHEN** the reader searches `#ai`
- **THEN** only the `ai` stories show and the pill counts count only them
- **AND** a search with no match shows "No stories match … Clear search"

#### Scenario: Tags stack

- **GIVEN** stories tagged `ai`, and `ai` plus `robotics`
- **WHEN** the reader clicks #ai, then #robotics
- **THEN** only the second story shows, and the scope row has two chips and "1 story"

# team-news Specification

## Purpose
Describes what a signed-in member sees in the Home feed's For You view, and the News preferences page where they choose what shapes it and the digest email's news.

## Requirements

### Requirement: News preferences page

Signed-in members SHALL have a News preferences page in Settings, listed right after the email preferences item. It holds two sections, Topics and Teams you follow, under an intro that links to Email Preferences for the digest frequency. The words "For You" in the intro SHALL link, in the same tab, to `/home?feed=for-you`, which opens Home on the For You view (All when the member has no For You stories). Signed-out visitors SHALL be sent to log in and returned to the page afterwards.

#### Scenario: Open from the settings menu

- **GIVEN** a signed-in member on any settings page
- **WHEN** they choose "news preferences" in the settings menu
- **THEN** the News preferences page opens with the Topics and Teams you follow sections, and no Categories section

#### Scenario: Signed-out visitor

- **GIVEN** a visitor who is not signed in
- **WHEN** they open the News preferences page
- **THEN** they are asked to log in, and land on News preferences after logging in

#### Scenario: Open For You from the intro

- **GIVEN** a signed-in member on News preferences, from any arrival (`settings`, `feed` or `digest`)
- **WHEN** they click "For You" in the intro
- **THEN** Home opens in the same tab with For You selected, or All when they have no For You stories

### Requirement: Teams you follow
The Teams you follow section SHALL list the teams the member follows, each with a Follow/Following control and, when the backend sends them, all of the team's top-level focus areas under its name, on one line. Unfollowing SHALL keep the team in the list until the page is left, so it can be followed again in place. With no followed teams, the section SHALL show an empty state that links to Teams.

#### Scenario: Unfollow and undo
- **GIVEN** a member following Acme
- **WHEN** they unfollow Acme and then follow it again on the same page
- **THEN** Acme stays in the list throughout and ends up followed

#### Scenario: Empty
- **GIVEN** a member who follows no teams
- **WHEN** they open News preferences
- **THEN** the section says they don't follow any teams yet and links to Teams

### Requirement: Ways in

The page SHALL be reachable from three places:

- the digest email's News preferences link (`from=digest`);
- an "Update" link in Home's For You hint, which reads "Update to make it more relevant." (`from=feed`);
- the settings menu (`from=settings`).

Arriving with `from=digest` or `from=feed` SHALL outline one section until the member's first change: Teams you follow when they have topics but follow no teams, otherwise Topics. Email Preferences SHALL link to the page under its Network news setting.

#### Scenario: From the For You hint

- **GIVEN** a signed-in member who follows at least one team, on Home's For You view
- **WHEN** they click "Update"
- **THEN** News preferences opens with Topics outlined

#### Scenario: From Email Preferences

- **GIVEN** a member on Email Preferences with Network news on
- **WHEN** they follow the News preferences link
- **THEN** News preferences opens

### Requirement: Analytics

The page SHALL record:

- `settings-news-preferences-opened`, with `from`;
- `settings-news-preferences-tag-toggled`, with the tag, its new state, and `from`;
- `settings-news-preferences-save-failed`, with the section (`tags` or `teams`);
- `settings-news-preferences-follow-toggled`;
- `settings-news-preferences-for-you-link-clicked`, with `from`, when the intro's "For You" link is clicked.

The For You hint SHALL record `team-news-for-you-tune-clicked`.

#### Scenario: Page opened from the digest

- **WHEN** a member opens News preferences from the digest link
- **THEN** `settings-news-preferences-opened` is recorded with `from` = `digest`

#### Scenario: Tag added

- **GIVEN** a member on News preferences
- **WHEN** they add the AI tag
- **THEN** `settings-news-preferences-tag-toggled` is recorded with tag `ai` and state on

### Requirement: News tags

The Topics section SHALL be headed "What do you want news about?" and SHALL offer the news tags (focus-area slugs) that tagged at least one news story in the last 90 days, plus any tag the member already has, as `#slug` chips grouped by theme: AI & frontier tech, Web3 infrastructure, Digital rights, Economies & governance, The network, and Other for any tag no theme lists. Themes are an editorial grouping in the frontend, not the focus-area hierarchy; chips are alphabetical within a theme and keep their place when toggled. A search field SHALL narrow the chips as the member types, matching part of a tag or a theme's name, and hide themes with no match. Subscribing or unsubscribing SHALL save at once and show "Saved". The member SHALL be able to unsubscribe from every topic.

#### Scenario: Search tags

- **GIVEN** a member on News preferences
- **WHEN** they type "decentralized" in Search tags
- **THEN** only #decentralized-compute and #decentralized-storage show, under Web3 infrastructure, and choosing one saves it as usual

#### Scenario: Search matches nothing

- **GIVEN** a member on News preferences
- **WHEN** they type text no tag or theme contains
- **THEN** no chips show and a line says no tags match

#### Scenario: A tag no theme lists

- **GIVEN** news starts using a focus area that no theme lists
- **WHEN** a member opens News preferences
- **THEN** its tag shows under Other, after the themes

#### Scenario: Add a tag

- **GIVEN** a member whose tags do not include AI
- **WHEN** they choose AI
- **THEN** the choice is saved, "Saved" appears, and AI stays chosen after a reload

#### Scenario: Never chosen

- **GIVEN** a member who has never saved tags, on a team whose focus areas include DeSci
- **WHEN** they open News preferences
- **THEN** DeSci is already chosen, and a note says their tags were picked from their teams' focus areas

#### Scenario: Never chosen, nothing to pick

- **GIVEN** a member who has never saved tags, whose teams have no focus areas used by news
- **WHEN** they open News preferences
- **THEN** no tag is chosen, and there is no note saying tags were picked

#### Scenario: First change saves the starting tags

- **GIVEN** a member who has never saved tags, with DeSci chosen from their team
- **WHEN** they add AI
- **THEN** both DeSci and AI are saved

#### Scenario: Remove every tag

- **GIVEN** a member with one tag chosen
- **WHEN** they remove it
- **THEN** the removal is saved, and the section still invites them to pick a few tags

#### Scenario: Save fails

- **GIVEN** a member changing a tag while the save request fails
- **WHEN** the error comes back
- **THEN** the tag returns to its previous state and an error message says the change wasn't saved

#### Scenario: Tag list unavailable

- **GIVEN** the list of tags cannot be loaded
- **WHEN** a member opens News preferences
- **THEN** the Topics section shows the member's chosen topics and says the full list could not be loaded, and Teams you follow still works

### Requirement: For You matches news by tags

With News preferences on, Home's For You view SHALL show a story when its team is one of the member's own or followed teams, or when it shares any tag with the member's tags (a parent focus area also matches its children). Teams related to the member's teams SHALL no longer match on their own. For You SHALL keep the newest story per team. When the backend does not send the member's tags, or News preferences is off, For You SHALL match the member's own, followed and related teams as before. The All view SHALL never be narrowed.

#### Scenario: A tag brings in another team's story

- **GIVEN** News preferences on and a member tagged AI
- **WHEN** a team they have no link to posts a story tagged AI
- **THEN** the story appears in For You

#### Scenario: A related team without a matching tag

- **GIVEN** News preferences on
- **WHEN** a team related to the member's team posts a story that matches none of their tags
- **THEN** the story is not in For You, and it is still in the All view

#### Scenario: Only a tag matches

- **GIVEN** News preferences on and a member with no own or followed teams' news, but a story matching their tag
- **WHEN** they open Home
- **THEN** For You is shown and holds that story

#### Scenario: A tag change shows on the next visit

- **GIVEN** a member who adds a tag on News preferences
- **WHEN** they next open Home
- **THEN** For You matches the new tag

#### Scenario: News preferences off

- **GIVEN** News preferences off
- **WHEN** a member opens Home
- **THEN** For You matches their own, followed and related teams as before

### Requirement: News tag chips
With `NEXT_PUBLIC_SHOW_NEWS_PREFERENCES` on, news items SHALL show their tags as `#slug` chips. On Home (the feed rows, the Top stories card and the detail modal opened there) they SHALL be brand links that filter the feed (see "Filter the Home feed by tag"); everywhere else they SHALL be grey labels that are not clickable. A tag is a topic when it equals the slug of a top-two-level focus area. Home feed rows and the Top stories card SHALL show up to 3 topics, in tag order. The detail modal, wherever it opens, SHALL show every topic, then the other tags. Legacy verb tags (`launch`, `fund`, `$`, ...) SHALL never show. With the flag off, nothing SHALL change.

#### Scenario: Card shows topics only
- **GIVEN** the flag on and an item tagged `ai`, `launch` and `longevity`
- **WHEN** its Home feed row or Top stories card renders
- **THEN** it shows one chip, `#ai`

#### Scenario: Detail modal shows topics, then extras
- **GIVEN** the same item
- **WHEN** its detail modal opens from Home or from a team or member profile
- **THEN** it shows `#ai` and `#longevity`, and no `#launch`

#### Scenario: No tags
- **GIVEN** an item with no tags
- **WHEN** its card renders
- **THEN** no chip row renders

### Requirement: Filter the Home feed by tag
With `NEXT_PUBLIC_SHOW_NEWS_PREFERENCES` on, clicking a `#tag` on Home SHALL filter the feed to the stories carrying exactly that tag, switch to the All tab and All categories, and close the detail modal if the click came from it. A "Filter: #tag ×" chip SHALL show on the filter row with the number of matching updates. While a tag filter is on, the tab and category counts SHALL count only the filtered stories, and forum posts, hiring roll-ups, deals and the Top stories band SHALL be hidden. The × or a second click on the active tag SHALL clear the filter. The filter is page state, not a URL parameter.

#### Scenario: Filter by a tag
- **GIVEN** the flag on and stories tagged `ai` among others
- **WHEN** a member clicks `#ai` on a feed card
- **THEN** only the stories tagged `ai` show, on the All tab and All categories, with a "Filter: #ai ×" chip and its count

#### Scenario: Clear the filter
- **GIVEN** the feed filtered by `#ai`
- **WHEN** the member clicks the chip's × or `#ai` again
- **THEN** the full feed returns

#### Scenario: Tag in the detail modal
- **GIVEN** a story's detail modal open on Home
- **WHEN** the member clicks one of its tags
- **THEN** the modal closes and the feed is filtered by that tag

#### Scenario: No match
- **GIVEN** the feed filtered by `#ai` and a search with no match
- **WHEN** the feed renders
- **THEN** it says "No updates match “q” in #ai."

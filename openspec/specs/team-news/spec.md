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

The Teams you follow section SHALL list the teams the member follows, each with a Follow/Following control and, when the backend sends them, all of the team's top-level focus areas under its name, on one line. Unfollowing SHALL keep the team in the list until the page is left, so it can be followed again in place. With no followed teams, the section SHALL show an empty state. When the backend has follow suggestions for the member (`GET /v1/team-news/follow-suggestions`, 4 of them), the section SHALL say they don't follow any teams yet and list the suggestions under "Teams to follow" ("From the focus areas of your team"), each with what it shares with the member's team and a Follow button, followed by a link to all Teams; otherwise it SHALL link to Teams. A followed suggestion SHALL stay in its place showing Following, count in the section title, and can be unfollowed there; the empty line goes while any is followed. A member who already follows teams SHALL see no suggestions.

#### Scenario: Unfollow and undo

- **GIVEN** a member following Acme
- **WHEN** they unfollow Acme and then follow it again on the same page
- **THEN** Acme stays in the list throughout and ends up followed

#### Scenario: Empty

- **GIVEN** a member who follows no teams and has no follow suggestions
- **WHEN** they open News preferences
- **THEN** the section says they don't follow any teams yet and links to Teams

#### Scenario: Suggested teams

- **GIVEN** a member who follows no teams, with follow suggestions Filecoin and IPFS
- **WHEN** they open News preferences and follow Filecoin from the suggestions
- **THEN** Filecoin stays in place showing Following, the title reads "Teams you follow · 1", and `settings-news-preferences-follow-toggled` is recorded with `suggested: true`

#### Scenario: No suggestions for a member who follows teams

- **GIVEN** a member who follows Acme
- **WHEN** they open News preferences
- **THEN** the section lists Acme and shows no suggestions

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
- `settings-news-preferences-for-you-link-clicked`, with `from`, when the intro's "For You" link is clicked;
- `settings-news-preferences-group-expanded`, with the theme and `from`, when a long theme's "Show N more" is clicked.

The For You hint SHALL record `team-news-for-you-tune-clicked`.

#### Scenario: Page opened from the digest

- **WHEN** a member opens News preferences from the digest link
- **THEN** `settings-news-preferences-opened` is recorded with `from` = `digest`

#### Scenario: Tag added

- **GIVEN** a member on News preferences
- **WHEN** they add the AI tag
- **THEN** `settings-news-preferences-tag-toggled` is recorded with tag `ai` and state on

### Requirement: News tags

The Topics section SHALL be headed "What do you want news about?" and SHALL offer the news tags (focus-area slugs) that tagged at least one news story in the last 90 days, plus any tag the member already has, as `#slug` chips grouped by theme: AI & frontier tech, Web3 infrastructure, Digital rights, Economies & governance, The network, and Other for any tag no theme lists. Themes are an editorial grouping in the frontend, not the focus-area hierarchy; chips are alphabetical within a theme and keep their place when toggled. A search field SHALL narrow the chips as the member types, matching part of a tag or a theme's name, and hide themes with no match. A theme with more than 9 tags SHALL show its first 8, plus every tag the member has or toggled in this visit, and end its chip row with "Show N more"; open, the theme shows every tag and the link reads "Show less". A theme that would hide only one tag shows it instead, and while the search has text every match shows with no link. Subscribing or unsubscribing SHALL save at once and show "Saved". The member SHALL be able to unsubscribe from every topic.

#### Scenario: Search tags

- **GIVEN** a member on News preferences
- **WHEN** they type "decentralized" in Search tags
- **THEN** only #decentralized-compute and #decentralized-storage show, under Web3 infrastructure, and choosing one saves it as usual

#### Scenario: Search matches nothing

- **GIVEN** a member on News preferences
- **WHEN** they type text no tag or theme contains
- **THEN** no chips show and a line says no tags match

#### Scenario: Long theme

- **GIVEN** a theme with 15 tags, none of them the member's
- **WHEN** the member opens News preferences
- **THEN** the theme shows its first 8 tags and "Show 7 more"; clicking it shows all 15 and "Show less", and `settings-news-preferences-group-expanded` is recorded

#### Scenario: A pick past the limit

- **GIVEN** a theme with 15 tags and a member who has its 12th tag
- **WHEN** they open News preferences
- **THEN** the theme shows its first 8 tags, the 12th tag, and "Show 6 more"

#### Scenario: Search ignores the limit

- **GIVEN** a theme with 15 tags, collapsed
- **WHEN** the member types part of its 12th tag in Search tags
- **THEN** the 12th tag shows, with no "Show more"

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

With `NEXT_PUBLIC_SHOW_NEWS_PREFERENCES` on, news items SHALL show their tags as `#slug` chips. On Home (the feed rows, every Top stories item and the detail modal opened there) they SHALL be brand links that filter the feed (see "Filter the Home feed by tag"); everywhere else they SHALL be grey labels that are not clickable. A tag is a topic when it equals the slug of a top-two-level focus area. Home feed rows and every Top stories item (the lead and each runner-up) SHALL show up to 3 topics, in tag order. The detail modal, wherever it opens, SHALL show every topic, then the other tags. Legacy verb tags (`launch`, `fund`, `$`, ...) SHALL never show. With the flag off, nothing SHALL change.

#### Scenario: Card shows topics only

- **GIVEN** the flag on and an item tagged `ai`, `launch` and `longevity`
- **WHEN** its Home feed row or Top stories item renders
- **THEN** it shows one chip, `#ai`

#### Scenario: Detail modal shows topics, then extras

- **GIVEN** the same item
- **WHEN** its detail modal opens from Home or from a team or member profile
- **THEN** it shows `#ai` and `#longevity`, and no `#launch`

#### Scenario: No tags

- **GIVEN** an item with no tags
- **WHEN** its Home card or Top stories item renders
- **THEN** no chip row renders

### Requirement: Filter the Home feed by tag

With `NEXT_PUBLIC_SHOW_NEWS_PREFERENCES` on and `NEXT_PUBLIC_SHOW_HOME_V2` off, clicking a `#tag` on Home SHALL filter the feed to the stories carrying exactly that tag, switch to the All tab and All categories, and close the detail modal if the click came from it. A "Filter: #tag ×" chip SHALL show on the filter row with the number of matching updates. While a tag filter is on, the tab and category counts SHALL count only the filtered stories, and forum posts, hiring roll-ups, deals and the Top stories band SHALL be hidden. The × or a second click on the active tag SHALL clear the filter. The filter is page state, not a URL parameter.

With `NEXT_PUBLIC_SHOW_HOME_V2` on, Home's news cards SHALL show their tags as `#tag` links, and tag clicks SHALL stack:

- **Scope.**
  - A story SHALL show only if it carries every selected tag.
  - Forum posts, which carry no tags, SHALL be hidden while any tag is selected.
  - The pill counts SHALL count only the stories in scope.
  - A card in scope SHALL show the selected tags it carries first, so a story matched by its 4th tag still shows that tag within the card's three.
- **Scope row,** on its own row under the pills:
  - one chip with × per selected tag, and the number of matching updates;
  - "Follow" when one tag is selected (with News preferences on, it adds the tag to the member's News preferences tags);
  - "Clear all" when two or more are selected;
  - "Narrow by" with up to three of the commonest other tags among the stories in scope.
- **Toggling.** Clicking a selected tag again, or its ×, SHALL remove it.
- **Search.** A search query SHALL ignore a leading `#`, so `#ai` matches stories tagged `ai`.
- **State.** The scope is page state, not a URL parameter.

#### Scenario: Filter by a tag

- **GIVEN** the news preferences flag is on, the Home v2 flag is off, and stories tagged `ai` are among others
- **WHEN** a member clicks `#ai` on a feed card
- **THEN** only the stories tagged `ai` show, on the All tab and All categories, with a "Filter: #ai ×" chip and its count

#### Scenario: Clear the filter

- **GIVEN** the feed is filtered by `#ai`
- **WHEN** the member clicks the chip's × or `#ai` again
- **THEN** the full feed returns

#### Scenario: Tag in the detail modal

- **GIVEN** a story's detail modal is open on Home
- **WHEN** the member clicks one of its tags
- **THEN** the modal closes and the feed is filtered by that tag

#### Scenario: No match

- **GIVEN** the feed is filtered by `#ai` and a search has no match
- **WHEN** the feed renders
- **THEN** it says "No updates match “q” in #ai."

#### Scenario: Tags stack on the new Home

- **GIVEN** the Home v2 flag is on, and stories tagged `ai` and `ai`+`robotics`
- **WHEN** a member clicks `#ai` and then `#robotics`
- **THEN** only the story tagged with both shows
- **AND** the scope row shows two chips, the count 1 and "Clear all"

#### Scenario: Hashtag search

- **GIVEN** the Home v2 flag is on
- **WHEN** a member searches `#ai`
- **THEN** stories tagged `ai` match

### Requirement: Posting an update is recorded
Opening the composer on a team page or a member page SHALL record `team-news-create-clicked` with the team uid, team name and source. A successful publish SHALL record `team-news-create-post-submitted` with the same fields. A failed publish SHALL record neither submit event. The event SHALL NOT include the post title, body or URL.

#### Scenario: Publish from the team page
- **WHEN** a member opens the composer on a team page and the post succeeds
- **THEN** PostHog gets `team-news-create-clicked` and `team-news-create-post-submitted` with source `team-profile-rail`

#### Scenario: Publish from the member page
- **WHEN** a member opens the composer on their member page and the post succeeds
- **THEN** PostHog gets both events with source `member-profile`

#### Scenario: Publish fails
- **WHEN** the create request fails
- **THEN** PostHog gets `team-news-create-clicked` and no `team-news-create-post-submitted`

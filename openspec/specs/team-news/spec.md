# team-news Specification

## Purpose
Describes what a signed-in member sees in the Home feed's For You view, and the News preferences page where they choose what shapes it and the digest email's news.

## Requirements

### Requirement: News preferences page

Signed-in members SHALL have a News preferences page in Settings, listed right after the email preferences item. It holds two sections: Tags and Teams you follow. Signed-out visitors SHALL be sent to log in and returned to the page afterwards.

#### Scenario: Open from the settings menu

- **GIVEN** a signed-in member on any settings page
- **WHEN** they choose "news preferences" in the settings menu
- **THEN** the News preferences page opens with the Tags and Teams you follow sections, and no Categories section

#### Scenario: Signed-out visitor

- **GIVEN** a visitor who is not signed in
- **WHEN** they open the News preferences page
- **THEN** they are asked to log in, and land on News preferences after logging in

### Requirement: Teams you follow
The Teams you follow section SHALL list the teams the member follows, each with a Follow/Following control. Unfollowing SHALL keep the team in the list until the page is left, so it can be followed again in place. With no followed teams, the section SHALL show an empty state that links to Teams.

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
- a "Tune For You" link in Home's For You hint (`from=feed`);
- the settings menu (`from=settings`).

Arriving with `from=digest` or `from=feed` SHALL outline one section until the member's first change: Teams you follow when they follow no teams, otherwise Tags. Email Preferences SHALL link to the page under its Network news setting.

#### Scenario: From the For You hint

- **GIVEN** a signed-in member who follows at least one team, on Home's For You view
- **WHEN** they click "Tune For You"
- **THEN** News preferences opens with Tags outlined

#### Scenario: From Email Preferences

- **GIVEN** a member on Email Preferences with Network news on
- **WHEN** they follow the News preferences link
- **THEN** News preferences opens

### Requirement: Analytics

The page SHALL record:

- `settings-news-preferences-opened`, with `from`;
- `settings-news-preferences-tag-toggled`, with the tag, its new state, and `from`;
- `settings-news-preferences-save-failed`, with the section (`tags` or `teams`);
- `settings-news-preferences-follow-toggled`.

The For You hint SHALL record `team-news-for-you-tune-clicked`.

#### Scenario: Page opened from the digest

- **WHEN** a member opens News preferences from the digest link
- **THEN** `settings-news-preferences-opened` is recorded with `from` = `digest`

#### Scenario: Tag added

- **GIVEN** a member on News preferences
- **WHEN** they add the AI tag
- **THEN** `settings-news-preferences-tag-toggled` is recorded with tag `ai` and state on

### Requirement: News tags

The Tags section SHALL offer the focus areas that tagged at least one news story in the last 90 days, plus any tag the member already has. Each tag SHALL show its focus-area title, grouped under its parent focus area, with the member's chosen tags first in the order they had when the page opened. Choosing or removing a tag SHALL save at once and show "Saved". The member SHALL be able to remove every tag.

#### Scenario: Add a tag

- **GIVEN** a member whose tags do not include AI
- **WHEN** they choose AI
- **THEN** the choice is saved, "Saved" appears, and AI stays chosen after a reload

#### Scenario: Never chosen

- **GIVEN** a member who has never saved tags, on a team whose focus areas include DeSci
- **WHEN** they open News preferences
- **THEN** DeSci is already chosen, and a note says their tags were picked from their teams' focus areas

#### Scenario: First change saves the starting tags

- **GIVEN** a member who has never saved tags, with DeSci chosen from their team
- **WHEN** they add AI
- **THEN** both DeSci and AI are saved

#### Scenario: Remove every tag

- **GIVEN** a member with one tag chosen
- **WHEN** they remove it
- **THEN** the removal is saved, and the section explains that For You and the digest show news from their own and followed teams only

#### Scenario: Save fails

- **GIVEN** a member changing a tag while the save request fails
- **WHEN** the error comes back
- **THEN** the tag returns to its previous state and an error message says the change wasn't saved

#### Scenario: Tag list unavailable

- **GIVEN** the list of tags cannot be loaded
- **WHEN** a member opens News preferences
- **THEN** the Tags section shows the member's chosen tags and says the full list could not be loaded, and Teams you follow still works

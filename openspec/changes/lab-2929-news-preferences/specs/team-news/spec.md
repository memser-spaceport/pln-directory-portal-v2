# Spec Delta

## Purpose

Describes what a signed-in member sees in the Home feed's For You view, and the News preferences page where they choose what shapes it and the digest email's news.

## ADDED Requirements

### Requirement: News preferences page
Signed-in members SHALL have a News preferences page in Settings, listed right after the email preferences item. It holds three sections: Categories, Suggested from your profile, and Teams you follow. Signed-out visitors SHALL be sent to log in and returned to the page afterwards.

#### Scenario: Open from the settings menu
- **GIVEN** a signed-in member on any settings page
- **WHEN** they choose "news preferences" in the settings menu
- **THEN** the News preferences page opens with the Categories, Suggested from your profile, and Teams you follow sections

#### Scenario: Signed-out visitor
- **GIVEN** a visitor who is not signed in
- **WHEN** they open the News preferences page
- **THEN** they are asked to log in, and land on News preferences after logging in

### Requirement: News categories
The Categories section SHALL offer six chips: Funding, Launch, Partnership, Announcement, Milestone and Other. They show the member's saved choice, or all six when nothing is saved. Toggling a chip SHALL save at once and show "Saved". The last chip that is on SHALL NOT be switchable off. "Select all" SHALL turn every chip back on.

#### Scenario: Turn a category off
- **GIVEN** a member with all categories on
- **WHEN** they turn off Funding
- **THEN** the choice is saved, "Saved" appears, and the summary reads "You get 5 of 6 kinds of news"

#### Scenario: Keep at least one
- **GIVEN** a member with only Launch on
- **WHEN** they look at the Launch chip
- **THEN** it cannot be turned off and explains that at least one category stays on

#### Scenario: Save fails
- **GIVEN** a member toggling a category while the save request fails
- **WHEN** the error comes back
- **THEN** the chip returns to its previous state and an error message says the choice wasn't saved

### Requirement: For You follows the chosen categories
For You on Home SHALL show only news whose category is among the member's chosen categories. The All tab and the category pills SHALL keep showing every category. Forum posts and jobs in For You SHALL be unaffected.

#### Scenario: Category off
- **GIVEN** a member who turned off Funding
- **WHEN** they open Home
- **THEN** For You shows no Funding news, and the All tab still shows Funding news

#### Scenario: Default
- **GIVEN** a member who never changed their categories
- **WHEN** they open Home
- **THEN** For You is the same as before this change

### Requirement: Profile signals
"Suggested from your profile" SHALL list, read-only, each team the member belongs to, with that team's focus areas and industry tags, marked as set by the team. A member with no team SHALL see that their suggestions then come only from teams they follow.

#### Scenario: Member on a team
- **GIVEN** a member of a team with focus areas and industry tags
- **WHEN** they open News preferences
- **THEN** the section shows the team's name with its focus areas and industry tags, and no editing controls

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
- the digest email's "Update preferences" link (`from=digest`);
- a "Tune For You" link in Home's For You hint (`from=feed`);
- the settings menu (`from=settings`).

Arriving with `from=digest` or `from=feed` SHALL outline one section until the member's first change: Teams you follow when they follow no teams, otherwise Categories. Email Preferences SHALL link to the page under its Network news setting.

#### Scenario: From the For You hint
- **GIVEN** a signed-in member on Home's For You view
- **WHEN** they click "Tune For You"
- **THEN** News preferences opens with Categories outlined, because they follow at least one team

#### Scenario: From Email Preferences
- **GIVEN** a member on Email Preferences with Network news on
- **WHEN** they follow the News preferences link
- **THEN** News preferences opens

### Requirement: Analytics
The page SHALL record:
- `settings-news-preferences-opened`, with `from`;
- `settings-news-preferences-category-toggled`, with the category and its new state;
- `settings-news-preferences-save-failed`;
- `settings-news-preferences-follow-toggled`.

The For You hint SHALL record `team-news-for-you-tune-clicked`.

#### Scenario: Page opened from the digest
- **WHEN** a member opens News preferences from the digest link
- **THEN** `settings-news-preferences-opened` is recorded with `from` = `digest`

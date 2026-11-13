# Spec Delta

## ADDED Requirements

### Requirement: Tag card

Home SHALL show a tag card to a signed-in member whose default news tags are not approved and not set by the member, while News preferences is on. The card SHALL take the place of the "For you" line: on the For You view, and on the All view with no topic filter and no search text. It SHALL NOT show to a signed-out visitor, while the default tags are loading, when the request fails, or when there is no tag to show. The card SHALL stay until the member answers it, on this visit or a later one.

#### Scenario: Member with unapproved default tags

- **GIVEN** a signed-in member whose default tags are `ai` and `desci` with source `ai`, not approved, and News preferences on
- **WHEN** they open Home
- **THEN** the tag card shows where the "For you" line was, and that line does not show

#### Scenario: Member who set their own tags

- **GIVEN** a signed-in member who saved the tag `ai`
- **WHEN** they open Home
- **THEN** no tag card is shown

#### Scenario: Member who already answered

- **GIVEN** a signed-in member whose default tags are approved
- **WHEN** they open Home
- **THEN** no tag card is shown and the "For you" line shows as before

#### Scenario: Other filter

- **GIVEN** the tag card is shown on the All view
- **WHEN** the member presses the Top pill, picks a topic filter, or types in search
- **THEN** the card is hidden, and it shows again on All with no filter, or on For You

#### Scenario: Default tags cannot be loaded

- **GIVEN** a signed-in member
- **WHEN** the default tags request fails or returns no tags
- **THEN** no card is shown and the rest of Home is unchanged

### Requirement: Tag card content

The card SHALL be titled "We picked these topics for you", with one line that names the source of the topics. It SHALL show the default tags as `#slug` chips in the News preferences chip style, all turned on, in a fixed order. Pressing a chip SHALL turn it off or on in place. Nothing SHALL be saved until the member presses a button.

#### Scenario: AI tags

- **GIVEN** default tags `ai` and `desci` with source `ai`
- **WHEN** the card shows
- **THEN** it reads "We picked these topics for you" and "Picked from your profile, teams and projects.", with `#ai` and `#desci` turned on

#### Scenario: Source lines

- **WHEN** the card shows tags with source `interest-profile`, `ai` or `team`
- **THEN** the line reads "Picked from your activity in the network.", "Picked from your profile, teams and projects." or "Picked from your teams' focus areas."

#### Scenario: Turn a chip off and on

- **GIVEN** the card shows `#ai`, `#desci` and `#defi`
- **WHEN** the member presses `#defi`, then presses it again
- **THEN** `#defi` is turned off and stays in its place, then is turned on again, and no request is sent

### Requirement: Tag card answers

The card SHALL have a primary button and a "See all topics" button. While every chip is on, the primary button SHALL read "Looks good" and SHALL approve the default tags as shown. Once a chip is off, it SHALL read "Save topics" and SHALL save the chips that are on as the member's own news tags. "See all topics" SHALL approve the default tags as shown and open News preferences.

#### Scenario: Looks good

- **GIVEN** the card shows `#ai` and `#desci`, both on
- **WHEN** the member presses "Looks good"
- **THEN** the default tags are approved, the member's saved news tags are unchanged, and a "Topics saved" message shows

#### Scenario: Save topics

- **GIVEN** the member turned `#desci` off on a card with `#ai` and `#desci`
- **WHEN** they press "Save topics"
- **THEN** `ai` is saved as their news tag, and a "Topics saved" message shows

#### Scenario: Every chip off

- **GIVEN** the member turned every chip off
- **WHEN** they look at the card
- **THEN** "Save topics" is disabled and "See all topics" still works

#### Scenario: Phone

- **GIVEN** the card on a phone
- **WHEN** it shows
- **THEN** the two buttons stack at full width and the page has no horizontal scroll

#### Scenario: See all topics

- **GIVEN** the card is shown
- **WHEN** the member presses "See all topics"
- **THEN** the default tags are approved and `/settings/news-preferences?from=feed` opens with Topics outlined

### Requirement: Tag card after an answer

After "Looks good" or "Save topics" succeeds, the card SHALL go away and the "For you" line SHALL show in its place. The card SHALL NOT show again on a later load. When the request fails, the card SHALL stay with the member's chips as they were, and an error message SHALL show.

#### Scenario: Answered

- **GIVEN** the member pressed "Looks good" and the request succeeded
- **WHEN** they look at Home, and when they load Home again
- **THEN** the "For you" line shows and the card does not

#### Scenario: Request fails

- **GIVEN** the member turned `#desci` off
- **WHEN** they press "Save topics" and the request fails
- **THEN** the card stays with `#desci` off, and "Could not save your topics. Please try again." shows

## MODIFIED Requirements

### Requirement: Ways in

The page SHALL be reachable from five places:

- the digest email's News preferences link (`from=digest`);
- an "Update" link in Home's For You hint, which reads "Update to make it more relevant." (`from=feed`);
- a row on Home's All view for a signed-in member with no For You stories, no news tags and no followed teams, while News preferences is on and the tag card is not shown (`from=feed`). Own teams do not hide the row. The row reads "For you · Get news picked for you. Choose your topics and teams in News preferences." The link reads "Open News preferences →". The row is hidden when a focus-area tab, a category other than All, a topic filter or search text is on. It is hidden for a signed-out visitor, when News preferences is off, when the member's tags are unknown, when the member follows a team, when the member has a news tag, when For You has stories, and when the tag card is shown. On the new Home this row replaces the curated "For you" line for that member, and only on that resting All view;
- the tag card's "See all topics" button (`from=feed`);
- the settings menu (`from=settings`).

Arriving with `from=digest` or `from=feed` SHALL outline one section until the member's first change: Teams you follow when they have topics but follow no teams, otherwise Topics. Email Preferences SHALL link to the page under its Network news setting.

#### Scenario: From the For You hint

- **GIVEN** a signed-in member who follows at least one team, on Home's For You view
- **WHEN** they click "Update"
- **THEN** News preferences opens with Topics outlined

#### Scenario: From the set-up row

- **GIVEN** a signed-in member with no For You stories, no news tags and no followed teams, on Home's All view, with News preferences on, whose default tags are empty
- **WHEN** they click "Open News preferences →"
- **THEN** News preferences opens with Topics outlined
- **AND** `team-news-for-you-setup-clicked` is recorded with their member id, and `team-news-for-you-tune-clicked` is not

#### Scenario: Card shown, no set-up row

- **GIVEN** a signed-in member with no For You stories, no news tags and no followed teams, on Home's All view, with News preferences on
- **WHEN** the tag card is shown
- **THEN** the set-up row is not shown and `team-news-for-you-setup-shown` is not recorded

#### Scenario: From Email Preferences

- **GIVEN** a member on Email Preferences with Network news on
- **WHEN** they follow the News preferences link
- **THEN** News preferences opens

### Requirement: Analytics

The page SHALL record:

- `settings-news-preferences-opened`, with `from`;
- `settings-news-preferences-tag-toggled`, with the tag, its new state, `from`, and `kind` (`topic` or `category`);
- `settings-news-preferences-save-failed`, with the section (`tags` or `teams`);
- `settings-news-preferences-follow-toggled`;
- `settings-news-preferences-for-you-link-clicked`, with `from`, when the intro's "For You" link is clicked;
- `settings-news-preferences-group-expanded`, with the theme and `from`, when a long theme's "Show N more" is clicked.

The For You hint SHALL record `team-news-for-you-tune-clicked`.

The set-up row SHALL record `team-news-for-you-setup-shown` once per page load when it renders, with the member id. A click SHALL record `team-news-for-you-setup-clicked` with the member id, and SHALL NOT record `team-news-for-you-tune-clicked`.

The tag card SHALL record, each with the member id and the `source` of the tags (`interest-profile`, `ai` or `team`):

- `team-news-tags-card-shown`, once per page load when the card first renders, with the shown tags;
- `team-news-tags-card-tag-toggled`, when a chip is turned off or on, with the tag and its new state;
- `team-news-tags-card-approved`, when "Looks good" is pressed, with the tags;
- `team-news-tags-card-saved`, when "Save topics" is pressed, with the saved tags and the tags that were turned off;
- `team-news-tags-card-see-all-clicked`, when "See all topics" is pressed.

The card SHALL NOT record `settings-news-preferences-tag-toggled`.

#### Scenario: Page opened from the digest

- **WHEN** a member opens News preferences from the digest link
- **THEN** `settings-news-preferences-opened` is recorded with `from` = `digest`

#### Scenario: Tag added

- **GIVEN** a member on News preferences
- **WHEN** they add the AI tag
- **THEN** `settings-news-preferences-tag-toggled` is recorded with tag `ai`, state on, and kind `topic`

#### Scenario: Category tag added

- **GIVEN** a member on News preferences
- **WHEN** they add Funding
- **THEN** `settings-news-preferences-tag-toggled` is recorded with tag `FUNDING`, state on, and kind `category`

#### Scenario: Card shown once

- **GIVEN** a member whose tag card shows `#ai` and `#desci` with source `ai`
- **WHEN** Home loads, and the member then turns a filter on and off
- **THEN** `team-news-tags-card-shown` is recorded once, with source `ai` and the tags `ai` and `desci`

#### Scenario: Card approved

- **GIVEN** the card shows `#ai` and `#desci` with source `ai`
- **WHEN** the member presses "Looks good"
- **THEN** `team-news-tags-card-approved` is recorded with source `ai` and the tags `ai` and `desci`

#### Scenario: Chip turned off and saved

- **GIVEN** the card shows `#ai`, `#desci` and `#defi`
- **WHEN** the member turns `#defi` off and presses "Save topics"
- **THEN** `team-news-tags-card-tag-toggled` is recorded with tag `defi` and state off, and `team-news-tags-card-saved` is recorded with the saved tags `ai` and `desci` and the turned-off tag `defi`

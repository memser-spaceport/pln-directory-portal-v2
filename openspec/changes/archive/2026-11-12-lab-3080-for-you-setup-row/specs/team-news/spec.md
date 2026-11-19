## MODIFIED Requirements

### Requirement: Ways in

The page SHALL be reachable from four places:

- the digest email's News preferences link (`from=digest`);
- an "Update" link in Home's For You hint, which reads "Update to make it more relevant." (`from=feed`);
- a row on Home's All view for a signed-in member with no own teams, no followed teams and no news tags, while News preferences is on (`from=feed`). The row reads "For you · Get news picked for you. Choose your topics and teams in News preferences." The link reads "Open News preferences →". The row is hidden when a focus-area tab, a category other than All, a topic filter or search text is on. It is hidden for a signed-out visitor, when News preferences is off, when the member's tags are unknown, and when the member has teams or tags but no stories. On the new Home this row replaces the curated "For you" line for that member, and only on that resting All view;
- the settings menu (`from=settings`).

Arriving with `from=digest` or `from=feed` SHALL outline one section until the member's first change: Teams you follow when they have topics but follow no teams, otherwise Topics. Email Preferences SHALL link to the page under its Network news setting.

#### Scenario: From the set-up row

- **GIVEN** a signed-in member with no own teams, no followed teams and no news tags, on Home's All view, with News preferences on
- **WHEN** they click "Open News preferences →"
- **THEN** News preferences opens with Topics outlined
- **AND** `team-news-for-you-setup-clicked` is recorded with their member id, and `team-news-for-you-tune-clicked` is not

### Requirement: Analytics

The page SHALL record:

- `settings-news-preferences-opened`, with `from`;
- `settings-news-preferences-tag-toggled`, with the tag, its new state, and `from`;
- `settings-news-preferences-save-failed`, with the section (`tags` or `teams`);
- `settings-news-preferences-follow-toggled`;
- `settings-news-preferences-for-you-link-clicked`, with `from`, when the intro's "For You" link is clicked;
- `settings-news-preferences-group-expanded`, with the theme and `from`, when a long theme's "Show N more" is clicked.

The For You hint SHALL record `team-news-for-you-tune-clicked`.

The set-up row SHALL record `team-news-for-you-setup-shown` once per page load when it renders, with the member id. A click SHALL record `team-news-for-you-setup-clicked` with the member id, and SHALL NOT record `team-news-for-you-tune-clicked`.

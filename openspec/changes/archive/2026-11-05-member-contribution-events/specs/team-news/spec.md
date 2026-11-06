## ADDED Requirements

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

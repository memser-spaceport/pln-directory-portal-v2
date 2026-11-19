## ADDED Requirements

### Requirement: Upcoming events

After More from the network and before the forum posts, the page SHALL show "Upcoming events" with the subtitle "The next four weeks in the network" and one row per item of the page's `events`, in the order given. A row SHALL show Home's date tile, the name, when and where ("Fri · Lisbon" for a one-day event, "Nov 30–Dec 2 · Lisbon" for a longer one, "Online" for a virtual one, in UTC), "N going" when the count is above zero, and the event's logo when it has one. As on Home's rail: with the event drawer flag on and a signed-in member, a row SHALL open the event drawer over the page (source `digest`) and show "You're going" on events the member goes to; otherwise a row SHALL link to the event in the All Events calendar. The section SHALL end with "See all N events", linking to All Events. With no events the section SHALL NOT show.

#### Scenario: Signed-out reader

- **GIVEN** the event drawer flag is on and the reader is signed out
- **WHEN** they press an event row
- **THEN** All Events opens on that event

#### Scenario: Signed-in member

- **GIVEN** the event drawer flag is on and the member is signed in
- **WHEN** they press an event row
- **THEN** the event drawer opens over the digest page

## MODIFIED Requirements

### Requirement: Digest page events

The page SHALL record these PostHog events, and no event SHALL carry the link token:

- On open, the email click with the existing digest email click events. A news link records `forum-digest-email-news-clicked`, and a post link records `forum-digest-email-post-clicked`. They carry `utm_source`, `position`, the news or topic id, and a new `link_type`: `story`, `read_more`, `more`, `less`, `view_in_browser`, `post`, `post_news` (the email's "Post your team news →") or `change_topics` (the email's "Change topics").
- `digest-page-viewed`, once per load, with `frequency`, `sent_at`, `from` (`email-more`, `email-less`, `email-story`, `email-post`, `email-post-news`, `email-change-topics`, `view-in-browser` or `direct`) and `is_logged_in`.
- `digest-story-read` on a "Read on <source>" click, with `news_id` and `position`.
- `digest-network-news-clicked` on a More from the network row, with `news_id`, `position` and `domain`.
- `digest-event-clicked` on an Upcoming events row, with `event_uid`, `position` and `opens` (`drawer` or `calendar`); `digest-events-see-all-clicked`, with `total`.
- `digest-more-clicked` and `digest-less-clicked` on a press, with `news_id`, `position` and `active_after`.
- `digest-undo-clicked`, with `news_id`, `choice_reverted` and `via` (`undo-button` or `second-press`).

Every URL that PostHog records SHALL have the token parameter removed.

#### Scenario: Token kept out of analytics

- **GIVEN** a member opens `/digest?t=<token>`
- **WHEN** PostHog records the page view
- **THEN** the recorded URL has no `t` parameter

#### Scenario: Change topics from the email

- **GIVEN** a member opens `/digest?t=<token>&utm_source=digest_email_change_topics_link&link_type=change_topics&position=0&topics=open`
- **WHEN** the page loads
- **THEN** it records `forum-digest-email-news-clicked` with `link_type` `change_topics`, and `digest-page-viewed` with `from` `email-change-topics`

## ADDED Requirements

### Requirement: More from the network

After the stories and before the forum posts, the page SHALL show "More from the network" with the subtitle "Network teams in the press." and one row per item of the page's `networkNews`, in the order given. A row SHALL show the picture (a quiet tile when there is none), the headline, and "outlet · date" (for example "medtechdive.com · 14 Nov", in UTC), and SHALL open the article at its outlet in a new tab. With no items the section SHALL NOT show.

#### Scenario: Row opens the outlet

- **GIVEN** the page has a network news item from medtechdive.com
- **WHEN** the member clicks its row
- **THEN** the article opens in a new tab and `digest-network-news-clicked` is recorded

#### Scenario: Nothing to show

- **GIVEN** the page has no network news
- **WHEN** it loads
- **THEN** there is no "More from the network" section

## MODIFIED Requirements

### Requirement: Digest page events

The page SHALL record these PostHog events, and no event SHALL carry the link token:

- On open, the email click with the existing digest email click events. A news link records `forum-digest-email-news-clicked`, and a post link records `forum-digest-email-post-clicked`. They carry `utm_source`, `position`, the news or topic id, and a new `link_type`: `story`, `read_more`, `more`, `less`, `view_in_browser`, `post`, `post_news` (the email's "Post your team news →") or `change_topics` (the email's "Change topics").
- `digest-page-viewed`, once per load, with `frequency`, `sent_at`, `from` (`email-more`, `email-less`, `email-story`, `email-post`, `email-post-news`, `email-change-topics`, `view-in-browser` or `direct`) and `is_logged_in`.
- `digest-story-read` on a "Read on <source>" click, with `news_id` and `position`.
- `digest-network-news-clicked` on a More from the network row, with `news_id`, `position` and `domain`.
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

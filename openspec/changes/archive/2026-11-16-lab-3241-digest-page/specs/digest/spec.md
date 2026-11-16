## ADDED Requirements

### Requirement: Digest page

The page `/digest?t=<token>` SHALL show the digest named by the link token to anyone who opens it, signed in or not, with no sign-in prompt. It SHALL show the LabOS top bar on desktop and the bottom bar on mobile. It SHALL show a header with "Your daily digest" or "Your weekly digest" and the send date. Then it SHALL show every story in the order the API returns it, each in full: title, summary, full text, image, and a "Read on <source>" link that opens the source in a new tab. The top story keeps its "Top story" badge. Then it SHALL show a "Recent forum posts" section with each post in full and a "Reply in the forum" link. The page SHALL NOT open a story modal. The page SHALL NOT be indexed by search engines.

#### Scenario: Signed-out member

- **GIVEN** a signed-out visitor with a valid link
- **WHEN** they open the page
- **THEN** they see the whole digest, and no sign-in prompt shows

#### Scenario: Forum unavailable

- **GIVEN** the API returns no forum posts because the forum did not answer
- **WHEN** the page shows
- **THEN** the stories show, and the forum section is not shown

### Requirement: Opening at a story

A link with `#story-<uid>` or `#post-<tid>` SHALL open the page scrolled to that item. The item SHALL get no outline, highlight or other mark. A hash that names no item on the page SHALL open the page at the top.

#### Scenario: Read more on story 3

- **GIVEN** a link with `#story-<uid of story 3>` and no choice
- **WHEN** the page opens
- **THEN** it is scrolled to story 3, no button is pressed and no confirmation shows, and the member can scroll up to stories 1 and 2

### Requirement: Choice from the email

A link with `choice=more` or `choice=less` and `story=<uid>` SHALL save that choice once per page load, in the browser after the page loads, never during the server render. While it saves, the button SHALL show as pressed. After the save, the top of that story's card SHALL show "You'll get more stories like this" or "You'll get fewer stories like this" with an Undo button. After the save, the page SHALL remove `choice` and `story` from the address, so a reload does not save again. If the save fails, the button SHALL NOT stay pressed, no confirmation SHALL show, an error toast SHALL show, and `choice` and `story` stay in the address so a reload tries again.

#### Scenario: Less from the email

- **GIVEN** a link with `story=<uid>&choice=less#story-<uid>`
- **WHEN** the page loads
- **THEN** the page saves Less once, is scrolled to the story, shows Less pressed, and shows "You'll get fewer stories like this" with Undo at the top of the card

#### Scenario: Link scanner

- **GIVEN** a link scanner that fetches the page without running scripts
- **WHEN** it fetches a More link
- **THEN** no choice is saved

### Requirement: More and Less on the page

Each news story SHALL have "More like this" and "Less like this" buttons that show the member's saved choice as pressed. Forum posts SHALL NOT have them. A press SHALL save the choice and then show the confirmation under the buttons. A press on the other button SHALL replace the choice. A press on the active button, or Undo, SHALL undo the choice, remove the confirmation and show the toast "Undone. Your preferences haven't changed." A failed save or undo SHALL keep the last saved state and show an error toast.

#### Scenario: Press More

- **GIVEN** a story with nothing pressed
- **WHEN** the member presses More
- **THEN** More shows as pressed and "You'll get more stories like this" with Undo shows under the buttons

#### Scenario: Second press

- **GIVEN** Less is pressed on a story
- **WHEN** the member presses Less again
- **THEN** the choice is undone, the confirmation goes away and the toast shows

### Requirement: Link that does not work

When the token is missing, malformed, wrongly signed or expired, or the API cannot read the digest, the page SHALL show a short message ("This digest link has expired" for an expired link, otherwise "We couldn't open this digest") with a link to Home, and no stories. A loading skeleton SHALL show while the digest loads.

#### Scenario: Expired link

- **GIVEN** a link older than 90 days
- **WHEN** the page opens
- **THEN** it shows "This digest link has expired" and a link to Home

### Requirement: Digest page events

The page SHALL record these PostHog events, and no event SHALL carry the link token:

- On open, the email click with the existing digest email click events. A news link records `forum-digest-email-news-clicked`, and a post link records `forum-digest-email-post-clicked`. They carry `utm_source`, `position`, the news or topic id, and a new `link_type`: `story`, `read_more`, `more`, `less`, `view_in_browser` or `post`.
- `digest-page-viewed`, once per load, with `frequency`, `sent_at`, `from` (`email-more`, `email-less`, `email-story`, `email-post`, `view-in-browser` or `direct`) and `is_logged_in`.
- `digest-story-read` on a "Read on <source>" click, with `news_id` and `position`.
- `digest-more-clicked` and `digest-less-clicked` on a press, with `news_id`, `position` and `active_after`.
- `digest-undo-clicked`, with `news_id`, `choice_reverted` and `via` (`undo-button` or `second-press`).

Every URL that PostHog records SHALL have the token parameter removed.

#### Scenario: Token kept out of analytics

- **GIVEN** a member opens `/digest?t=<token>`
- **WHEN** PostHog records the page view
- **THEN** the recorded URL has no `t` parameter

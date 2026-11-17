# digest Specification

## Purpose
The digest reading page `/digest?t=` (LAB-3264): the LabOS digest email opens one page with the member's whole digest, without sign-in, with More like this, Less like this and Undo on each story.

## Requirements

### Requirement: Digest page

The page `/digest?t=<token>` SHALL show the digest named by the link token to anyone who opens it, signed in or not, with no sign-in prompt. It SHALL show the LabOS top bar on desktop and the bottom bar on mobile. The page SHALL be a plain white page with the stories in a 760px column, with no grey background, white sheet or PL logo. It SHALL start with a dateline ("Weekly digest · 9 November 2026 · 5 stories", "Daily digest" for a daily link), then the greeting "Hi <first name>," as the page title (or "Hi there," without a name) and the intro line, all left-aligned. Then it SHALL show every story in the order the API returns it, each in full, as an open section with a hairline between stories and no card: the team header (logo or initials, the team name linking to the team profile, Follow), the title and summary beside the image, the full text, and a Sources line listing every source with a link that opens in a new tab. The first story is the hero: its title and summary beside a big image, with no background picture. The other stories put the image beside the text, alternating sides. The top story keeps its "Top story" badge. The page SHALL NOT show "Read on <source>", Read more or Show less. Then it SHALL show a "Recent forum posts" section with each post in full and a "Reply in the forum" link. The page SHALL NOT open a story modal. The page SHALL NOT be indexed by search engines. Dates SHALL print the same on the server and in the browser.

#### Scenario: Signed-out member

- **GIVEN** a signed-out visitor with a valid link
- **WHEN** they open the page
- **THEN** they see the whole digest, and no sign-in prompt shows

#### Scenario: Forum unavailable

- **GIVEN** the API returns no forum posts because the forum did not answer
- **WHEN** the page shows
- **THEN** the stories show, and the forum section is not shown

#### Scenario: Story with three sources

- **GIVEN** a story with sources techcrunch.com, theblock.co and cryptobriefing.com
- **WHEN** the page shows
- **THEN** the story ends with "Sources: techcrunch.com · theblock.co · cryptobriefing.com", each a link to its article

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

- On open, the email click with the existing digest email click events. A news link records `forum-digest-email-news-clicked`, and a post link records `forum-digest-email-post-clicked`. They carry `utm_source`, `position`, the news or topic id, and a new `link_type`: `story`, `read_more`, `more`, `less`, `view_in_browser`, `post`, `post_news` (the email's "Post your team news →") or `change_topics` (the email's "Change topics").
- `digest-page-viewed`, once per load, with `frequency`, `sent_at`, `from` (`email-more`, `email-less`, `email-story`, `email-post`, `email-post-news`, `email-change-topics`, `view-in-browser` or `direct`) and `is_logged_in`.
- `digest-story-read` on a "Read on <source>" click, with `news_id` and `position`.
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

### Requirement: Follow, Comments and Share on a story

Each story's team header SHALL have Follow, which starts from the API's `followsTeam` for the link's member. A press SHALL follow or unfollow the team for the signed-in member, update every story of that team on the page, and revert if the save fails. Each story's actions row SHALL have More like this and Less like this, then Comments (the feed's button, with the API's comment count) and Share (the feed's share menu, sharing the story's Home link, never the digest link). Comments SHALL open the feed's comment thread under the story. A signed-out reader who presses Follow, or signs in from the comment thread, SHALL go to sign-in and come back to the same digest link.

#### Scenario: Follow when signed out

- **GIVEN** a signed-out reader on a valid link
- **WHEN** they press Follow on a story
- **THEN** sign-in opens and no follow is saved

#### Scenario: Two stories from one team

- **GIVEN** a signed-in reader and two stories from the same team, not followed
- **WHEN** they press Follow on the first
- **THEN** both stories show Following

### Requirement: End of the issue and side cards

After the stories and forum posts, the page SHALL show "You're all caught up" with a check, "The next digest arrives on <weekday>, <day> <month>." from the API's `nextSendAt` (the line is left out when it is missing), and a "See all network news" link to Home. When the API's `isTeamMember` is true, the page SHALL show the outlined "Got news from your team?" card with "Post your team news →". It SHALL open the Post news modal for the signed-in member's main team, or their only team, or their first team; a signed-out reader goes to sign-in instead, and a member with no team sees "Your profile has no team to post for yet." A link with `postnews=open` SHALL open the modal on load the same way. From 1100px the side cards SHALL sit in a sticky column on the right; under 1100px they SHALL follow "You're all caught up". The side cards SHALL include "How personalization works": "Stories come from your topics first, then the teams you follow, then the network's top stories."

#### Scenario: Not on a team

- **GIVEN** the API returns `isTeamMember: false`
- **WHEN** the page shows
- **THEN** "Got news from your team?" is not shown

#### Scenario: Narrow screen

- **GIVEN** a 390px wide screen
- **WHEN** the page shows
- **THEN** there is no side column, and "How personalization works" follows "You're all caught up"

### Requirement: Add topics card

The side cards SHALL start with "Add topics": "Tick a topic to get stories about it in your digest.", then the page's suggested topics as News preferences' `#slug` chips, in the API's order, as many as fit three rows, then "See all topics". A chip's order SHALL never change while the page is open. A chip SHALL show as ticked when the reader follows that topic. For a signed-in reader, a press SHALL tick or untick the chip, and "Save topics" SHALL show once a chip differs from the saved topics.

#### Scenario: Save from the card

- **GIVEN** a signed-in member who follows `ai`, and the page suggests `defi` and `desci`
- **WHEN** they tick `#defi` and press Save topics
- **THEN** their News preferences tags become `ai` and `defi`, and the toast "Topics saved. Your next digest uses them." shows

#### Scenario: Nothing to suggest

- **GIVEN** the page suggests no topics
- **WHEN** the page shows
- **THEN** the card has no chips, and See all topics still opens the topics modal

### Requirement: Topics modal

"See all topics" in the card and "Change topics" after the intro line SHALL open the topics modal: "Your topics · N" (N = topics ticked in the modal), "Ticked topics shape your digest and For You on Home.", a search, and every News preferences tag in its themes as chips, followed ones ticked. Followed tags the tag list lacks SHALL still show, so they can be unticked. Picks SHALL be a draft until Save topics, which is enabled only when the draft differs. Cancel, ✕ and Esc SHALL close it and drop the draft. A link with `topics=open` SHALL open it on load.

#### Scenario: Cancel

- **GIVEN** a signed-in member opens the modal and ticks a topic
- **WHEN** they press Cancel
- **THEN** the modal closes and nothing is saved

### Requirement: Saving topics

Topics SHALL save only as the signed-in member's News preferences tags (the full list), through the same save as News preferences, never through the link. Before sign-in the page SHALL show the link member's topics; signed in, the member's own saved tags. A failed save SHALL keep the reader's picks in the card or the modal, show an error toast, and leave the saved topics unchanged. A signed-out reader who presses a chip, "See all topics" or "Change topics" SHALL go to sign-in, and come back to the same digest with the modal open, or with that chip ticked and Save topics showing. A signed-out reader who opens a `topics=open` link SHALL go to sign-in first. Once applied, `topics` and `topic` SHALL be removed from the address.

#### Scenario: Chip before sign-in

- **GIVEN** a signed-out reader
- **WHEN** they press `#defi`
- **THEN** sign-in opens, nothing is saved, and after sign-in the page shows `#defi` ticked with Save topics

#### Scenario: Failed save

- **GIVEN** a signed-in member ticked `#desci`
- **WHEN** Save topics fails
- **THEN** `#desci` stays ticked, Save topics stays, and no success toast shows

### Requirement: Topics events

The page SHALL record `digest-topics-saved` with `surface` (`card` or `modal`), `added`, `removed` and `total`; `digest-topics-modal-opened` with `via` (`see-all` or `change-topics`); and `digest-topics-sign-in-prompted` with `via` (`chip`, `see-all`, `change-topics` or `email`). None SHALL carry the link token.

#### Scenario: Saved from the modal

- **GIVEN** a member follows `ai` and ticks `defi` in the modal
- **WHEN** the save succeeds
- **THEN** `digest-topics-saved` is recorded with `surface: modal`, `added: 1`, `removed: 0`, `total: 2`

### Requirement: Past issues

The side cards SHALL end with "Past issues" when the API's `issues` lists more than one issue, and SHALL leave it out otherwise. Its title SHALL be a button that opens and closes the list. The list SHALL be closed when the page shows the newest listed issue and open when it shows an older one. Each row SHALL show the issue's date ("18 November 2026"), "· Latest" on the newest, and the issue's `title` when there is one, and SHALL link to the same page with the same link token: without `issue` for the link's own issue (`isLinkIssue`), with `issue=<sentAt>` for any other. The row of the issue on show SHALL be marked as the current page. `/digest?t=<token>&issue=<sentAt>` SHALL read that past issue, and More / Less on its stories SHALL send the same `issue`.

#### Scenario: Older issue

- **GIVEN** the API lists issues of 18, 16 and 12 November and the page shows 16 November from its own link
- **WHEN** the page loads
- **THEN** Past issues is open, 18 November shows "· Latest", 16 November is marked current, and 18 and 12 November link with `issue`

#### Scenario: One issue

- **GIVEN** the API lists only the link's own issue
- **WHEN** the page loads
- **THEN** there is no Past issues card

## ADDED Requirements

### Requirement: Email link swaps the token for the issue

`/digest?t=<token>` SHALL open the same digest as before, by asking the API for the token's issue id (with `issue=<send time>` from an older Past issues link). Right after the page loads, the browser address SHALL become `/digest?issue=<issue id>`: `t` and the send-time `issue` are gone, and every other parameter and the `#story-` or `#post-` anchor stay. The page SHALL never send the token after that.

#### Scenario: Read more from the email

- **GIVEN** an email link `/digest?t=<token>&utm_source=digest_email_read_more_link&link_type=read_more&position=2#story-<uid>`
- **WHEN** the page loads
- **THEN** it shows the issue scrolled to that story, and the address is `/digest?issue=<issue id>&utm_source=digest_email_read_more_link&link_type=read_more&position=2#story-<uid>`

#### Scenario: Copied address

- **GIVEN** a reader copies the address after the page loaded from an email link
- **WHEN** someone else opens it
- **THEN** the address has no token, and nothing the second reader does saves for the first

### Requirement: Reader data needs sign-in

The page SHALL show the reader's own data only when the reader is signed in: the greeting with their first name, their pressed More / Less, Follow state, topics and Past issues. Signed out, the page SHALL show the issue's stories, forum rows, More from the network and Upcoming events, the greeting "Hi there,", nothing pressed, and no Past issues card.

#### Scenario: Forwarded link, signed out

- **GIVEN** member M forwards a digest link on which M pressed More on story 1
- **WHEN** a signed-out reader opens it
- **THEN** they see the stories with "Hi there,", and More is not pressed on story 1

#### Scenario: Forwarded link, signed in

- **GIVEN** member X is signed in and opens member M's forwarded link
- **WHEN** the page loads
- **THEN** it greets X and shows X's own choices, topics and Past issues

### Requirement: More and Less ask a signed-out reader to sign in

A signed-out press on More like this or Less like this SHALL open the sign-in dialog, save nothing and leave the button not pressed. The page SHALL record `digest-sign-in-prompted` with `via` (`more` or `less`; `email-choice` for an email link) and `news_id`. Back from sign-in, the page SHALL save that choice once for the signed-in member, show it pressed with its confirmation and Undo, and remove the intent from the address.

#### Scenario: Press More signed out

- **GIVEN** a signed-out reader on `/digest?issue=<id>`
- **WHEN** they press More on story 2
- **THEN** the sign-in dialog opens, nothing is saved, and after sign-in More is saved once on story 2 for them and shown pressed with "You'll get more stories like this"

## MODIFIED Requirements

### Requirement: Digest page

The page `/digest?issue=<issue id>` SHALL show that digest issue to anyone who opens it, signed in or not, with the reader's own data only when signed in (see "Reader data needs sign-in"); an email link `/digest?t=<token>` opens the same issue (see "Email link swaps the token for the issue"). It SHALL show the LabOS top bar on desktop and the bottom bar on mobile. The page SHALL be a plain white page with the stories in a 760px column, with no grey background, white sheet or PL logo. It SHALL start with a dateline ("Weekly digest · 9 November 2026 · 5 stories", "Daily digest" for a daily link), then the greeting "Hi <first name>," as the page title (or "Hi there," without a name) and a "Change topics" link under it, all left-aligned, with no "Picked for you…" line (LAB-3348). Under 1100px the topics section (see "End of the issue and side cards") SHALL follow the header. Then it SHALL show every story in the order the API returns it, each in full, as an open section with a hairline between stories and no card: the team header (logo or initials, the team name linking to the team profile, Follow), the title and summary beside the image, the full text, and a Sources line listing every source with a link that opens in a new tab. The first story is the hero: its title and summary beside a big image, with no background picture. The other stories put the image beside the text, alternating sides. The top story keeps its "Top story" badge. The page SHALL NOT show "Read on <source>", Read more or Show less. Then it SHALL show "From the forum" (see that requirement). The page SHALL NOT open a story modal. The page SHALL NOT be indexed by search engines. Dates SHALL print the same on the server and in the browser.

#### Scenario: Signed-out member

- **GIVEN** a signed-out visitor with a valid link
- **WHEN** they open the page
- **THEN** they see the whole digest with "Hi there,", and no sign-in prompt shows until they press something that needs sign-in

#### Scenario: Forum unavailable

- **GIVEN** the API returns no forum posts because the forum did not answer
- **WHEN** the page shows
- **THEN** the stories show, and the forum section is not shown

#### Scenario: Story with three sources

- **GIVEN** a story with sources techcrunch.com, theblock.co and cryptobriefing.com
- **WHEN** the page shows
- **THEN** the story ends with "Sources: techcrunch.com · theblock.co · cryptobriefing.com", each a link to its article

### Requirement: Choice from the email

A link with `choice=more` or `choice=less` and `story=<uid>` (from emails sent before More / Less left the email) SHALL, for a signed-in reader, save that choice once per page load for that reader, in the browser after the page loads, never during the server render. While it saves, the button SHALL show as pressed. After the save, the top of that story's card SHALL show "You'll get more stories like this" or "You'll get fewer stories like this" with an Undo button. After the save, the page SHALL remove `choice` and `story` from the address, so a reload does not save again. If the save fails, the button SHALL NOT stay pressed, no confirmation SHALL show, an error toast SHALL show, and `choice` and `story` stay in the address so a reload tries again. For a signed-out reader the page SHALL open the sign-in dialog once and save nothing; back from sign-in, the choice is saved as above. It SHALL NOT start a sign-in while a Google or GitHub sign-in is returning.

#### Scenario: Less from the email

- **GIVEN** a signed-in member opens a link with `story=<uid>&choice=less#story-<uid>`
- **WHEN** the page loads
- **THEN** the page saves Less once for them, is scrolled to the story, shows Less pressed, and shows "You'll get fewer stories like this" with Undo at the top of the card

#### Scenario: Link scanner

- **GIVEN** a link scanner that fetches the page without running scripts
- **WHEN** it fetches a More link
- **THEN** no choice is saved

#### Scenario: Less from the email, signed out

- **GIVEN** a signed-out reader opens a link with `story=<uid>&choice=less`
- **WHEN** the page loads
- **THEN** the sign-in dialog opens and nothing is saved; after sign-in Less is saved once for them

### Requirement: More and Less on the page

Each news story SHALL have "More like this" and "Less like this" buttons that show the signed-in member's saved choice as pressed. Forum posts SHALL NOT have them. A press by a signed-in member SHALL save the choice for that member and then show the confirmation under the buttons; a signed-out press asks for sign-in (see "More and Less ask a signed-out reader to sign in"). A press on the other button SHALL replace the choice. A press on the active button, or Undo, SHALL undo the choice, remove the confirmation and show the toast "Undone. Your preferences haven't changed." A failed save or undo SHALL keep the last saved state and show an error toast.

#### Scenario: Press More

- **GIVEN** a signed-in member and a story with nothing pressed
- **WHEN** the member presses More
- **THEN** More shows as pressed and "You'll get more stories like this" with Undo shows under the buttons

#### Scenario: Second press

- **GIVEN** Less is pressed on a story
- **WHEN** the member presses Less again
- **THEN** the choice is undone, the confirmation goes away and the toast shows

### Requirement: Link that does not work

When the token is missing, malformed, wrongly signed or expired, the issue id is unknown, or the API cannot read the digest, the page SHALL show a short message ("This digest link has expired" for an expired link, otherwise "We couldn't open this digest") with a link to Home, and no stories. A loading skeleton SHALL show while the digest loads.

#### Scenario: Expired link

- **GIVEN** a link older than 90 days
- **WHEN** the page opens
- **THEN** it shows "This digest link has expired" and a link to Home

#### Scenario: Unknown issue

- **GIVEN** `/digest?issue=<an id no issue has>`
- **WHEN** the page opens
- **THEN** it shows "We couldn't open this digest" and a link to Home

### Requirement: Digest page events

The page SHALL record these PostHog events, and no event SHALL carry the link token:

- On open, the email click with the existing digest email click events. A news link records `forum-digest-email-news-clicked`, and a post link records `forum-digest-email-post-clicked`. They carry `utm_source`, `position`, the news or topic id, and a new `link_type`: `story`, `read_more`, `more`, `less`, `view_in_browser`, `post`, `post_news` (the email's "Post your team news →") or `change_topics` (the email's "Change topics").
- `digest-page-viewed`, once per load, with `frequency`, `sent_at`, `from` (`email-more`, `email-less`, `email-story`, `email-post`, `email-post-news`, `email-change-topics`, `view-in-browser` or `direct`) and `is_logged_in`.
- `digest-story-read` on a "Read on <source>" click, with `news_id` and `position`.
- `digest-network-news-clicked` on a More from the network row, with `news_id`, `position` and `domain`.
- `digest-event-clicked` on an Upcoming events row, with `event_uid`, `position` and `opens` (`drawer` or `calendar`); `digest-events-see-all-clicked`, with `total`.
- `digest-forum-thread-clicked` on a From the forum row, with `topic_id`, `position` and `opens` (`modal` or `forum`); `digest-forum-open-clicked` on "Open the forum". Likes in the forum modal record Home's forum post like events with source `digest`.
- `digest-more-clicked` and `digest-less-clicked` on a press, with `news_id`, `position` and `active_after`.
- `digest-undo-clicked`, with `news_id`, `choice_reverted` and `via` (`undo-button` or `second-press`).
- `digest-sign-in-prompted` when a press asks a signed-out reader to sign in, with `via` (`more`, `less` or `email-choice`) and `news_id`.

Every URL that PostHog records SHALL have the token parameter removed.

#### Scenario: Token kept out of analytics

- **GIVEN** a member opens `/digest?t=<token>`
- **WHEN** PostHog records the page view
- **THEN** the recorded URL has no `t` parameter

#### Scenario: Change topics from the email

- **GIVEN** a member opens `/digest?t=<token>&utm_source=digest_email_change_topics_link&link_type=change_topics&position=0&topics=open`
- **WHEN** the page loads
- **THEN** it records `forum-digest-email-news-clicked` with `link_type` `change_topics`, and `digest-page-viewed` with `from` `email-change-topics`

### Requirement: Footer

The page SHALL end with the email's sign-off and footer: "Cheers," and "The Protocol Labs team", then "You received this email because you are a member of the Protocol Labs network." with the links "Manage preferences" and "Unsubscribe". Both links SHALL open the email settings page `/settings/email`, which asks a signed-out reader to sign in, so a forwarded page never changes the sender's email settings. Each keeps its own `utm_source` (`digest_page_manage_link`, `digest_page_unsubscribe_link`). The email's own footer keeps its signed links to `/digest/email` (LAB-3309).

#### Scenario: Footer

- **WHEN** the page shows
- **THEN** after "Cheers, The Protocol Labs team" it shows "You received this email because you are a member of the Protocol Labs network.", "Manage preferences" and "Unsubscribe"

#### Scenario: Unsubscribe from the page, signed out

- **GIVEN** a signed-out reader on `/digest?issue=<id>`
- **WHEN** they press "Unsubscribe" in the footer
- **THEN** `/settings/email` opens and asks them to sign in, and no one's email settings change

### Requirement: Past issues

The side cards SHALL end with "Past issues" when the API's `issues` lists more than one issue, and SHALL leave it out otherwise; signed out the API lists none. Its title SHALL be a button that opens and closes the list. The list SHALL be closed when the page shows the newest listed issue and open when it shows an older one. Each row SHALL show the issue's date ("18 November 2026"), "· Latest" on the newest, and the issue's `title` when there is one, and SHALL link to `/digest?issue=<that issue's id>`. The row of the issue on show (`isLinkIssue`) SHALL be marked as the current page. More / Less on a past issue's stories SHALL save against that issue.

#### Scenario: Older issue

- **GIVEN** the API lists issues of 18, 16 and 12 November and the page shows 16 November
- **WHEN** the page loads
- **THEN** Past issues is open, 18 November shows "· Latest", 16 November is marked current, and 18 and 12 November link to `/digest?issue=<their ids>`

#### Scenario: One issue

- **GIVEN** the API lists only the issue on show
- **WHEN** the page loads
- **THEN** there is no Past issues card

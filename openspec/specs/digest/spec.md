# digest Specification

## Purpose

The digest reading page `/digest?t=` (LAB-3264): the LabOS digest email opens one page with the member's whole digest, without sign-in, with More like this, Less like this and Undo on each story.

## Requirements

### Requirement: Digest page

The page `/digest?t=<token>` SHALL show the digest named by the link token to anyone who opens it, signed in or not, with no sign-in prompt. It SHALL show the LabOS top bar on desktop and the bottom bar on mobile. The page SHALL be a plain white page with the stories in a 760px column, with no grey background, white sheet or PL logo. It SHALL start with a dateline ("Weekly digest · 9 November 2026 · 5 stories", "Daily digest" for a daily link), then the greeting "Hi <first name>," as the page title (or "Hi there," without a name) and under it "The week’s top stories from across the Protocol Labs network, in one place.", all left-aligned, with no "Picked for you…" line and no "Change topics" link (LAB-3348). Under 1100px the topics section (see "End of the issue and side cards") SHALL follow the header. Then it SHALL show every story in the order the API returns it, each in full, as an open section with a hairline between stories and no card: the team header (logo or initials, the team name linking to the team profile, Follow), the title and summary beside the image, the full text, and a Sources line listing every source with a link that opens in a new tab. The first story is the hero: its title and summary beside a big image, with no background picture. The other stories put the image beside the text, alternating sides. The top story keeps its "Top story" badge. The page SHALL NOT show "Read on <source>", Read more or Show less. Then it SHALL show "From the forum" (see that requirement). The page SHALL NOT open a story modal. The page SHALL NOT be indexed by search engines. Dates SHALL print the same on the server and in the browser.

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
- `digest-network-news-clicked` on a More from the network row, with `news_id`, `position` and `domain`.
- `digest-event-clicked` on an Upcoming events row, with `event_uid`, `position` and `opens` (`drawer` or `calendar`); `digest-events-see-all-clicked`, with `total`.
- `digest-forum-thread-clicked` on a From the forum row, with `topic_id`, `position` and `opens` (`modal` or `forum`); `digest-forum-open-clicked` on "Open the forum". Likes in the forum modal record Home's forum post like events with source `digest`.
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

Each story's team header SHALL have Follow, which starts from the API's `followsTeam` for the reader. A press SHALL follow or unfollow the team for the signed-in member, update every story of that team on the page, and revert if the save fails. Each story's actions row SHALL have More like this and Less like this, then Comments (the feed's button, with the API's comment count) and Share (the feed's share menu, sharing the story's Home link, never the digest link). Comments SHALL open the feed's comment thread under the story. A signed-out press on Follow or Comments SHALL open the sign-in prompt (LAB-3347; see "Sign-in prompt"); back from sign-in the team is followed, or the story's thread opens and comes into view.

#### Scenario: Follow when signed out

- **GIVEN** a signed-out reader on a valid link
- **WHEN** they press Follow on a story
- **THEN** "Sign in to follow <team>" opens and no follow is saved

#### Scenario: Two stories from one team

- **GIVEN** a signed-in reader and two stories from the same team, not followed
- **WHEN** they press Follow on the first
- **THEN** both stories show Following

### Requirement: End of the issue and side cards

After the stories and forum posts, the page SHALL show "You're all caught up" with a check, "The next digest arrives on <weekday>, <day> <month>." from the API's `nextSendAt` (the line is left out when it is missing), and a "See all network news" link to Home. When the API's `isTeamMember` is true, the page SHALL show the outlined "Got news from your team?" card with "Post your team news →" to a signed-in member, except one whose own record lists no team. It SHALL NOT show to a signed-out reader, whose team is unknown (LAB-3347). For a signed-in member of one team, "Post your team news →" SHALL open the Post news modal for that team. For a member of more than one team it SHALL ask "Post as" with one button per team, main team first, and a press SHALL open the modal for that team. A link with `postnews=open` landing signed out SHALL go to sign-in and come back to the page with `postnews=open`. A link with `postnews=open` SHALL do the same as a press once the reader is signed in (except on the way back from Google or GitHub sign-in, see Saving topics), bringing the "Post as" question into view, and SHALL then be dropped from the address so a reload doesn't repeat it. The teams SHALL come from the signed-in member's own record (`teamMemberRoles`). The topics section SHALL be "How personalization works" ("Stories come from your topics first, then the teams you follow, then the network's top stories."), then the Suggested topics card (LAB-3348). For a signed-out reader (known from the server before the page hydrates) "How personalization works" SHALL instead say "You're seeing the network's top stories. Signed in, your digest leads with your topics, then the teams you follow." and end with "Sign in to personalize", which opens the sign-in prompt (LAB-3347). From 1100px the side cards SHALL sit in a sticky column on the right: the topics section, then Past issues. Under 1100px the topics section SHALL follow the page header, before the stories, and Past issues SHALL follow "You're all caught up".

#### Scenario: Not on a team

- **GIVEN** the API returns `isTeamMember: false`
- **WHEN** the page shows
- **THEN** "Got news from your team?" is not shown

#### Scenario: Post news for the member's one team

- **GIVEN** a signed-in member of one team, Lattice, and the API returns `isTeamMember: true`
- **WHEN** they press "Post your team news →"
- **THEN** the Post news modal opens: "Published as Lattice, to its followers and the network feed."

#### Scenario: Post news as one of several teams

- **GIVEN** a signed-in member of Lattice and Aave, with Aave their main team
- **WHEN** they press "Post your team news →"
- **THEN** "Post as" shows Aave, then Lattice, and pressing Lattice opens the Post news modal for Lattice

#### Scenario: Post news from the email, signed out

- **GIVEN** a signed-out reader on a team, who sees no "Got news from your team?" card
- **WHEN** they open the email's "Post your team news →" (`postnews=open`)
- **THEN** sign-in opens, and after it the page opens the Post news modal (or "Post as") and drops `postnews` from the address

#### Scenario: Narrow screen

- **GIVEN** a 390px wide screen
- **WHEN** the page shows
- **THEN** there is no side column, "How personalization works" and Suggested topics follow the header before the first story, and Past issues follows "You're all caught up"

### Requirement: Footer

The page SHALL end with the email's sign-off and footer: "Cheers," and "The Protocol Labs team", then "You received this email because you are a member of the Protocol Labs network." with the links "Manage preferences" and "Unsubscribe". Both links SHALL open the digest email page (`/digest/email`) with the page's link token, so they work signed out: Manage preferences with `link_type=manage`, Unsubscribe with `link_type=unsubscribe`, each with its own `utm_source` (`digest_page_manage_link`, `digest_page_unsubscribe_link`) so these clicks are told apart from the email's footer.

#### Scenario: Footer

- **WHEN** the page shows
- **THEN** after "Cheers, The Protocol Labs team" it shows "You received this email because you are a member of the Protocol Labs network.", "Manage preferences" and "Unsubscribe"

#### Scenario: Unsubscribe from the page, signed out

- **GIVEN** a signed-out reader on `/digest?t=<token>`
- **WHEN** they press "Unsubscribe" in the footer
- **THEN** `/digest/email?t=<token>&link_type=unsubscribe` opens with the Unsubscribe button, and nothing changes until they press it

### Requirement: Suggested topics card

The topics section SHALL end with "Suggested topics" (renamed from "Add topics" in Polina's 2026-11-20 prototype): "Tick a topic to get stories about it in your digest.", then the page's suggested topics (topics the reader doesn't follow yet) as News preferences' `#slug` chips, in the API's order, as many as fit three rows, then "See all topics". The card SHALL NOT list the topics the reader follows; unfollowing is in the topics modal. A suggestion ticked and saved during the visit SHALL stay in place, ticked. A chip's order SHALL never change while the page is open. For a signed-in reader, a press SHALL tick or untick the chip, and "Save topics" SHALL show once a chip differs from the saved topics. Signed out, the chips SHALL show unticked and Save topics SHALL never show.

#### Scenario: Save from the card

- **GIVEN** a signed-in member who follows `ai`, and the page suggests `defi` and `desci`
- **WHEN** they tick `#defi` and press Save topics
- **THEN** their News preferences tags become `ai` and `defi`, and the toast "Topics saved. Your next digest uses them." shows

#### Scenario: Followed topics are left out

- **GIVEN** a signed-in member who follows `ai` and `web3`, and the page suggests `defi` and `desci`
- **WHEN** the page shows
- **THEN** the card shows `#defi` and `#desci` unticked, and neither `#ai` nor `#web3`

#### Scenario: Nothing to suggest

- **GIVEN** the page suggests no topics
- **WHEN** the page shows
- **THEN** the card has its title and line but no chips, and See all topics still opens the topics modal

### Requirement: Topics modal

"See all topics" in the card SHALL open the topics modal: "Your topics · N" (N = topics ticked in the modal), "Ticked topics shape your digest and For You on Home.", a search, and every News preferences tag in its themes as chips, followed ones ticked. Followed tags the tag list lacks SHALL still show, so they can be unticked. Picks SHALL be a draft until Save topics, which is enabled only when the draft differs. Cancel, ✕ and Esc SHALL close it and drop the draft. A link with `topics=open` SHALL open it on load.

#### Scenario: Cancel

- **GIVEN** a signed-in member opens the modal and ticks a topic
- **WHEN** they press Cancel
- **THEN** the modal closes and nothing is saved

### Requirement: Saving topics

Topics SHALL save only as the signed-in member's News preferences tags (the full list), through the same save as News preferences, never through the link. Before sign-in the page SHALL show the link member's topics; signed in, the member's own saved tags. A failed save SHALL keep the reader's picks in the card or the modal, show an error toast, and leave the saved topics unchanged. A signed-out reader who presses a chip or "See all topics" SHALL get the sign-in prompt (LAB-3347), and after sign-in come back to the same digest with the modal open, or with that chip ticked and Save topics showing. A signed-out reader who opens a `topics=open` link SHALL get the same prompt first. Google and GitHub sign-in come back to the same address with `privy_oauth_*` added, still signed out while the sign-in finishes: the page SHALL NOT start another sign-in then, for `topics=open` or `postnews=open`, because starting one throws away the sign-in that is finishing. Once applied, `topics` and `topic` SHALL be removed from the address.

#### Scenario: Chip before sign-in

- **GIVEN** a signed-out reader
- **WHEN** they press `#defi`
- **THEN** "Sign in to add #defi" opens, nothing is saved, and after Sign in there the page shows `#defi` ticked with Save topics

#### Scenario: Back from Google sign-in

- **GIVEN** a signed-out reader pressed "See all topics" and signed in with Google
- **WHEN** Google brings them back to `/digest?t=<token>&topics=open&privy_oauth_…`
- **THEN** sign-in does not open again, the sign-in finishes, and the page reloads signed in with the topics modal open

#### Scenario: Failed save

- **GIVEN** a signed-in member ticked `#desci`
- **WHEN** Save topics fails
- **THEN** `#desci` stays ticked, Save topics stays, and no success toast shows

### Requirement: Topics events

The page SHALL record `digest-topics-saved` with `surface` (`card` or `modal`), `added`, `removed` and `total`; `digest-topics-modal-opened` with `via` `see-all`; and `digest-topics-sign-in-prompted` with `via` (`chip`, `see-all` or `email`). A forum thread press that asks for sign-in SHALL record `digest-sign-in-prompted` (see "From the forum"). The reader's answer to the sign-in prompt records `digest-sign-in-prompt-answered` (see "Digest page events"). None SHALL carry the link token.

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

### Requirement: Upcoming events

After More from the network and before the forum posts, the page SHALL show "Upcoming events" with the subtitle "The next four weeks in the network" and one row per item of the page's `events`, in the order given. A row SHALL show Home's date tile, the name, when and where ("Fri · Lisbon" for a one-day event, "Nov 30–Dec 2 · Lisbon" for a longer one, "Online" for a virtual one, in UTC), "N going" when the count is above zero, and the event's logo when it has one. As on Home's rail: with the event drawer flag on and a signed-in member, a row SHALL open the event drawer over the page (source `digest`) and show "You're going" on events the member goes to; otherwise a row SHALL link to the event in the All Events calendar. The section SHALL end with "See all N events" ("See all 1 event" for one), linking to All Events. With no events the section SHALL NOT show.

#### Scenario: Signed-out reader

- **GIVEN** the event drawer flag is on and the reader is signed out
- **WHEN** they press an event row
- **THEN** All Events opens on that event

#### Scenario: Signed-in member

- **GIVEN** the event drawer flag is on and the member is signed in
- **WHEN** they press an event row
- **THEN** the event drawer opens over the digest page

### Requirement: From the forum

After Upcoming events, the page SHALL show "From the forum" with the subtitle "Top threads from the past week." and one numbered row per item of the page's `forumPosts`, in the order given (the email's order): the number, the title and "N replies" ("1 reply" for one; nothing for a thread without replies, as in the email). A row SHALL open Home's forum post modal (the full post, likes, comments) over the page for a signed-in member with forum access whose feed has the thread; otherwise it SHALL link to the thread in the forum. For a signed-out reader a row SHALL open the sign-in prompt ("Sign in to read this thread", LAB-3347) instead and open nothing, recording `digest-sign-in-prompted` with `via: forum-post`, `topic_id` and `position` (LAB-3348); back from sign-in (`post=<tid>` in the address), the page SHALL open that thread once, in the modal or else in the forum, as soon as it knows which, and remove `post` from the address. Until the reader is known a row SHALL stay a link to the forum. Each row SHALL be the `post-<tid>` anchor, so links from older emails land on it. The section SHALL end with "Open the forum →", linking to the forum; signed out it SHALL open the sign-in prompt ("Sign in to open the forum") and go on to the forum after sign-in, recording `digest-sign-in-prompted` with `via: forum-open` instead of `digest-forum-open-clicked`. With no forum posts, or when the forum did not answer, the section SHALL NOT show.

#### Scenario: Signed-out reader

- **GIVEN** the reader is signed out
- **WHEN** they press a thread
- **THEN** "Sign in to read this thread" opens and the thread does not open; after Sign in there the thread opens in the modal, or in the forum when the modal can't show it

#### Scenario: Signed-in member with forum access

- **GIVEN** the member is signed in, has forum access and the thread is in their feed
- **WHEN** they press the thread
- **THEN** the forum post modal opens over the digest page, where they can like it and comment

### Requirement: Digest email page

`/digest/email?t=<link token>` SHALL show the link member's digest email settings without sign-in: a greeting with their first name, whether the digest is on, and whether it is daily or weekly. It SHALL read them on the server through `POST /v1/labos-digest/email-settings/read`; opening the page SHALL change nothing. It SHALL offer:

- turning the digest off ("Unsubscribe") or back on ("Turn the digest back on");
- switching between daily and weekly while it is on;
- "All email preferences", a link to `/settings/email`;
- "Read your digest", a link to `/digest?t=<the same token>`.

The page SHALL NOT be indexed and SHALL send no Referer.

#### Scenario: Manage from the footer

- **GIVEN** a signed-out reader whose digest is on and daily
- **WHEN** they open the Manage preferences link
- **THEN** the page says the digest is on and daily, offers Unsubscribe and Switch to weekly, and nothing has changed

#### Scenario: Signed in as someone else

- **GIVEN** a browser signed in as another member
- **WHEN** the page opens from a link
- **THEN** it shows and changes the link member's settings

### Requirement: Footer action waits for a press

When the link carries `link_type=unsubscribe`, the page SHALL make "Unsubscribe" its main button. When it carries `link_type=switch_frequency` with `to=weekly` or `to=daily`, the main button SHALL be "Switch to weekly" or "Switch to daily". The page SHALL NOT change anything until the reader presses a button. When the requested state already holds, the page SHALL say so instead: an Unsubscribe link with the digest off says "You're already unsubscribed from the digest" and offers "Turn the digest back on"; a Switch link to the frequency the digest already has says "Your digest is already weekly" (or daily) with no button. A Switch link while the digest is off says "The digest is off" and offers "Turn on the weekly digest" (or daily), which turns it on at that frequency. An unknown `link_type` or `to` behaves as Manage.

#### Scenario: A scanner opens the Unsubscribe link

- **WHEN** the Unsubscribe link is opened and nothing is pressed
- **THEN** the digest stays on

#### Scenario: Unsubscribe

- **GIVEN** the page opened from the Unsubscribe link
- **WHEN** the reader presses Unsubscribe
- **THEN** the digest is off and the page says "You're unsubscribed from the digest" with Undo

#### Scenario: Switch to weekly

- **GIVEN** the page opened from Switch to weekly
- **WHEN** the reader presses Switch to weekly
- **THEN** the digest is weekly and the page says "Your digest is now weekly" with Undo

#### Scenario: Already unsubscribed

- **GIVEN** the digest is already off
- **WHEN** the Unsubscribe link opens the page
- **THEN** it says "You're already unsubscribed from the digest" and offers "Turn the digest back on"

#### Scenario: Switch link while the digest is off

- **GIVEN** the digest is off
- **WHEN** the Switch to weekly link opens the page and the reader presses "Turn on the weekly digest"
- **THEN** the digest is on and weekly

### Requirement: Undo and failed saves

After a change, Undo SHALL restore the previous on/off and frequency with one more change call. A failed change SHALL leave the shown settings as they were and say "We couldn't save that." with "Try again", which repeats the same change.

#### Scenario: Undo an unsubscribe

- **GIVEN** the reader just unsubscribed
- **WHEN** they press Undo
- **THEN** the digest is on again with its frequency, and the page shows the settings again

#### Scenario: Save fails

- **WHEN** the change call fails
- **THEN** the page still shows the old settings and "We couldn't save that." with "Try again"

### Requirement: Digest email page link that does not work

When the token is missing, malformed, wrongly signed or expired, or the API cannot read the settings, the page SHALL show a short message ("This link has expired" for an expired link, otherwise "We couldn't open your email settings") and an "Email preferences" link to `/settings/email` to manage email after sign-in. While the settings load, the page SHALL show its own small skeleton, not the digest's.

#### Scenario: Expired link

- **GIVEN** a link older than 90 days
- **WHEN** the page opens
- **THEN** it says "This link has expired" and links to email preferences

### Requirement: Digest email page events

The page SHALL record these PostHog events, none carrying the link token:

- `digest-email-page-viewed`, once per load, with `link_type` (`manage`, `unsubscribe`, `switch_frequency` or `direct`), `enabled`, `frequency` and `is_logged_in`.
- `digest-email-unsubscribed`, `digest-email-resubscribed` and `digest-email-frequency-changed` (with `frequency`) on a saved change, each with `via` (`main-button` or `controls`).
- `digest-email-undo-clicked`, with `reverted` (`unsubscribe`, `resubscribe` or `frequency`).
- `digest-email-save-failed`, with `action` (`unsubscribe`, `resubscribe`, `frequency` or `undo`).

#### Scenario: Unsubscribe recorded

- **WHEN** the reader unsubscribes from the main button
- **THEN** `digest-email-unsubscribed` is recorded with `via: 'main-button'` and no token

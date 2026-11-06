## MODIFIED Requirements

### Requirement: The new Home is behind a flag

`/home` SHALL show the new Home only when the build-time flag `NEXT_PUBLIC_SHOW_HOME_V2` is `true`. With the flag off, `/home` SHALL render as it did before this change for every viewer, and `?view=news` SHALL be ignored. With the flag on, a signed-out visitor SHALL get the signed-out story below, a signed-in member the signed-in Home, and anyone who opens `/home?view=news` the news page.

#### Scenario: Flag off

- **GIVEN** `NEXT_PUBLIC_SHOW_HOME_V2` is not `true`
- **WHEN** anyone opens `/home` or `/home?view=news`
- **THEN** the page is the previous Home, with the Welcome card, the news feed and the focus areas

#### Scenario: Flag on, signed out

- **GIVEN** the flag is on
- **WHEN** a signed-out visitor opens `/home`
- **THEN** the page is the signed-out story

#### Scenario: Flag on, news view

- **GIVEN** the flag is on
- **WHEN** a member or a signed-out visitor opens `/home?view=news`
- **THEN** the page is the news page

### Requirement: News stories show their image

With the flag on, a news story whose `imageUrl` is set SHALL show that image (LAB-3134). The image SHALL be 16:9 with `object-fit: cover`, a 1px `--border-neutral-subtle` border and `alt=""`, and SHALL load lazily. Its radius SHALL be 10px on cards and 12px in the story dialog. The stored URL SHALL be served as is, with no `srcset` (resized copies come with LAB-3135).

- **Signed-in stream card:** a 168 × 95 thumbnail right of the text from 640px wide. Below 640px it SHALL take the card's full width under the text, before the meta line.
- **Story dialog:** the header image under the headline and above the body, at the dialog's full width up to 632 × 356. This applies to the dialog the new Home opens, signed in or signed out.
- **News page card** (`?view=news`, LAB-3126): the card's full width under the tags and above the meta line, on every width, at most 592 × 333. Image and meta line SHALL sit on the card's floor, so the images in a row line up.
- The signed-out This week rows SHALL NOT show an image.

The image SHALL NOT be a separate control: clicking it SHALL open the story as the rest of the row does. While it loads, and if it fails, the frame SHALL show a soft brand gradient tile, never a broken image. A story without `imageUrl` SHALL be text-only.

With the flag off nothing SHALL change. The previous Home's cards and its story dialog, and the team and member profiles' news, SHALL stay text-only.

#### Scenario: Thumbnail on desktop

- **GIVEN** the flag is on and a story in the signed-in stream has an `imageUrl`
- **WHEN** the member views `/home` at 1440 px wide
- **THEN** the card shows the image as a 168 × 95 thumbnail right of the headline, summary and tags
- **AND** clicking the image opens the story's dialog once

#### Scenario: Full width on phones

- **GIVEN** the same story
- **WHEN** the member views `/home` at 375 px wide
- **THEN** the image takes the card's full width under the text and above the meta line

#### Scenario: The image fails to load

- **GIVEN** a story whose `imageUrl` returns an error
- **WHEN** its card or dialog renders
- **THEN** the frame shows the brand gradient tile and no broken image

#### Scenario: Story without an image

- **GIVEN** a story with no `imageUrl`
- **WHEN** its card renders in the stream
- **THEN** the card is text-only, as before

#### Scenario: Dialog header

- **GIVEN** the flag is on and a story with an `imageUrl`
- **WHEN** the reader opens it from the new Home
- **THEN** the dialog shows the image under the headline and above the body, at most 632 × 356

#### Scenario: Previous Home unchanged

- **GIVEN** the flag is off and a story with an `imageUrl`
- **WHEN** a member opens `/home` and then the story
- **THEN** neither the card nor the dialog shows the image

#### Scenario: News page card

- **GIVEN** the flag is on and a story with an `imageUrl`
- **WHEN** anyone opens `/home?view=news`
- **THEN** the story's card shows the image at the card's full width under its tags, with the meta line under it

## ADDED Requirements

### Requirement: The news page

"See all news" (signed in) and "See all updates" (signed out) SHALL open `/home?view=news`: the last 14 days' network news only, with no forum posts, roll-ups or deals. The head SHALL show "← Home", "Network news" as the page's only `<h1>`, and "N stories from network teams". The stories SHALL be production's boxed news card with its `#tag` links, in 2 columns from 640px and 1 below. Signed out, Follow and Like SHALL open sign-up.

#### Scenario: News only

- **GIVEN** the flag is on and a member with forum access
- **WHEN** they open `/home?view=news` at 1440, 768 or 375 px wide
- **THEN** only news cards show, in 2, 2 and 1 columns

#### Scenario: Signed out

- **GIVEN** a signed-out visitor on the news page
- **WHEN** they press Follow or Like on a card
- **THEN** sign-up opens
- **AND** pressing the card itself opens the story

#### Scenario: No news

- **GIVEN** the news call fails
- **WHEN** anyone opens the news page
- **THEN** the page says news isn't available right now, and does not show the error page

### Requirement: News page filters

The news page SHALL offer For You (only when it has stories) · All · Top · Funding · Launch · Announcement with counts, and Sort by (Latest, Following, Most popular). It SHALL have no Discussions pill and SHALL open on All. A pill with a count of 0 SHALL be hidden, pressing the active pill SHALL reset to All, and phones SHALL get the "Type:" dropdown.

#### Scenario: Active pill pressed again

- **GIVEN** the Funding pill is active
- **WHEN** the reader presses it again
- **THEN** the filter goes back to All

#### Scenario: Opens on All

- **GIVEN** a member whose For You has stories
- **WHEN** they open the news page
- **THEN** For You is offered, and All is the active pill

### Requirement: News page search and tags

Production's news search SHALL be held open beside the title, and on phones be the full-width field under the head. It SHALL match team, headline, summary and tags, with a leading `#` dropped, and narrow on top of the pill and the tags; the pill counts and the scope count SHALL follow it. `#tag` clicks SHALL stack into the stream's scope row: "Filter: #tag ✕ · N stories", with Clear all and Narrow by.

#### Scenario: Search follows the counts

- **GIVEN** stories tagged `ai` and stories that aren't
- **WHEN** the reader searches `#ai`
- **THEN** only the `ai` stories show and the pill counts count only them
- **AND** a search with no match shows "No stories match … Clear search"

#### Scenario: Tags stack

- **GIVEN** stories tagged `ai`, and `ai` plus `robotics`
- **WHEN** the reader clicks #ai, then #robotics
- **THEN** only the second story shows, and the scope row has two chips and "1 story"

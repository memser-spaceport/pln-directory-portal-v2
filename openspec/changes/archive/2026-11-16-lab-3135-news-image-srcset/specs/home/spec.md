# Spec Delta

## MODIFIED Requirements

### Requirement: News stories show their image

With the flag on, a news story whose `imageUrl` is set SHALL show that image (LAB-3134). The image SHALL be 16:9 with `object-fit: cover`, a 1px `--border-neutral-subtle` border and `alt=""`, and SHALL load lazily. Its radius SHALL be 10px on cards and 12px in the story dialog. When the story has resized copies (`image.variants`, LAB-3135), the image SHALL list them in `srcset` with `sizes` for its place, and `src` SHALL be the largest copy. When `image` is null, the stored `imageUrl` SHALL be served as is, with no `srcset`.

- **Signed-in stream card:** a 168 × 95 thumbnail right of the text from 640px wide. Below 640px it SHALL take the card's full width under the text, before the meta line.
- **Story dialog:** the header image under the headline and above the body, at the dialog's full width up to 632 × 356. This applies to the dialog the new Home opens, signed in or signed out.
- **News page card** (`?view=news`, LAB-3126): the card's full width under the tags and above the meta line, on every width, at most 592 × 333. Image and meta line SHALL sit on the card's floor, so the images in a row line up.
- The signed-out This week rows SHALL NOT show an image.

The image SHALL NOT be a separate control: clicking it SHALL open the story as the rest of the row does. While it loads, and if it fails, the frame SHALL show a soft brand gradient tile, never a broken image. A story without `imageUrl` and without `image` SHALL be text-only.

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

#### Scenario: Resized copies in srcset

- **GIVEN** the flag is on and a story with `image.variants` at 400, 800 and 1200 wide
- **WHEN** its stream card renders
- **THEN** the image `srcset` lists the three copies with their widths
- **AND** `sizes` is `(min-width: 640px) 168px, 100vw`, and `src` is the 1200 copy
- **AND** the News page card uses `(min-width: 640px) 592px, 100vw` and the story dialog uses `(min-width: 640px) 632px, 100vw`

#### Scenario: No resized copies yet

- **GIVEN** the flag is on and a story with an `imageUrl` and `image` null
- **WHEN** its card renders
- **THEN** the image `src` is the `imageUrl` and there is no `srcset`

#### Scenario: Previous Home unchanged

- **GIVEN** the flag is off and a story with an `imageUrl`
- **WHEN** a member opens `/home` and then the story
- **THEN** neither the card nor the dialog shows the image

#### Scenario: News page card

- **GIVEN** the flag is on and a story with an `imageUrl`
- **WHEN** anyone opens `/home?view=news`
- **THEN** the story's card shows the image at the card's full width under its tags, with the meta line under it

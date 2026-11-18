## ADDED Requirements

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

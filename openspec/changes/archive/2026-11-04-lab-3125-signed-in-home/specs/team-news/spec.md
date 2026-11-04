## MODIFIED Requirements

### Requirement: Filter the Home feed by tag

With `NEXT_PUBLIC_SHOW_NEWS_PREFERENCES` on and `NEXT_PUBLIC_SHOW_HOME_V2` off, clicking a `#tag` on Home SHALL filter the feed to the stories carrying exactly that tag, switch to the All tab and All categories, and close the detail modal if the click came from it. A "Filter: #tag ×" chip SHALL show on the filter row with the number of matching updates. While a tag filter is on, the tab and category counts SHALL count only the filtered stories, and forum posts, hiring roll-ups, deals and the Top stories band SHALL be hidden. The × or a second click on the active tag SHALL clear the filter. The filter is page state, not a URL parameter.

With `NEXT_PUBLIC_SHOW_HOME_V2` on, Home's news cards SHALL show their tags as `#tag` links, and tag clicks SHALL stack:

- **Scope.**
  - A story SHALL show only if it carries every selected tag.
  - Forum posts, which carry no tags, SHALL be hidden while any tag is selected.
  - The pill counts SHALL count only the stories in scope.
- **Scope row,** on its own row under the pills:
  - one chip with × per selected tag, and the number of matching updates;
  - "Follow" when one tag is selected (with News preferences on, it adds the tag to the member's News preferences tags);
  - "Clear all" when two or more are selected;
  - "Narrow by" with up to three of the commonest other tags among the stories in scope.
- **Toggling.** Clicking a selected tag again, or its ×, SHALL remove it.
- **Search.** A search query SHALL ignore a leading `#`, so `#ai` matches stories tagged `ai`.
- **State.** The scope is page state, not a URL parameter.

#### Scenario: Filter by a tag

- **GIVEN** the news preferences flag is on, the Home v2 flag is off, and stories tagged `ai` are among others
- **WHEN** a member clicks `#ai` on a feed card
- **THEN** only the stories tagged `ai` show, on the All tab and All categories, with a "Filter: #ai ×" chip and its count

#### Scenario: Clear the filter

- **GIVEN** the feed is filtered by `#ai`
- **WHEN** the member clicks the chip's × or `#ai` again
- **THEN** the full feed returns

#### Scenario: Tag in the detail modal

- **GIVEN** a story's detail modal is open on Home
- **WHEN** the member clicks one of its tags
- **THEN** the modal closes and the feed is filtered by that tag

#### Scenario: No match

- **GIVEN** the feed is filtered by `#ai` and a search has no match
- **WHEN** the feed renders
- **THEN** it says "No updates match “q” in #ai."

#### Scenario: Tags stack on the new Home

- **GIVEN** the Home v2 flag is on, and stories tagged `ai` and `ai`+`robotics`
- **WHEN** a member clicks `#ai` and then `#robotics`
- **THEN** only the story tagged with both shows
- **AND** the scope row shows two chips, the count 1 and "Clear all"

#### Scenario: Hashtag search

- **GIVEN** the Home v2 flag is on
- **WHEN** a member searches `#ai`
- **THEN** stories tagged `ai` match

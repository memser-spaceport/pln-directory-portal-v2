## Why

AI Search answers only from directory data, and directory data for teams, members and projects is often thin. The backend now adds web facts to a thin answer and marks each web page as a `web` source. Members must see which sources come from the directory and which come from the web. Ticket: [LAB-2621](https://linear.app/protocollabs/issue/LAB-2621/ai-search-fill-thin-answers-with-labeled-web-sources).

## What Changes

- The sources list of an answer shows two labeled groups, "Directory" and "Web", on the AI Search page and in the header search dialog. An answer with one kind of source shows only that group.
- A web source opens its page in a new tab.
- New PostHog events: `unified-search-ai-web-sources-shown` and `unified-search-ai-web-source-clicked`.

Out of scope: Ask AI on profiles (LAB-2703), a redesign of the answer layout, and changes to the old `husky_*` events.

## Capabilities

### New Capabilities

### Modified Capabilities

- `ai-search`: the answer sources list groups directory and web sources.

## Impact

- The `/ai-search` page: the sources popup of each answer.
- The header search dialog: the sources popup of each AI answer.

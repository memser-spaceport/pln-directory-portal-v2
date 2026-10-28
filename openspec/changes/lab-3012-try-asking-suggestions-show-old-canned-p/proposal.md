# Proposal

## Why

LAB-3012 (https://linear.app/protocollabs/issue/LAB-3012): the "Try asking" block on the AI Search new-chat page shows an old, fixed list of canned questions. They do not relate to what members see in the Directory now. The block must show prompts from the top news stories, so the suggestions stay current.

## What Changes

- The "Try asking" block shows up to 4 prompts built from the news feed: the Top Stories picks first, in editorial order, then the newest stories.
- Each prompt is a question about one story, with the team name and the story title.
- When the member picks a prompt, AI Search asks that question as a new search (the same path as a typed question, with the signed-out daily limit).
- When there is no news, or the news request fails, the block is hidden.

Out of scope: the canned discovery questions in the app search dialog and the older AI Search empty chat; a backend change; personalised prompts.

## Capabilities

### New Capabilities
- `ai-search`: the AI Search new-chat page and its "Try asking" prompts.

### Modified Capabilities

## Impact

- AI Search new-chat page (`/ai-search`): the "Try asking" block under the field.
- No API change: the page reads the existing news feed endpoint.

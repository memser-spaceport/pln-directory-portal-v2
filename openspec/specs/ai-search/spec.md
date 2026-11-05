# ai-search Specification

## Purpose
The AI Search new-chat page, where a member starts a chat, and the prompts it suggests.

## Requirements

### Requirement: Try asking prompts come from the top news stories
The AI Search new-chat page SHALL show a "Try asking" block with up to 4 prompts built from the 20 newest stories in the news feed. The Top Stories picks among them SHALL come first, in editorial order, then the newest stories; a Top Stories pick older than those 20 is not offered. Each story SHALL appear once, as a question that names its team and its title. The prompts SHALL follow the news feed when the top news changes.

#### Scenario: Top stories become prompts
- **GIVEN** the news feed has Top Stories picks and other stories
- **WHEN** a member opens the AI Search new-chat page
- **THEN** the "Try asking" block shows up to 4 prompts
- **AND** the Top Stories picks come first, in editorial order, then the newest stories

#### Scenario: Prompt text names the story
- **GIVEN** a story "Saturn Grid ships v2" from the team Saturn Grid
- **WHEN** the block shows a prompt for it
- **THEN** the prompt reads `What is the news from Saturn Grid: "Saturn Grid ships v2"?`

### Requirement: A picked prompt starts an AI Search query
When a member picks a "Try asking" prompt, AI Search SHALL ask that prompt as a new question, the same as a typed question. At the signed-out daily limit, the page SHALL refuse the prompt and show the limit notice.

#### Scenario: Member picks a prompt
- **GIVEN** the "Try asking" block shows a prompt about a news story
- **WHEN** the member selects the prompt
- **THEN** AI Search starts a query with the prompt text

#### Scenario: Signed-out visitor at the daily limit
- **GIVEN** a signed-out visitor at the daily chat limit
- **WHEN** the visitor selects a prompt
- **THEN** no query starts
- **AND** the limit notice shows

### Requirement: No news hides the block
When the news feed has no stories, or the news request fails, the AI Search new-chat page SHALL hide the "Try asking" block and keep the headline, the scope line and the field.

#### Scenario: No news
- **GIVEN** the news feed returns no stories, or the request fails
- **WHEN** a member opens the AI Search new-chat page
- **THEN** the "Try asking" block is not shown
- **AND** the field is still shown

### Requirement: Answer sources show directory and web sources in labeled groups
The sources list of an AI Search answer SHALL show directory sources under a "Directory" label and web sources under a "Web" label, on the AI Search page and in the header search dialog. A source is a web source when it has no directory page and its type is `web` or `external`. A list with one kind of source SHALL show only that group. Each source SHALL open its page in a new tab. An older answer with plain source URLs and no source refs SHALL show its sources without group labels.

#### Scenario: An answer with both kinds of source
- **GIVEN** an answer with a team source and a web source
- **WHEN** the member opens the sources list
- **THEN** the list shows a "Directory" group with the team
- **AND** a "Web" group with the web page

#### Scenario: An answer from directory data only
- **GIVEN** an answer whose sources are all directory pages
- **WHEN** the member opens the sources list
- **THEN** the list shows no "Web" group

#### Scenario: A web source opens in a new tab
- **WHEN** the member selects a web source
- **THEN** its page opens in a new tab

### Requirement: Web source use is measured
When an answer that streamed in the open view finishes with one or more web sources, the app SHALL send the PostHog event `unified-search-ai-web-sources-shown` once for that answer, with the counts `webSources` and `directorySources` and the `entryPoint`. When a member selects a web source, the app SHALL send `unified-search-ai-web-source-clicked` with the `link` and the `entryPoint`.

#### Scenario: An answer with web sources finishes
- **GIVEN** an answer that cites two web pages and one team
- **WHEN** the answer finishes
- **THEN** `unified-search-ai-web-sources-shown` is sent once with `webSources` 2 and `directorySources` 1

#### Scenario: A member selects a web source
- **WHEN** the member selects a web source on the AI Search page
- **THEN** `unified-search-ai-web-source-clicked` is sent with its link and the entry point `ai-search-page`

#### Scenario: A saved thread opens
- **GIVEN** a saved thread whose answers have web sources
- **WHEN** a member opens it
- **THEN** no `unified-search-ai-web-sources-shown` event is sent for those answers

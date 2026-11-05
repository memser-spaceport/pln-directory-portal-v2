## ADDED Requirements

### Requirement: Answer sources show directory and web sources in labeled groups
The sources list of an AI Search answer SHALL show directory sources under a "Directory" label and web sources under a "Web" label, on the AI Search page and in the header search dialog. A source is a web source when it has no directory page and its type is `web` or `external`. A list with one kind of source SHALL show only that group. Each source SHALL open its page in a new tab.

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
When a finished answer has one or more web sources, the app SHALL send the PostHog event `unified-search-ai-web-sources-shown` once for that answer, with the counts `webSources` and `directorySources` and the `entryPoint`. When a member selects a web source, the app SHALL send `unified-search-ai-web-source-clicked` with the `link` and the `entryPoint`.

#### Scenario: An answer with web sources finishes
- **GIVEN** an answer that cites two web pages and one team
- **WHEN** the answer finishes
- **THEN** `unified-search-ai-web-sources-shown` is sent once with `webSources` 2 and `directorySources` 1

#### Scenario: A member selects a web source
- **WHEN** the member selects a web source on the AI Search page
- **THEN** `unified-search-ai-web-source-clicked` is sent with its link and the entry point `ai-search-page`

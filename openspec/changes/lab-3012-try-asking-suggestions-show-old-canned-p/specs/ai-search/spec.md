## Purpose

The AI Search new-chat page, where a member starts a chat, and the prompts it suggests.

## ADDED Requirements

### Requirement: Try asking prompts come from the top news stories
The AI Search new-chat page SHALL show a "Try asking" block with up to 4 prompts built from the news feed. The Top Stories picks SHALL come first, in editorial order, then the newest stories. Each story SHALL appear once, as a question that names its team and its title. The prompts SHALL follow the news feed when the top news changes.

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

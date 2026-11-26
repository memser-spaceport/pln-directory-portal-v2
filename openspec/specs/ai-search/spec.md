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
When an answer that streamed in the open view finishes with one or more web sources, the app SHALL send the PostHog event `unified-search-ai-web-sources-shown` once for that answer, with the counts `webSources` and `directorySources` and the `entryPoint`. When a member selects a web source, the app SHALL send `unified-search-ai-web-source-clicked` with the `link` (without its query string or fragment) and the `entryPoint`.

#### Scenario: An answer with web sources finishes
- **GIVEN** an answer that cites two web pages and one team
- **WHEN** the answer finishes
- **THEN** `unified-search-ai-web-sources-shown` is sent once with `webSources` 2 and `directorySources` 1

#### Scenario: A member selects a web source
- **WHEN** the member selects a web source on the AI Search page
- **THEN** `unified-search-ai-web-source-clicked` is sent with its link and the entry point `ai-search-page`

#### Scenario: The web source click event sends no query string
- **GIVEN** a web source `https://news.example/seed?utm_source=x#top`
- **WHEN** the member selects it
- **THEN** `unified-search-ai-web-source-clicked` is sent with `link` `https://news.example/seed`

#### Scenario: A saved thread opens
- **GIVEN** a saved thread whose answers have web sources
- **WHEN** a member opens it
- **THEN** no `unified-search-ai-web-sources-shown` event is sent for those answers

### Requirement: A thread handed over by the agent asks its questions

LAB-3457: the agent no longer hands chats over this way; "AI agent chat" now opens the same thread (see `labos-agent`), and a member inside the gate opens `/ai-search/<threadId>` on the agent. The reader below stays for today's page until a cleanup removes it.

When the LabOS agent hands a chat over ("AI agent chat", see `labos-agent`), it saves the thread and leaves its questions in `localStorage['ai-search-pending-questions:<threadId>']` (`AI_SEARCH_PENDING_QUESTIONS_KEY_PREFIX`). On `/ai-search/<threadId>`, the member's own thread (`isOwnThread`) SHALL read the entry once and remove it (`takePendingQuestions`), then ask the questions one at a time on that thread: each one after the answer before it has finished or failed. It SHALL not create the thread or its title again. A broken entry SHALL ask nothing. Someone else's thread SHALL not read the entry. The questions go through the normal ask flow, so each answer is saved to the thread. Each one SHALL be sent with the submit type `agent-handoff` (the `ai-query-submitted` `submitType` and the AI response `mode`), not `user-input`, and SHALL not count toward the MCP search hint (`countAiSearch`), so AI search metrics keep the agent's questions apart from typed ones. A Stop SHALL drop the questions still waiting.

#### Scenario: Two questions from the agent
- **GIVEN** the entry for thread `t` holds 2 questions
- **WHEN** the member's own `/ai-search/t` opens
- **THEN** the first question is asked on thread `t`, and the second is asked once the first answer has finished

#### Scenario: Stop during the first answer
- **GIVEN** the entry for thread `t` holds 2 questions and the first answer is streaming
- **WHEN** the member presses Stop
- **THEN** the second question is not asked


### Requirement: AI agent chat runs on the agent for members inside the gate

LAB-3457 (prototype `prototypes/entries/ai-search-page`, develop a68f8a668). `/ai-search` SHALL show `AgentChat` to a signed-in member who passes the agent gate (`useLabosAgentAccessState()` is `on`), and today's page (`ChatContainer`) to everyone else: signed out (without asking the gate), outside the gate, or with `localStorage['labos-agent'] = 'off'`. While the gate has not answered for a signed-in member, the page SHALL show neither, so today's page never reads a handed-over question (`localStorage.input`) and sends it to AI search.

`AgentChat` SHALL send every message to C1 (`POST /v1/labos-agent/chat`) through `useLabosAgentChat` with its own store key (`ai-search:<threadId>`, `labosAgentPageChatKey`) and thread id, and SHALL never call `/v1/husky/chat/contextual-tools`. Each answer SHALL be the panel's `LabosAgentTurn` (steps and the "Worked for Ns · N steps" toggle, sources, follow-ups, action cards, intro draft cards, errors with Retry, Stopped) under the question, in the page's reading column. The composer SHALL be `AgentChatComposer`: the panel's composer logic (`useLabosAgentComposer`), picker (`LabosAgentMentionPicker`) and chips (`LabosAgentMentionChip`) in the page's `ChatComposer`, with the chips inside the field above the text (`leading`). The field SHALL hold at most 2000 characters, SHALL become Stop while an answer streams, and SHALL have the placeholder "Ask, request an intro, or type @". `@` SHALL open the picker as in the panel; Esc SHALL close it. A question in `localStorage.input` SHALL be sent once and removed.

The new chat SHALL keep the headline, SHALL say "Ask about the network, or make a request." under it, and SHALL show two columns, stacked on phones: "Try asking" (the first 3 news prompts) and "Make a request" (up to 3 of `labosAgentRequestPrompts`: an intro request when `useCanRequestIntro()`, a team update when the member leads a team, a profile update). A picked prompt SHALL send at once. The title bar's new chat (`new-chat` event) SHALL stop the open answer and start a new thread.

#### Scenario: A member inside the gate asks a question
- **GIVEN** a member inside the agent gate on `/ai-search`
- **WHEN** they send "Which teams work on decentralized storage?"
- **THEN** C1 gets the message with the page's thread id, the answer shows its steps, sources and follow-ups, and no request goes to `/v1/husky/chat/contextual-tools`

#### Scenario: A member outside the gate
- **GIVEN** a signed-in member for whom `GET /v1/labos-agent/access` is `{ enabled: false }`
- **WHEN** they open `/ai-search`
- **THEN** they see today's page with today's placeholder

### Requirement: A saved chat opens on the agent for members inside the gate

LAB-3457. On `/ai-search/<threadId>` a signed-in member inside the agent gate SHALL get `AgentChat` with that thread: it SHALL read the thread with T2 (`GET /v1/labos-agent/threads/:threadId`) and show its turns finished, old AI search turns as saved answers (content, sources, follow-ups and the directory results: T2 `actions` in `DirectoryResultCards`, "Results from the directory", under the answer, as AI search draws them today; no steps, no agent cards) and agent turns with their steps ("Worked · N steps", no duration) and cards. Finished cards (`done`, `cancelled`, `failed`, `expired`; drafts `sent`, `cancelled`) SHALL show their result with no buttons; open cards (a proposal `open` before `expiresAt`, a draft `open`) SHALL keep their buttons, and an open draft SHALL send with C5 in that thread. The title bar SHALL show the thread title. The next message SHALL go to C1 with the same `threadId`. A handed-over question (`localStorage.input`) SHALL stay for the new chat. A 404 `THREAD_NOT_FOUND` SHALL show the 404 page; another failure SHALL say "This chat could not be loaded." with "Try again". A chat already in the store from this page visit SHALL show as it is, with no T2 read.

Signed out, the route SHALL stay as today (the 404 page when AI search has no such thread). Signed in outside the gate, it SHALL show today's thread page, or the 404 page when AI search has no such thread. Nothing SHALL show for a signed-in member until the gate answers.

#### Scenario: An old AI search thread continues on the agent
- **GIVEN** a member inside the gate and an old AI search thread `t-1`
- **WHEN** they open `/ai-search/t-1` and press a follow-up
- **THEN** the saved answer shows, and C1 gets the follow-up with `threadId` `t-1` and `persist: true`

### Requirement: The History rail is the shared history for members inside the gate

LAB-3457. For a signed-in member inside the agent gate, the History rail SHALL list T1 (`GET /v1/labos-agent/threads`): old AI search chats and agent chats in one list, newest first, 20 rows a page, with "Load more chats" while rows are left (a row that moved to a later page shows once). It SHALL not read `/v1/husky/threads`. Search and the date groups SHALL work on the loaded rows, as today. Delete SHALL go to T3 (`DELETE /v1/labos-agent/threads/:threadId`): the row leaves at once (also on 404), the list reads its pages again, the open chat leaves for a new chat, and a failure keeps the row with the failure toast. A chat on `/ai-search` (no id in the URL) SHALL announce its saved thread (`refresh-husky-history` with `openThreadId`), so its row is marked open, and its title bar SHALL offer Delete once the chat is saved. While the gate has not answered, the rail SHALL show its skeleton and read neither list. Signed out and outside the gate, the rail SHALL stay as today.

#### Scenario: Old and new chats in one rail
- **GIVEN** a member inside the gate with an old AI search chat and an agent chat
- **WHEN** they open `/ai-search`
- **THEN** History lists both, and opening the old one shows it on the agent

### Requirement: Thread pages are not indexed

LAB-3457. `/ai-search/<threadId>` SHALL send `robots: { index: false, follow: false }`: it is a member's own chat or a guest's shared link. Its title and share image SHALL stay the layout's ("AI Search | Protocol Labs Directory"; renaming to "AI agent chat" is a design question for Polina). `/ai-search` itself SHALL stay indexable.

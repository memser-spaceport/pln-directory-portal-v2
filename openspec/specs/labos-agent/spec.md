# labos-agent Specification

## Purpose

The LabOS agent (LAB-3272) is an in-app chat for signed-in members. It reads the page it was opened on and answers with LabOS news and web search. Slice S1 (LAB-3298) adds the panel, the one "open with context" call and "Ask a follow-up" on a news story. S1 has no writes. Slice S2 (LAB-3299) adds action cards: the agent proposes an edit, and only the member's Confirm saves it. The API is contracts C1 (`POST /v1/labos-agent/chat`) and C2 (`POST /v1/labos-agent/actions/confirm`) in `contracts/lab-3272-labos-agent-api.md` (LabOS Team project files).

## Requirements

### Requirement: Only a member inside the gate sees the agent

The agent and every control that opens it SHALL show only when three checks pass: the local feature gate is on, the visitor is a signed-in member, and `GET /v1/labos-agent/access` returns `{ "enabled": true }`. The local gate SHALL be off by default until decision D1 (who sees the agent). `localStorage['labos-agent'] = 'on'` SHALL turn the local gate on in that browser. A visitor who fails a check SHALL see no control (absent, not disabled). The server render and the first client render SHALL show no agent.

#### Scenario: Gate off

- **GIVEN** a signed-in member and the local gate off
- **WHEN** they open a news story
- **THEN** the story shows no "Ask a follow-up"

#### Scenario: Signed-out visitor

- **GIVEN** a signed-out visitor and the local gate on
- **WHEN** they open a news story
- **THEN** the story shows no "Ask a follow-up"

#### Scenario: Member outside the backend gate

- **GIVEN** the local gate on
- **WHEN** the access check returns `{ "enabled": false }` or fails
- **THEN** the member sees no agent control

### Requirement: One call opens the agent with a context

The app SHALL open the agent only through `openAgent({ context })` (`useOpenAgent()`). `context` is `{ page: 'news-story', newsUid, label? }`, `{ page: 'home', label? }` or absent. `label` SHALL show in the context chip above the composer and SHALL never go to the API. For a news story, the chip SHALL link to `/?news=<uid>`. The store SHALL keep one chat (`threadId` and turns) per context (`chatKey`) for the page visit, so closing the panel SHALL not lose the chat. Opening from the same context SHALL restore its chat. A different context SHALL show its own chat, new if it has none. New chat SHALL start a new thread for the current context. Slices S2 to S5 SHALL reuse this call.

#### Scenario: Same story again

- **GIVEN** a member closed the agent after a chat about story A
- **WHEN** they open the agent from story A again
- **THEN** the panel shows the same chat with its turns

#### Scenario: Another story

- **WHEN** the member opens the agent from story B
- **THEN** the panel starts a new chat with story B as context

### Requirement: Ask a follow-up on a news story

The news story detail SHALL show "Ask a follow-up" at the start of its footer for a member inside the gate. A press SHALL open the agent with `{ page: 'news-story', newsUid: <story uid>, label: <story title> }` and close the story, so the panel is the only layer.

#### Scenario: Member asks about a story

- **GIVEN** a member inside the gate on a story's detail
- **WHEN** they press "Ask a follow-up" and pick "Summarize this story"
- **THEN** the story closes, the panel opens with the story title as context, and the chat request carries `context: { page: 'news-story', newsUid }`

### Requirement: The panel streams an answer with steps and sources

The panel SHALL be a right-hand column (480px from 960px wide, a full-screen sheet below) with Agent, New chat and Close in its header. With no turns it SHALL show prompts for the context. Each turn SHALL show the member's message, then the agent's steps while it works, then the streamed Markdown answer. A finished answer SHALL list its LabOS items (a news item links to `/?news=<uid>`) and its web pages under "Sources", and its follow-up questions as buttons. The composer SHALL send on Enter, accept up to 2000 characters, and turn into Stop while an answer streams. Esc inside the panel SHALL close it.

#### Scenario: Answer with web sources

- **WHEN** the answer used web search
- **THEN** the turn lists each web page by its domain under "Sources", and each opens in a new tab

### Requirement: A failed or stalled answer offers Retry

When the request fails before the stream starts, or the connection breaks, the turn SHALL show a plain message for the error code (`AGENT_NOT_ENABLED`, `NEWS_NOT_FOUND`, `RATE_LIMITED` with `retryAfterSeconds`, 401, other) and a Retry button. When the answer ends with the backend's stalled notice, the turn SHALL show Retry and no follow-ups. Retry SHALL send the same message again in place of the failed turn.

#### Scenario: Hard error, then Retry

- **GIVEN** the connection breaks while the agent answers
- **WHEN** the member presses Retry
- **THEN** the agent sends the same message again and the error message goes away

### Requirement: Each proposed edit shows an action card

A finished answer SHALL show one action card for each proposal in the C1 `proposals` list (profile fields, experience add or change, team edit). A card SHALL show the proposal title and, for each change, the label and the old and new values. An empty value SHALL read "Empty". The card SHALL show Confirm and Cancel. Nothing SHALL save before Confirm (D2). Confirm and Cancel SHALL call C2 with only `proposalId` and `decision`. While C2 runs, the buttons SHALL be disabled, so a double press sends one request. A card SHALL be used once: after done, cancelled, a 403 or a final error, it SHALL have no buttons. Card state SHALL live with its turn in the store, so it SHALL survive close and reopen from the same context. The client SHALL drop a proposal that has no id, an unknown tool or no changes.

#### Scenario: Confirm saves the edit

- **GIVEN** an answer with a proposal to change the bio
- **WHEN** the member presses Confirm
- **THEN** the card shows Saving, C2 gets `{ proposalId, decision: 'confirm' }`, and the card shows the C2 `summary` with no buttons

#### Scenario: Cancel

- **WHEN** the member presses Cancel
- **THEN** C2 gets `decision: 'cancel'` and the card shows "Cancelled. Nothing was saved." with no buttons
- **AND** a failed Cancel still closes the card, because the backend wrote nothing and the proposal expires

#### Scenario: Not allowed

- **WHEN** C2 answers 403
- **THEN** the card shows "You cannot make this change. Nothing was saved." with no buttons

#### Scenario: Error with Retry

- **WHEN** C2 gives no answer, a 401 or a server error
- **THEN** the card shows a message and Retry, and Retry sends Confirm again
- **AND** for 404, 409, 410 and 422 the card shows a message (with the 422 `message`) and no Retry

### Requirement: The API sits behind one client with a mock

All agent calls SHALL go through `getLabosAgentClient()`. The live client SHALL call C1, C2 and the access check with `customFetch` (the member's session). The live client SHALL be the default (`LABOS_AGENT_MOCK_BY_DEFAULT = false`). `localStorage['labos-agent-api'] = 'mock'` SHALL select the mock in one browser: scripted answers, no network and no member data. While the mock is on, the panel header SHALL show a "Mock answers" label. The mock SHALL break the connection for a message with "error", stall for "stall", and use web sources for "web". It SHALL propose a profile edit for "edit profile" and a team edit for "edit team". For "forbidden", it SHALL propose a team edit that gets a 403 on Confirm. For "save fails", the first Confirm SHALL get no answer. QA can test each path.

### Requirement: No agent tracking before S0 is approved

The agent SHALL send no analytics events until the S0 event spec on LAB-3272 is approved. Handlers in `analytics/labos-agent.analytics.ts` SHALL stay no-op stubs until then. No event SHALL carry message text, names or emails.

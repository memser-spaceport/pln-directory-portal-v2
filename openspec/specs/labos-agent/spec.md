# labos-agent Specification

## Purpose

The LabOS agent (LAB-3272) is an in-app chat for signed-in members. It reads the page it was opened on and answers with LabOS news and web search. Slice S1 (LAB-3298) adds the panel, the one "open with context" call and "Ask a follow-up" on a news story. S1 has no writes. The API is contract C1 (`POST /v1/labos-agent/chat`) in `contracts/lab-3272-labos-agent-api.md` (LabOS Team project files).

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

- **GIVEN** the local gate on and the live client
- **WHEN** the access check returns `{ "enabled": false }` or fails
- **THEN** the member sees no agent control

### Requirement: One call opens the agent with a context

The app SHALL open the agent only through `openAgent({ context })` (`useOpenAgent()`). `context` is `{ page: 'news-story', newsUid, label? }`, `{ page: 'home', label? }` or absent. `label` SHALL show in the context chip above the composer and SHALL never go to the API. The same context as the open chat SHALL keep that chat. A different context SHALL start a new chat. Slices S2 to S5 SHALL reuse this call.

#### Scenario: Same story again

- **GIVEN** a member closed the agent after a chat about story A
- **WHEN** they open the agent from story A again
- **THEN** the panel shows the same chat

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

### Requirement: The API sits behind one client with a mock

All agent calls SHALL go through `getLabosAgentClient()`. The live client SHALL call C1 and the access check with `customFetch` (the member's session). Until the C1 backend is live, the client SHALL be the mock: scripted answers, no network and no member data. `localStorage['labos-agent-api'] = 'live'` SHALL select the live client. The mock SHALL break the connection for a message with "error", stall for "stall", and use web sources for "web", so QA can test each path.

### Requirement: No agent tracking before S0 is approved

The agent SHALL send no analytics events until the S0 event spec on LAB-3272 is approved. Handlers in `analytics/labos-agent.analytics.ts` SHALL stay no-op stubs until then. No event SHALL carry message text, names or emails.

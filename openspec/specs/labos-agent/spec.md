# labos-agent Specification

## Purpose

The LabOS agent (LAB-3272) is an in-app chat for signed-in members. It reads the page it was opened on and answers with LabOS news and web search. Slice S1 (LAB-3298) adds the panel, the one "open with context" call and "Ask a follow-up" on a news story. S1 has no writes. Slice S2 (LAB-3299) adds action cards: the agent proposes an edit, and only the member's Confirm saves it. Slice S3 (LAB-3300) adds intro drafts: the agent writes an intro request, and only the member's Send sends it, through the existing intro API (C3). Slice S5 (LAB-3302) adds the corner (Agent and Feedback tabs), Ctrl/⌘ J and a context chip that the member can remove. The API is contracts C1 (`POST /v1/labos-agent/chat`) and C2 (`POST /v1/labos-agent/actions/confirm`) in `contracts/lab-3272-labos-agent-api.md` (LabOS Team project files).

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

The app SHALL open the agent only through `openAgent({ context })` (`useOpenAgent()`). `context` is `{ page: 'news-story', newsUid, label? }`, `{ page: 'home', label? }`, `{ page: 'intro', introTarget, label?, entryPoint? }` (S3), `{ page: 'member', memberUid }`, `{ page: 'team', teamUid }`, `{ page: 'job', jobUid? }`, `{ page: 'profile' }` (S5, each with `label?`) or absent. `prefill` (optional) SHALL put a first message in the composer. `label` SHALL show in the context chip above the composer and SHALL never go to the API. For a news story, the chip SHALL link to `/?news=<uid>`. The store SHALL keep one chat (`threadId` and turns) per context (`chatKey`) for the page visit, so closing the panel SHALL not lose the chat. Opening from the same context SHALL restore its chat. A different context SHALL show its own chat, new if it has none. New chat SHALL start a new thread for the current context. Slices S2 to S5 SHALL reuse this call.

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

`decide` SHALL check the card state in the store before it calls C2. It SHALL run only from `pending` or a retryable `error`. Two calls in the same tick SHALL send one request. A call after `done`, `cancelled`, `forbidden` or a final error SHALL do nothing.

The HTML fields (`bio` of `update_my_profile`, `longDescription` of `update_team`, `description` of `add_experience` and `update_experience`) SHALL show as plain text (`htmlToPlainText` in `utils/html`), cut at 300 characters with "…". The card SHALL never render a value as HTML.

After `expiresAt`, a pending card SHALL show no buttons and SHALL show "This change expired. Nothing was saved. Ask the agent again." A timer SHALL close an open card at `expiresAt`.

Accessibility: the card SHALL be an `<article>` named by its title. Each card SHALL keep one `role="status"` region mounted from the first render. Only its text SHALL change (done, cancelled, forbidden, error, expired). When a decision ends, focus SHALL move to that region.

#### Scenario: Confirm saves the edit

- **GIVEN** an answer with a proposal to change the bio
- **WHEN** the member presses Confirm
- **THEN** the card shows Saving, C2 gets `{ proposalId, decision: 'confirm' }`, and the card shows the C2 `summary` with no buttons

#### Scenario: Cancel

- **WHEN** the member presses Cancel
- **THEN** C2 gets `decision: 'cancel'` and the card shows "Cancelled. Nothing was saved." with no buttons
- **AND** a failed Cancel still closes the card, because the backend wrote nothing and the proposal expires

#### Scenario: Not allowed

- **WHEN** C2 answers 403 `ACTION_NOT_ALLOWED` (for example, the member's caps changed or the backend cannot read them)
- **THEN** the card shows "You cannot make this change. Nothing was saved." with no buttons

#### Scenario: Error with Retry

- **WHEN** C2 gives no answer, a 401 or a server error
- **THEN** the card shows a message and Retry, and Retry sends Confirm again
- **AND** for 404, 410 and 422 the card shows a message (with the 422 `message`) and no Retry

#### Scenario: The proposal is already closed (409)

- **WHEN** C2 answers 409 `PROPOSAL_CLOSED`
- **THEN** the card reads the stored `status` from the body
- **AND** `done` shows the done state with "This change is already saved."
- **AND** `cancelled` shows "Cancelled. Nothing was saved."
- **AND** `failed` shows "The change did not go through." with no Retry
- **AND** no `status`, `pending` or an unknown value shows "This change may already be saved. Check your profile." with no Retry

#### Scenario: The proposal expired

- **GIVEN** a pending card
- **WHEN** `expiresAt` passes
- **THEN** Confirm and Cancel go away and the card says that the change expired

### Requirement: Eligible members can ask the agent for an intro draft

Next to "Request an intro" (`RequestIntroEntry`), the page SHALL show "Ask the agent" only when `useCanRequestIntro()` is true and the member passes the agent gate (`useLabosAgentAccess()`) (S3-R10). A press SHALL call `openAgent({ context, prefill })` with `context` `{ page: 'intro', introTarget: { type, uid }, label: 'Intro to <name>', entryPoint }`. `type` SHALL be lower case (`member` or `team`). The composer SHALL hold the first message "Help me write an intro request to <name>." The member SHALL be able to change it before they send. The C1 `context` SHALL be `{ page: 'intro', introTarget: { type, uid } }` only. `label` and `entryPoint` SHALL never go to the API. The store SHALL keep one chat for each intro target (`chatKey` `intro:<type>:<uid>`). A C1 404 `INTRO_TARGET_NOT_FOUND` SHALL show "The agent cannot find this member or team." with Retry and no card.

#### Scenario: Eligible member inside the gate

- **GIVEN** a member who can request intros and passes the agent gate
- **WHEN** they open a member page
- **THEN** "Ask the agent" shows next to "Request an intro"
- **AND** a press opens the agent with "Help me write an intro request to <name>." in the composer

#### Scenario: Other members

- **WHEN** the member cannot request intros, or the agent gate is closed for them
- **THEN** the page shows no "Ask the agent"

### Requirement: Each intro draft shows a draft card

A finished answer SHALL show one draft card for each item in the C1 `drafts` list. The client SHALL keep only whole drafts with `kind` `intro`, a `draftId`, a target with `type`, `uid` and `name`, and `text`. It SHALL not allow `minLength` below 20 or `maxLength` above 3500. A card SHALL show "Intro request to <name>" and the text in an edit field (S3-R11). Send SHALL be off below `minLength` (trimmed). The field SHALL stop at `maxLength`. Send SHALL call `createIntroRequest` with exactly `{ type: 'MEMBER' | 'TEAM', targetId, text }` (S3-R12). The body SHALL carry no `source` and no `draftId`. One press SHALL send one request. Send SHALL be off while the request runs and SHALL be gone after a 200 (S3-R13). `sendDraft` SHALL check the card state in the store, so two calls in one tick send one request. Cancel SHALL close the card and send no request (S3-R14). Draft card state, with the edited text, SHALL live with its turn in the store. After a 200, every "Request an intro" for the target SHALL show "Intro requested".

The card SHALL show the C3 errors and keep the edited text (S3-R15):

| C3 answer        | Card                                                                               |
| ---------------- | ---------------------------------------------------------------------------------- |
| 200              | "Your request is received. Someone from the team will reach out." The card closes. |
| 401              | "Sign in again, then press Send. Your text is kept." Send stays.                   |
| 403              | The API `message`. Send is gone.                                                   |
| 404              | The API `message` (`Member not found` or `Team not found`). Send stays.            |
| 422              | "The request could not be sent. Try again." Send stays.                            |
| 429              | "Try again in a moment." Send stays.                                               |
| 5xx or no answer | "The request could not be sent. Try again." Send stays.                            |

A C1 answer with `drafts: []` (a refusal) SHALL show the answer and no card. Accessibility (as the S2 action card): the card SHALL be an `<article>` named by its title, with one `role="status"` region mounted from the first render. After a send ends or a Cancel, focus SHALL move to that region.

#### Scenario: Edit and send

- **GIVEN** an answer with an intro draft
- **WHEN** the member edits the text and presses Send
- **THEN** `POST /v1/intro-requests` gets `{ type, targetId, text }` with the trimmed edited text
- **AND** the card shows "Your request is received. Someone from the team will reach out." with no Send

#### Scenario: Send fails

- **WHEN** C3 answers 429
- **THEN** the card shows "Try again in a moment." and the field keeps the edited text

### Requirement: The corner and Ctrl/⌘ J open the agent on signed-in pages

For a member who passes the agent gate (`useLabosAgentAccess()`), `GlobalFeedback` SHALL show `LabosAgentCorner` in the place of the feedback button: one pill with an Agent tab and a Feedback tab (S5-R1). It SHALL show on the pages where the feedback button shows (signed in, not AI Apps, not bare routes). A member outside the gate, with the gate off, or signed out SHALL see the feedback button as before, or nothing when signed out. Until `GET /access` returns, `useLabosAgentAccessState()` SHALL be `'unknown'`, and the page SHALL show neither the corner nor the feedback button (no flash). An access error SHALL count as `'off'`. A member who hid the feedback button SHALL see the Agent tab only. The Agent tab and Ctrl/⌘ J SHALL call `openAgent({ context })` with the current page from `pageContextFromLocation` (S5-R3). Ctrl/⌘ J SHALL toggle the panel. It SHALL not match with Shift or Alt, on a held key, during IME input, in a text field outside the agent panel (an input, a textarea, a select or an element with a `contenteditable` attribute), or over a blocking dialog (`isBlockingDialogOpen()`). The feedback drawer is an exception. The key listener SHALL run only for a member with agent access, and `preventDefault` SHALL run only on a match. One slot: when the agent opens, the feedback drawer SHALL close, and when the drawer opens, the agent SHALL close. The corner SHALL step aside while either is open. Escape SHALL close the panel, and focus SHALL go back to the Agent tab (S5-R5). The panel SHALL listen for Escape on `window` in the capture phase, so Escape over the story closes the panel only.

#### Scenario: Pilot member on a member page

- **GIVEN** a member with agent access on `/members/<uid>`
- **WHEN** they press Ctrl J (Windows) or ⌘ J (Mac)
- **THEN** the agent opens with the chip "Member profile"

#### Scenario: Member outside the pilot

- **WHEN** the access check returns `{ "enabled": false }`
- **THEN** the page shows the feedback button and no Agent tab
- **AND** Ctrl J goes to the browser

#### Scenario: Ctrl J in a page text field

- **WHEN** the focus is in a text field on the page
- **THEN** Ctrl J does not open the agent

### Requirement: Each page type maps to one context

`pageContextFromLocation(pathname, search, currentUid)` SHALL map (S5-R6): `/?news=<uid>` to `news-story`; `/` to `home`; `/members/<uid>` to `member` (the member's own uid to `profile`); `/settings/profile` to `profile`; `/teams/<uid>` and its sub-pages to `team`; `/jobs/openings/<uid>` to `job` with the uid; `/jobs?job=<uid>` (the job drawer) to `job` with the uid; `/jobs` to `job` with no uid. A malformed URI part SHALL give no context and SHALL not throw. Other pages SHALL get no context and no chip. Labels SHALL be page types ("Member profile", "Team page", "Job post", "Jobs", "Your profile", "News story", "Home"), never names. `toChatContext` SHALL send each page with its id only (contract change 3, section 9.2; S5-C25 to S5-C27, S5-C30): `{ page: 'member', memberUid }`, `{ page: 'team', teamUid }`, `{ page: 'job', jobUid }`, `{ page: 'job' }` on `/jobs`, and `{ page: 'profile' }` with no id on `/settings/profile` and on the member's own `/members/<uid>`. `label` and `entryPoint` SHALL never go to the API.

#### Scenario: A team page goes to C1 with its id

- **GIVEN** a pilot member on `/teams/t-1`
- **WHEN** they open the agent and send a message
- **THEN** the C1 `context` is `{ page: 'team', teamUid: 't-1' }`

### Requirement: The agent cannot read the page

When C1 gives 404 `MEMBER_NOT_FOUND`, `TEAM_NOT_FOUND` or `JOB_NOT_FOUND` (contract 9.3), the turn SHALL show "The agent cannot read this page. Remove the page chip and ask again." (S5-C29). The turn SHALL keep the member's text. An empty composer SHALL get the text back once only (`textRestored` on the turn). The chat SHALL get `pageUnreadable`. When the member closes and opens the panel again, the composer SHALL stay empty, and the chip SHALL be off (`readsPage` false), so the next send has no `context`.

#### Scenario: Unknown team

- **GIVEN** a pilot member on a team page that C1 cannot find
- **WHEN** they send a message
- **THEN** the panel shows "The agent cannot read this page. Remove the page chip and ask again."
- **AND** the composer holds their text

### Requirement: The agent works over the news story

A dialog SHALL stop the corner and Ctrl/⌘ J, except a dialog that is a page to read (S5-R1, S5-R3). A page dialog SHALL mark itself with a hidden `data-labos-agent-passthrough` element (`services/labos-agent/labos-agent.dialogs.ts`). Only the news story modal (`NewsDetailModal`) has the marker. Any other dialog SHALL block, also a dialog inside the story. When the panel opens over the story, it SHALL show above the story (`.overModal`). The panel SHALL portal to `document.body`. From 960px, the corner SHALL show above the story, collapsed, with the Agent tab only. Below 960px, the corner SHALL stay under the full-screen story; Ctrl/⌘ J still works.

#### Scenario: Ctrl J over a story

- **GIVEN** a pilot member with a news story open
- **WHEN** they press Ctrl J
- **THEN** the agent opens above the story with the chip "News story"

#### Scenario: Ctrl J over a share dialog

- **WHEN** a dialog without the marker is open
- **THEN** Ctrl J does not open the agent

### Requirement: The key hint shows only with keys

The Agent tab SHALL show the key hint only on a device with a mouse or trackpad and a screen 640px or wider (`useShowsKeyHint`, `(any-pointer: fine) and (min-width: 640px)`). The hint SHALL be "⌘J" on a Mac and "Ctrl J" on other systems. `aria-keyshortcuts` SHALL stay on all devices.

### Requirement: The member can remove the page context

The context chip SHALL have a ✕ button "Stop reading <label>" (S5-R4). After ✕, the store SHALL set `readsPage` to false, the C1 request SHALL have no `context` field, and the empty state SHALL offer the network prompt only. "+ Read <label>" SHALL set `readsPage` back to true. Each `openAgent` SHALL set `readsPage` to true. The chat of the context SHALL stay.

#### Scenario: Remove the story chip

- **GIVEN** the agent opened on a news story
- **WHEN** the member presses ✕ on the chip and sends a message
- **THEN** the C1 body has no `context`

### Requirement: The mock gives intro drafts

For `context.page` `intro`, the mock C1 SHALL give one draft for the context target. For a message with "not eligible", it SHALL give `drafts: []` and a refusal. For a target uid that starts with `missing`, it SHALL give a 404 `INTRO_TARGET_NOT_FOUND`. S5: for the `member`, `team` and `job` pages, the answer SHALL name the page. For a `memberUid`, `teamUid` or `jobUid` that starts with `missing`, it SHALL give a 404 `MEMBER_NOT_FOUND`, `TEAM_NOT_FOUND` or `JOB_NOT_FOUND`. The mock replaces C1 only. Send on a draft card SHALL call the real C3.

### Requirement: The API sits behind one client with a mock

All agent calls SHALL go through `getLabosAgentClient()`. The live client SHALL call C1, C2 and the access check with `customFetch` (the member's session). The live client SHALL be the default (`LABOS_AGENT_MOCK_BY_DEFAULT = false`). `localStorage['labos-agent-api'] = 'mock'` SHALL select the mock in one browser: scripted answers, no network and no member data. While the mock is on, the panel header SHALL show a "Mock answers" label. The mock SHALL break the connection for a message with "error", stall for "stall", and use web sources for "web". It SHALL propose a profile edit for "edit profile" and a team edit for "edit team". For "forbidden", it SHALL propose a team edit that gets a 403 on Confirm. For "save fails", the first Confirm SHALL get no answer. A second C2 call on a closed proposal SHALL get a 409 `PROPOSAL_CLOSED` with the stored `status`. The mock `bio` SHALL be HTML, like the real field. QA can test each path.

### Requirement: No agent tracking before S0 is approved

The agent SHALL send no analytics events until the S0 event spec on LAB-3272 is approved. The S3 draft card is the exception: it sends the approved intro funnel events (LAB-3296) with `source` `agent` (see the `intro-requests` spec). Handlers in `analytics/labos-agent.analytics.ts` SHALL stay no-op stubs until then. No event SHALL carry message text, names or emails.

### Requirement: The member adds context with @ or the + button

`@` at the start of the input or after a space SHALL open the mention picker (S6-F1). The text after `@` up to a space SHALL be the query, up to 30 characters. A space, Esc or a deleted `@` SHALL close the `@` picker (S6-F2). The + button next to the input SHALL open the same picker with its own search field. Its tooltip SHALL be "Add a page, story, team or member (or type @)" (S6-F3). The hint line SHALL be "Mention a page, story, team or member" for an empty query (S6-F4) and "Matching "<query>"" while the member types (S6-F5). The picker SHALL show the groups in this order: Pages, News, Teams, Members. An empty group SHALL not show (S6-F6). The Pages group SHALL have Home, Jobs and Your profile, and the current page only after the member removed its chip (S6-F7). The picker SHALL hide the items that already have a chip (S6-F11). Up, Down, Enter and Tab SHALL move and pick. Esc SHALL close the picker first, then the panel (S6-F9).

#### Scenario: Type @ and pick a team

- **GIVEN** the agent panel is open
- **WHEN** the member types "Ask @mock" and picks the team "Mock Labs"
- **THEN** the message is "Ask @Mock Labs " and a chip "Mock Labs" shows

### Requirement: The picker searches with C4

The picker SHALL call C4 (`GET /v1/labos-agent/mentions`, `searchMentions`) 300 ms after the last key, and SHALL show only the response for the current query (S6-F8). A new key SHALL cancel the call in flight. A C4 400, 403, 429 or network error SHALL show "Search is not available. Try again." in the picker, and the input SHALL keep its text (S6-F16). The backend decides which groups come back (members need `member.search.read`, teams need `team.search.read`). The panel SHALL show what comes back. C4 has no query cache.

### Requirement: Mention chips go to C1 as `mentions`

An `@` pick SHALL put `@<name> ` in the message in the place of `@<query>` and add a chip. A + pick SHALL add a chip only (S6-F10). The ✕ on a mention chip SHALL remove the chip and keep the `@name` text (S6-F13). At 5 mention chips, the + button SHALL be off and the picker SHALL show "You can add up to 5 items." (S6-F12). C1 SHALL get a top-level `mentions` array next to `context`, in the order of the chips, with only `type` and `uid`, or `type` and `page` (`home`, `job` or `profile`). No `label` (S6-F14). A message with no chips SHALL send no `mentions` key. After a send, the mention chips SHALL clear and the page chip SHALL stay (S6-F15). On a C1 404 with `mentionIndex`, the panel SHALL mark that chip, show "The agent cannot read <label>. Remove it and ask again." and give back the chips and the message text once (S6-F17).

### Requirement: The placeholder and the no-context line

The placeholder SHALL be "Ask, request an intro, or type @ to add context" when `useCanRequestIntro()` is true (S6-F18), and "Ask, tell it what to do, or type @ to add context" for other members (S6-F19). When the first turn of a chat had no `context` and no `mentions`, the panel SHALL show the fixed line "I'm not reading any page right now. Add one with + or type @ to point me at a story, team or member." above the first answer, outside its `content` (S6-F20). The line SHALL not show when that turn failed.

### Requirement: The mock answers C4

The mock client SHALL answer C4 with mock pages, news, teams and members only, and accept `mentions` (S6-F21, S6-F22). The query "unavailable" SHALL give a 503. A mention uid that starts with `missing` SHALL give a C1 404 with `mentionIndex`. The answer SHALL list the mentions it read.

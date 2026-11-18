# Spec Delta

## ADDED Requirements

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

### Requirement: The mock gives intro drafts

For `context.page` `intro`, the mock C1 SHALL give one draft for the context target. For a message with "not eligible", it SHALL give `drafts: []` and a refusal. For a target uid that starts with `missing`, it SHALL give a 404 `INTRO_TARGET_NOT_FOUND`. The mock replaces C1 only. Send on a draft card SHALL call the real C3.

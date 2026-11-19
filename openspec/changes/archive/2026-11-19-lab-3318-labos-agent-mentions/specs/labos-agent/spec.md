# Spec Delta

## ADDED Requirements

### Requirement: The member adds context with @ or the + button

`@` at the start of the input or after a space SHALL open the mention picker (S6-F1). The text after `@` up to a space SHALL be the query, up to 30 characters. A space, Esc or a deleted `@` SHALL close the `@` picker (S6-F2). The + button next to the input SHALL open the same picker with its own search field. Its tooltip SHALL be "Add a page, story, team or member (or type @)" (S6-F3). The hint line SHALL be "Mention a page, story, team or member" for an empty query (S6-F4) and "Matching "<query>"" while the member types (S6-F5). The picker SHALL show the groups in this order: Pages, News, Teams, Members. An empty group SHALL not show (S6-F6). The Pages group SHALL have Home, Jobs and Your profile, and the current page only after the member removed its chip (S6-F7). The picker SHALL hide the items that already have a chip (S6-F11). Up, Down, Enter and Tab SHALL move and pick. Esc SHALL close the picker first, then the panel (S6-F9). After Esc, the same `@` SHALL not open the picker again; a new `@` SHALL open it. While C4 loads and the `@` picker has no row, Enter SHALL do nothing. In `@` mode the composer, and in + mode the search field, SHALL be an ARIA combobox with `aria-expanded`, `aria-controls` (the listbox) and `aria-activedescendant` (the active option id). The search notes SHALL be in a `role="status"` region. The chip row SHALL be a `group` named "What the agent reads".

#### Scenario: Type @ and pick a team

- **GIVEN** the agent panel is open
- **WHEN** the member types "Ask @mock" and picks the team "Mock Labs"
- **THEN** the message is "Ask @Mock Labs " and a chip "Mock Labs" shows

### Requirement: The picker searches with C4

The picker SHALL call C4 (`GET /v1/labos-agent/mentions`, `searchMentions`) 300 ms after the last key, and SHALL show only the response for the current query (S6-F8). A new key SHALL cancel the call in flight. A C4 400, 403, 429 or network error SHALL show "Search is not available. Try again." in the picker, and the input SHALL keep its text (S6-F16). The backend decides which groups come back (members need `member.search.read`, teams need `team.search.read`). The panel SHALL show what comes back. C4 has no query cache.

### Requirement: Mention chips go to C1 as `mentions`

An `@` pick SHALL put `@<name> ` in the message in the place of `@<query>` and add a chip. A + pick SHALL add a chip only (S6-F10). The ✕ on a mention chip SHALL remove the chip and keep the `@name` text (S6-F13). At 5 mention chips, the + button SHALL be off and the picker SHALL show "You can add up to 5 items." (S6-F12). C1 SHALL get a top-level `mentions` array next to `context`, in the order of the chips, with only `type` and `uid`, or `type` and `page` (`home`, `job` or `profile`). No `label` (S6-F14). A message with no chips SHALL send no `mentions` key. After a send, the mention chips SHALL clear and the page chip SHALL stay (S6-F15). On a C1 404 with `mentionIndex`, the panel SHALL mark that chip, show "The agent cannot read <label>. Remove it and ask again." and give back the chips and the message text once (S6-F17). A 404 with `mentionIndex` SHALL never mark the page unreadable, also when the index is outside the chips. Retry SHALL send the turn's mentions without the failed one.

### Requirement: The placeholder and the no-context line

The placeholder SHALL be "Ask, request an intro, or type @ to add context" when `useCanRequestIntro()` is true (S6-F18), and "Ask, tell it what to do, or type @ to add context" for other members (S6-F19). When the first turn of a chat had no `context` and no `mentions`, the panel SHALL show the fixed line "I'm not reading any page right now. Add one with + or type @ to point me at a story, team or member." above the first answer, outside its `content` (S6-F20). The line SHALL not show when that turn failed.

### Requirement: The mock answers C4

The mock client SHALL answer C4 with mock pages, news, teams and members only, and accept `mentions` (S6-F21, S6-F22). The query "unavailable" SHALL give a 503. A mention uid that starts with `missing` SHALL give a C1 404 with `mentionIndex`. The answer SHALL list the mentions it read.

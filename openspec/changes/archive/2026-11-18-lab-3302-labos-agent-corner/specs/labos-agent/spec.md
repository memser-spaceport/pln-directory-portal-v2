# Spec Delta

## ADDED Requirements

### Requirement: The corner and Ctrl/⌘ J open the agent on signed-in pages

For a member who passes the agent gate (`useLabosAgentAccess()`), `GlobalFeedback` SHALL show `LabosAgentCorner` in the place of the feedback button: one pill with an Agent tab and a Feedback tab (S5-R1). It SHALL show on the pages where the feedback button shows (signed in, not AI Apps, not bare routes). A member outside the gate, with the gate off, or signed out SHALL see the feedback button as before, or nothing when signed out. A member who hid the feedback button SHALL see the Agent tab only. The Agent tab and Ctrl/⌘ J SHALL call `openAgent({ context })` with the current page from `pageContextFromLocation` (S5-R3). Ctrl/⌘ J SHALL toggle the panel. It SHALL not match with Shift or Alt, on a held key, during IME input, in a text field outside the agent panel, or over another dialog (the feedback drawer is the exception). The key listener SHALL run only for a member with agent access, and `preventDefault` SHALL run only on a match. One slot: when the agent opens, the feedback drawer SHALL close, and when the drawer opens, the agent SHALL close. The corner SHALL step aside while either is open. Escape SHALL close the panel, and focus SHALL go back to the Agent tab (S5-R5).

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

`pageContextFromLocation(pathname, search, currentUid)` SHALL map (S5-R6): `/?news=<uid>` to `news-story`; `/` to `home`; `/members/<uid>` to `member` (the member's own uid to `profile`); `/settings/profile` to `profile`; `/teams/<uid>` and its sub-pages to `team`; `/jobs/openings/<uid>` to `job` with the uid; `/jobs` to `job` with no uid. Other pages SHALL get no context and no chip. Labels SHALL be page types ("Member profile", "Team page", "Job post", "Jobs", "Your profile", "News story", "Home"), never names. C1 has no value for `member`, `team`, `job` and `profile` yet. `toChatContext` SHALL send them as `{ page: 'home' }`, with no uid, until the contract adds values.

### Requirement: The member can remove the page context

The context chip SHALL have a ✕ button "Stop reading <label>" (S5-R4). After ✕, the store SHALL set `readsPage` to false, the C1 request SHALL have no `context` field, and the empty state SHALL offer the network prompt only. "+ Read <label>" SHALL set `readsPage` back to true. Each `openAgent` SHALL set `readsPage` to true. The chat of the context SHALL stay.

#### Scenario: Remove the story chip

- **GIVEN** the agent opened on a news story
- **WHEN** the member presses ✕ on the chip and sends a message
- **THEN** the C1 body has no `context`

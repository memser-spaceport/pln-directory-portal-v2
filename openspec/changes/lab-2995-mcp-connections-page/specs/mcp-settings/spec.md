## ADDED Requirements

### Requirement: MCP connections has its own Settings page
When `NEXT_PUBLIC_SHOW_MCP_CONNECTIONS_PAGE` is `true`, Settings SHALL have an "MCP connections" item in the Account group that opens `/settings/mcp`, shown only to members with `mcp.connect`. Email & Accounts SHALL then no longer show the MCP section. With the flag off, `/settings/mcp` SHALL return not found and Email & Accounts SHALL keep its MCP section. A signed-out visitor SHALL be sent to login and returned to `/settings/mcp` with its query string intact.

#### Scenario: Flag on
- **WHEN** a member with `mcp.connect` opens Settings
- **THEN** the Account group lists "MCP connections", and Email & Accounts has no MCP section

#### Scenario: No permission
- **WHEN** a member without `mcp.connect` opens `/settings/mcp`
- **THEN** the page shows no connections or guide, only a short note that MCP isn't available for their account

#### Scenario: Signed out with a request link
- **WHEN** a signed-out visitor opens `/settings/mcp?request=abc`
- **THEN** after login they land on `/settings/mcp?request=abc`

### Requirement: The page shows how to connect until something is connected
With no active connections, the page SHALL show the connect guide (Claude app steps first, then the developer commands, each with a copy button) and no permissions. Once at least one connection exists, the guide SHALL be collapsed behind "Add a connection".

#### Scenario: No connections
- **WHEN** the member has no active connections
- **THEN** the guide is expanded and no card or permission control shows

### Requirement: Each connection is a card with status and permissions
Each active connection SHALL render as one card: client name, a status badge from the server's `status` (Active, Idle, Not used yet, Sign-in expired with "Reconnect from the client to use it again"), connected and last-used dates, chips for each scope above `none` (as `key:level`, highest level only, priority order; the first four, then "+N more"), an "Edit permissions" link, and a ⋯ menu with Revoke. Revoke SHALL ask for an inline confirm, and the card SHALL leave the list after a successful revoke.

#### Scenario: Two connections of the same client
- **WHEN** a member has two Claude.ai connections
- **THEN** two cards show, each with its own status, dates and chips

#### Scenario: Revoke fails
- **WHEN** the revoke request fails
- **THEN** the card stays and an error toast shows

### Requirement: The permissions drawer edits one connection with one Save
"Edit permissions" or "+N more" SHALL open a drawer for that connection: the template row (Read only, Read and write, Custom), then one row per scope from the server, in the server's order, with No access / Read / Read and write. Options above the scope's `maxLevel` SHALL be visible and disabled. A scope with `lock: 'admin'` SHALL say "Turned off by LabOS admins". "Read and write" SHALL set every row to its `maxLevel`. Changes SHALL be a draft until Save. Save SHALL be disabled until something changes, SHALL send all levels in one request, and SHALL close the drawer and update the card on success. On failure the drawer SHALL stay open with the draft and show an error. Cancel SHALL discard the draft.

#### Scenario: Admin-locked write
- **WHEN** a scope has `maxLevel: 'read'` and `lock: 'admin'`
- **THEN** its "Read and write" option is disabled and the row says "Turned off by LabOS admins"

#### Scenario: Save changes only this connection
- **WHEN** the member sets Forum to Read and write on connection A and saves
- **THEN** connection A's card shows `forum:write`, and connection B is unchanged

#### Scenario: Server refuses the save
- **WHEN** the save returns an error
- **THEN** the drawer stays open with the draft, and an error message shows

### Requirement: An access request link opens the drawer preset
`/settings/mcp?request=<id>` SHALL load the request. If it is `open` and belongs to one of the member's active connections, the page SHALL open that connection's drawer with a note ("<client> asked for <level> access to <scope>" and the tool it tried) and the scope preset to the requested level (capped at `maxLevel`). Saving SHALL send the request id. Otherwise (`resolved`, `expired`, not found, or a connection no longer active), the page SHALL show a short note that the request is no longer open, with no preset.

#### Scenario: Open request
- **WHEN** a member opens a link for Codex asking for Forum write
- **THEN** Codex's drawer opens with the note and Forum preset to Read and write, and Save is enabled

#### Scenario: Expired request
- **WHEN** the request is older than 7 days
- **THEN** the page opens with a note that the request has expired and no drawer

### Requirement: The page has loading and error states
The connection list SHALL show a loading state while it fetches, and an error state with Retry if the fetch fails.

#### Scenario: List fails
- **WHEN** `GET /v1/mcp/authorizations` fails
- **THEN** the page shows an error with a Retry button and no cards

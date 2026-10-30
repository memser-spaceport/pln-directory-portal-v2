# mcp-settings Specification

## Purpose

Settings → MCP connections is where a member sees each AI agent connected to LabOS over MCP, changes what each connection may do per feature, answers an agent's access request, and revokes a connection.

## Requirements

### Requirement: MCP connections has its own Settings page

When `NEXT_PUBLIC_SHOW_MCP_CONNECTIONS_PAGE` is `true`, Settings SHALL have an "MCP connections" item in the Account group that opens `/settings/mcp`, shown only to members with `mcp.connect`. The item SHALL carry a "New" badge until the member first opens the page. Email & Accounts SHALL then no longer show the MCP section. With the flag off, `/settings/mcp` SHALL return not found and Email & Accounts SHALL keep its MCP section. A signed-out visitor SHALL be sent to login and returned to `/settings/mcp` with its query string intact.

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

With no active connections, the page SHALL show the connect block from the LAB-2948 prototype and no permissions: Claude app steps first (with "Open Claude connectors" and the server URL to copy), then "For developers" with the server URL and setup steps per client (Claude Code, Codex, Others), each command with a copy button. Once at least one connection exists, the block SHALL be collapsed behind "Add another connection" and SHALL have a close button when opened.

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

"Edit permissions" or "+N more" SHALL open a drawer for that connection: the template row (Read only, Read and write, Custom), then one row per scope from the server, in the server's order, with No access / Read / Read and write. Options above the scope's `maxLevel` SHALL be visible and disabled. A scope with `lock: 'admin'` SHALL say "Turned off by LabOS admins". "Read and write" SHALL set every row to its `maxLevel`. Changes SHALL be a draft until Save. Save SHALL be disabled until something changes, SHALL send all levels in one request, and SHALL close the drawer and update the card on success. On failure the drawer SHALL stay open with the draft and show an error. Cancel SHALL discard the draft. A row whose scope offers write SHALL add its write text ("With write: …"); Search has no write level and SHALL offer only No access / Read.

#### Scenario: Admin-locked write

- **WHEN** a scope has `maxLevel: 'read'` and `lock: 'admin'`
- **THEN** its "Read and write" option is disabled and the row says "Turned off by LabOS admins"

#### Scenario: Write text for directory and events

- **WHEN** the server allows write on Events and on Members, teams and projects
- **THEN** their rows say "With write: RSVP for you." and "With write: edit the teams you lead and your teams' projects."

#### Scenario: Write text for Your profile

- **WHEN** the server allows write on Your profile
- **THEN** its row says "Read your profile, job alert and email preferences." and "With write: edit your profile and experience, join or leave teams and projects, follow teams, save jobs and Demo Day teams, and change your job alert and email preferences."

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

### Requirement: Consent starts read only

The LabOS consent page for an MCP client SHALL offer no choice of write access: every new connection starts read only. It SHALL show "Connect {client} to LabOS", a "Read only (default)" section saying what the client can view, and a notice that this includes other members' contact details (email, Telegram, LinkedIn) with the checkbox "I understand {client} can see other members' contact details." Connect SHALL stay disabled until that checkbox is ticked and while the approval is in flight. Approving SHALL send `acknowledgedContactDetails: true` and no `allowChanges`. Cancel SHALL deny as before.

#### Scenario: Connect waits for the acknowledgement

- **WHEN** a member opens the consent page for a registered client
- **THEN** Connect is disabled until the member ticks the contact-details checkbox

#### Scenario: Approval is read only

- **WHEN** the member ticks the checkbox and clicks Connect
- **THEN** the approve request carries `acknowledgedContactDetails: true` and no `allowChanges`, and the client is redirected with its code

#### Scenario: Cancel denies

- **WHEN** the member clicks Cancel
- **THEN** the client is sent back with `error=access_denied`, as before

### Requirement: A launch bar announces MCP to members who can connect

While the MCP connections page is on, a member with `mcp.connect` (directory admins and PL infra) and no MCP connection SHALL see a bar at the top of every page, in `SiteHeader` above the navbar: a "New" pill (hidden on phones), "Search teams and members, post news or reply in the forum right from your AI session. LabOS now works with AI agents.", a "Set up now" button that opens `/settings/mcp`, and a close button. The bar SHALL NOT show to members without `mcp.connect`, before the connections have loaded, once any connection exists, once the member has opened MCP connections, or once the member has closed it. Closing SHALL be remembered per member across devices. The bar SHALL emit PostHog `mcp-hint-shown` (once per mount), `mcp-hint-dismissed` and `mcp-hint-connect-clicked` with `context: 'launch_bar'`.

#### Scenario: Member without MCP access

- **WHEN** a member without `mcp.connect` opens any page
- **THEN** no launch bar shows and the member's MCP connections are not requested

#### Scenario: Set up now

- **WHEN** an eligible member clicks "Set up now"
- **THEN** `/settings/mcp` opens, and the bar does not come back after that page has been opened

### Requirement: Contextual MCP hints suggest the agent where the member just did its work

To the same audience as the launch bar (the MCP connections page on, `mcp.connect`, connections loaded), LabOS SHALL show a hint card right after the member did something an agent could do for them: on AI Search under the latest answer, in the message list above the follow-up field (not inside the pinned composer, which would cover the answer), from the second question sent in the browser session, quoting the latest question; on Forum → Create Post (not the edit form, not the reply box) between the Title field and the post editor once the title is not empty; and on AI Apps → Feedback, Received tab, under the tabs row when 3 or more received feedback items have status NEW (counted before filters). With no connection the card SHALL show the Claude and Codex marks, a title and line naming what connecting gives ("Ask this from Claude or Codex next time", "Let your agent draft this post", "Triage these <N> new comments from your agent"), and a "Connect an agent" link that opens `/settings/mcp`. With a connection it SHALL show only that client's mark, "Ask <client> instead", and the same request as a prompt with a copy button. A ✕ SHALL dismiss the hint for its context only, remembered per member across devices (`mcp_hint_search`, `mcp_hint_forum`, `mcp_hint_comments`). Each hint SHALL emit PostHog `mcp-hint-shown` (once per mount, with `connected`), `mcp-hint-dismissed`, `mcp-hint-connect-clicked` and `mcp-hint-prompt-copied` (with `clientName`), with `context` `search`, `forum` or `comments`.

#### Scenario: Second search with no agent

- **WHEN** an eligible member with no MCP connection sends a second AI Search question, "Open roles at Prime Intellect", in the same browser session
- **THEN** under the answer, above the follow-up field, a hint reads "Connect LabOS to your agent and search “Open roles at Prime Intellect” where you already work." with "Connect an agent"

#### Scenario: Agent connected on a new post

- **WHEN** a member with Claude Code connected types a title on Forum → Create Post
- **THEN** between the title and the editor a hint reads "Ask Claude Code instead" with the prompt `Draft a LabOS forum post titled “<title>”` and a copy button

#### Scenario: Dismissed in one place only

- **WHEN** a member dismisses the AI Search hint
- **THEN** it does not come back on AI Search, and the Forum and Feedback hints still show when their triggers hold

# mcp-settings Specification

## Purpose

Settings → MCP connections is where a member sees each AI agent connected to LabOS over MCP, changes what each connection may do per feature, answers an agent's access request, and revokes a connection. With the page off, the MCP section in Email & Accounts does this job in a smaller form (LAB-2993).

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

With no active connections, the page SHALL show the connect block (design LAB-3054) and no permissions: one tab bar with a tab per client in this order, Claude app (selected first), Claude Code, Codex, Others, and only the selected client's steps. The Claude app tab SHALL have "Open Claude connectors", the server URL to copy and the workspace-admin note; Claude Code and Codex SHALL show their terminal commands; Others SHALL show the server URL to copy and generic steps. Every copy button SHALL send `mcp-setup-snippet-copied` with its tab's snippet type (`claude-app`, `claude`, `codex`, `server`). There is no "For developers" group. On narrow screens the tab bar SHALL scroll sideways inside its own box. Once at least one connection exists, the block SHALL be collapsed behind "Add another connection" and SHALL have a close button when opened.

#### Scenario: No connections

- **WHEN** the member has no active connections
- **THEN** the guide is expanded and no card or permission control shows

#### Scenario: Switching to a terminal client

- **WHEN** the member selects the Codex tab
- **THEN** the Codex commands show with a copy button, and the Claude app steps hide

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

`/settings/mcp?connection=<uid>&scope=<key>` (the AI Apps page hint's "Allow changes", LAB-3136) SHALL open that connection's drawer with the scope preset to write when its `maxLevel` allows write, else with no preset. Nothing SHALL be saved until the member presses Save. An unknown connection SHALL open no drawer. `?request=` wins when both are present.

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

While the MCP connections page is on, a member with `mcp.connect` (directory admins and PL infra) and no MCP connection SHALL see a bar at the top of every page, in `SiteHeader` above the navbar: a "New" pill (hidden on phones), "Search teams and members, post news or team updates right from your AI session. LabOS now works with AI agents.", a "Set up now" button that opens `/settings/mcp`, and a close button. The bar SHALL NOT show to members without `mcp.connect`, before the connections have loaded, or once any connection exists (named or not); otherwise it SHALL stay on every page, including after the member opens MCP connections, until the member closes it with ✕. Closing SHALL be remembered per member across devices. The bar SHALL emit PostHog `mcp-hint-shown` (once per mount), `mcp-hint-dismissed` and `mcp-hint-connect-clicked` with `context: 'launch_bar'`.

#### Scenario: Member without MCP access

- **WHEN** a member without `mcp.connect` opens any page
- **THEN** no launch bar shows and the member's MCP connections are not requested

#### Scenario: Set up now

- **WHEN** an eligible member clicks "Set up now"
- **THEN** `/settings/mcp` opens, and the bar does not come back after that page has been opened

### Requirement: Contextual MCP hints suggest the agent where the member just did its work

To the same audience as the launch bar (the MCP connections page on, `mcp.connect`, connections loaded), LabOS SHALL show a hint card right after the member did something an agent could do for them: on AI Search under the latest answer, in the message list above the follow-up field (not inside the pinned composer, which would cover the answer), from the second question sent in the browser session, quoting the latest question; on Forum → Create Post (not the edit form, not the reply box) between the Title field and the post editor once the title is not empty, but only once Forum write tools ship (LAB-3031): until then `SHOW_MCP_FORUM_HINT` is off and no MCP hint shows on Create Post; and on AI Apps → Feedback, Received tab, under the tabs row when 3 or more received feedback items have status NEW (counted before filters); and on the AI Apps list page, between the page header and the grid, with no trigger, once the apps list has loaded (LAB-3062), with the copy of the requirement "The AI Apps page hint says what to do for each agent and apps state" below. With no connection the card SHALL show the Claude and Codex marks, a title and line naming what connecting gives ("Ask this from Claude or Codex next time", "Let your agent draft this post", "Triage these <N> new comments from your agent"), and a "Connect an agent" link that opens `/settings/mcp`. With a connection it SHALL show only that client's mark, "Ask <client> instead", and the same request as a prompt with a copy button. A client LabOS has no mark for SHALL show the brand-free plug mark with its name; a client that sent no name SHALL show the plug mark and "Ask your agent instead". The hints SHALL never name Claude for a client that is not Claude. A ✕ SHALL dismiss the hint for its context only, remembered per member across devices (`mcp_hint_search`, `mcp_hint_forum`, `mcp_hint_comments`, `mcp_hint_apps`). Each hint SHALL emit PostHog `mcp-hint-shown` (once per mount, with `connected`), `mcp-hint-dismissed`, `mcp-hint-connect-clicked` and `mcp-hint-prompt-copied` (with `clientName`), with `context` `search`, `forum`, `comments` or `apps`.

#### Scenario: Second search with no agent

- **WHEN** an eligible member with no MCP connection sends a second AI Search question, "Open roles at Prime Intellect", in the same browser session
- **THEN** under the answer, above the follow-up field, a hint reads "Connect LabOS to your agent and search “Open roles at Prime Intellect” where you already work." with "Connect an agent"

#### Scenario: No forum hint before Forum MCP

- **WHEN** a member types a title on Forum → Create Post while Forum write tools have not shipped
- **THEN** no MCP hint shows

#### Scenario: Connected client with no name

- **WHEN** a member whose connection sent no client name sends a second AI Search question
- **THEN** the hint reads "Ask your agent instead" with the plug mark and the prompt to copy

#### Scenario: Dismissed in one place only

- **WHEN** a member dismisses the AI Search hint
- **THEN** it does not come back on AI Search, and the Forum and Feedback hints still show when their triggers hold

### Requirement: The AI Apps page hint says what to do for each agent and apps state

The AI Apps list hint (LAB-3136, copy from the LAB-2948 prototype's `appsContext()`) SHALL pick one of five states from three inputs: whether the member has a connection; the first connection's `ai_apps` scope `level`; and whether the member created at least one app (apps by other members in the list do not count). `<agent>` is the first connection's client name, or "your agent" when it sent none; `<app>` is the member's most recently updated app.

| State | Title | Text | Action |
|---|---|---|---|
| No agent, has apps | Redeploy your apps from Claude or Codex | Connect LabOS to your agent, then ask it to redeploy “<app>” from the chat you already work in. | "Connect an agent" → `/settings/mcp` |
| Connected, `ai_apps` read or none, has apps | Let <agent> redeploy your apps | <agent> is connected with read-only access, so it can see your apps but not change them. Allow changes to AI Apps to redeploy and rename them from your chat. | "Allow changes" → `/settings/mcp?connection=<uid>&scope=ai_apps` |
| Connected, `ai_apps` write, has apps | Redeploy your apps from <agent> | <agent> is connected to LabOS. Paste this into a <agent> chat and it redeploys the app for you. It can rename apps and edit their descriptions the same way. | Prompt "Redeploy my LabOS AI App “<app>”" with a copy button |
| No apps, no agent | Build your first app with Claude or Codex | Get the Starter Kit, open it in your agent and ask it to build and deploy the app. Connect your agent to LabOS too, and it can redeploy the app later. | "Get the Starter Kit" and "Connect an agent" |
| No apps, connected (any level) | Build your first app with <agent> | <agent> is connected to LabOS. Get the Starter Kit, open it in <agent> and ask it to build and deploy your app. Once it’s live, <agent> can redeploy it for you. | "Get the Starter Kit" |

"Get the Starter Kit" SHALL open the Create AI App card's Starter Kit flow (`CreateAiAppModal`). The hint SHALL not show while the apps list loads or when it failed. `mcp-hint-shown` with `context: 'apps'` SHALL add `state` (`no_agent`, `read_only`, `connected` or `no_apps`). "Get the Starter Kit" SHALL emit `mcp-hint-starter-kit-clicked` (with `state`) and "Allow changes" SHALL emit `mcp-hint-allow-changes-clicked` (with `authorizationUid` and `clientName`); the other `mcp-hint-*` events stay as above. ✕ SHALL hide the hint for good in every state (`mcp_hint_apps`).

#### Scenario: Read-only connection with apps

- **WHEN** a member whose first connection has AI Apps at Read opens the AI Apps page and owns an app
- **THEN** the hint reads "Let <agent> redeploy your apps" with "Allow changes" and no prompt

#### Scenario: Write connection with apps

- **WHEN** a member whose first connection has AI Apps at write owns the app "Grant Radar"
- **THEN** the hint shows "Redeploy your apps from <agent>", the explanation, and the prompt "Redeploy my LabOS AI App “Grant Radar”" with a copy button

#### Scenario: No apps of their own

- **WHEN** a member with no connection and no app of their own opens the AI Apps page
- **THEN** the hint reads "Build your first app with Claude or Codex" with "Get the Starter Kit" and "Connect an agent"

### Requirement: The Claude app steps come first

With `NEXT_PUBLIC_SHOW_MCP_CONNECTIONS_PAGE` off, the MCP section in Email & Accounts (LAB-2993) applies. The MCP section SHALL show the block "Claude app (web, desktop, mobile)" above the "For developers" block. The block SHALL show three numbered steps, a copy button for the MCP server URL next to step 2, and the text "After this, LabOS works in Claude on web, desktop and mobile. If you do not see Add custom connector, ask your Claude workspace admin to add LabOS." The intro text SHALL name the Claude app first.

#### Scenario: Member opens the MCP section

- **GIVEN** a member with `mcp.connect`
- **WHEN** the member opens Settings → Connected Accounts
- **THEN** the first block in the MCP section is "Claude app (web, desktop, mobile)" with three steps
- **AND** the "For developers" block is below it

#### Scenario: Member copies the server URL from the Claude app block

- **GIVEN** the MCP section is open
- **WHEN** the member selects the copy button next to step 2
- **THEN** the MCP server URL (`<DIRECTORY_API_URL>/mcp`) is copied
- **AND** `mcp-setup-snippet-copied` is sent with `snippetType: 'claude-app'`

### Requirement: The access text is visible

The MCP section SHALL show, without a click: "Your agent acts as you, with your LabOS access. You choose read-only or make-changes when you approve. You can revoke an agent here at any time."

#### Scenario: Member reads what connecting means

- **GIVEN** the MCP section is open
- **THEN** the access text is visible

### Requirement: Developer commands stay

The "For developers" block SHALL show the MCP server URL, the Claude Code command and the Codex commands, each with a copy button that sends `mcp-setup-snippet-copied` with `snippetType` `server`, `claude` or `codex`.

#### Scenario: Developer copies the Claude Code command

- **GIVEN** the MCP section is open
- **WHEN** the member copies the Claude Code command
- **THEN** `claude mcp add --transport http labos <server URL>` is copied
- **AND** `mcp-setup-snippet-copied` is sent with `snippetType: 'claude'`

### Requirement: Connected clients can be revoked

The MCP section SHALL list each connected client with its connect date and last use, and a Revoke button that removes that authorization.

#### Scenario: Member revokes a client

- **GIVEN** a member with one connected client
- **WHEN** the member selects Revoke on it
- **THEN** the authorization is revoked and `mcp-authorization-revoked` is sent

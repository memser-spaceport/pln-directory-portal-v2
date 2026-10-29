# mcp-settings Specification

> Added by LAB-2993. The MCP section in Settings → Connected Accounts.

## Purpose

A member who has `mcp.connect` sees how to connect an agent to LabOS. The Claude app steps come first; the terminal commands for developers come below. The member sees the connected clients and can revoke each one.

## Requirements

### Requirement: The Claude app steps come first

The MCP section SHALL show the block "Claude app (web, desktop, mobile)" above the "For developers" block. The block SHALL show three numbered steps, a copy button for the MCP server URL next to step 2, and the text "After this, LabOS works in Claude on web, desktop and mobile. If you do not see Add custom connector, ask your Claude workspace admin to add LabOS." The intro text SHALL name the Claude app first.

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

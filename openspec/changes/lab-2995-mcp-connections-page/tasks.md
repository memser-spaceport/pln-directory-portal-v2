## 1. Data layer

- [x] 1.1 `services/mcp/types.ts`: `McpConnection`, `McpScope`, `McpLevel`, `McpConnectionStatus` and `McpAccessRequest`, mirroring the BE contract
- [x] 1.2 `services/mcp/constants.ts` query keys; `mcp.service.ts`: `updateMcpScopes`, `fetchMcpAccessRequest`, plus the extended `fetchMcpAuthorizations` type
- [x] 1.3 Hooks: `useMcpConnections`, `useUpdateMcpScopes`, `useRevokeMcpConnection`, `useMcpAccessRequest` (gated on the param and login)

## 2. Page shell

- [x] 2.1 `SHOW_MCP_CONNECTIONS_PAGE` flag and `.env.example`
- [x] 2.2 `app/settings/mcp/page.tsx`: login redirect keeping the query, settings shell, `notFound()` when the flag is off
- [x] 2.3 Menu item "MCP connections" in the Account group (flag + `useMcpAccess`); update `use-get-menu-items` test
- [x] 2.4 Hide `McpSection` in `ConnectedAccounts` when the flag is on

## 3. Components (port from the LAB-2948 prototype)

- [ ] 3.1 Extract `McpConnectGuide` from `McpSection` (after LAB-2993 merges) and use it in both places
- [x] 3.2 `McpConnectionsPage`: loading, error with Retry, no-permission note, guide (expanded with no connections, collapsed with any)
- [x] 3.3 `McpConnectionCard`: status badge, dates, chips with "+N more", Edit permissions, ⋯ Revoke with inline confirm
- [x] 3.4 `McpPermissionsDrawer` + `ScopeEditor`: templates, rows with locks, one Save, error kept in the drawer, Cancel
- [x] 3.5 Request deep link: load the request, open the drawer preset with the note, send `requestUid`, note for expired/resolved/foreign, clear the param on close
- [ ] 3.6 Mobile (<640px) check against the prototype

## 4. Analytics

- [x] 4.1 Add the five events to `MCP_ANALYTICS_EVENTS` and `useMcpAnalytics`, and fire them

## 5. Tests and docs

- [x] 5.1 Jest: menu item gating, guide vs cards, card status and chips, drawer lock, Read and write template, save success/failure, revoke failure, request open/expired
- [ ] 5.2 Verify against the BE contract on the `lab-2995` feature env (flag on)
- [ ] 5.3 Archive this change in the PR; reconcile with LAB-2993's `mcp-settings` spec if it has landed

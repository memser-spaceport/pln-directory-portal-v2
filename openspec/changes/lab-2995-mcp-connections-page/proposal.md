## Why

LAB-2995 gives every MCP connection its own `none`/`read`/`write` level per feature, under admin caps, and refuses agent calls with a link to `/settings/mcp?request=<id>`. Members need a page to see each connection and change its access, and that link needs somewhere to land. Today MCP is only a card inside Settings → Email & Accounts, with no permissions and no URL of its own.

## What Changes

- New Settings page **MCP connections** at `/settings/mcp`, in the Account group of the settings menu. It's behind `NEXT_PUBLIC_SHOW_MCP_CONNECTIONS_PAGE` and shown only to members with `mcp.connect` (`useMcpAccess`).
- With the flag on, `McpSection` leaves Email & Accounts. The new page reuses its connect guide (server URL, the Claude app steps from LAB-2993, the Claude Code and Codex commands). The guide collapses once a connection exists.
- One card per connection: client name, status badge (Active / Idle / Not used yet / Sign-in expired), connected and last-used dates, permission chips (the first four, then "+N more"), an "Edit permissions" link, and a ⋯ menu with Revoke (inline confirm).
- Permissions drawer: templates (Read only, Read and write, Custom as a reading of the rows), one row per scope with No access / Read / Read and write, a locked option with "Turned off by LabOS admins", and one Save for the whole draft with no extra consent step.
- `?request=<id>` opens that connection's drawer with a note naming what the agent tried and the requested scope preset to write. An expired, resolved or foreign request opens the page with a short note and no preset.
- PostHog: page viewed, drawer opened, levels saved or failed, request opened.

## Capabilities

### New Capabilities
- `mcp-settings`: the MCP connections page in Settings (connections, status, permissions drawer, access-request deep link, revoke). If LAB-2993 lands its `mcp-settings` spec first, this change's requirements are added to it, and its Email & Accounts placement requirement gets replaced at archive.

### Modified Capabilities
<!-- none on develop today -->

## Impact

- New: `app/settings/mcp/page.tsx`, `components/page/settings/mcp/*` (page, cards, drawer, scope editor), `services/mcp/hooks/*` and `services/mcp/constants.ts` (query keys), and `services/mcp/mcp.service.ts` additions (`updateMcpScopes`, `fetchMcpAccessRequest`).
- Changed: `useGetMenuItems` (new item), `ConnectedAccounts.tsx` (hide `McpSection` behind the flag), `analytics/mcp.analytics.ts` + `MCP_ANALYTICS_EVENTS`, `.env.example`.
- Depends on the backend contract from LAB-2996/BE-2 (`pln-directory-portal` change `lab-2995-mcp-scopes`). It can be built on mocks first.
- Out of scope: the consent screen (FE-2), banner/hints/New badge (LAB-3011), View activity (LAB-2938), and the client account email.

## Context

The prototype `prototypes/entries/lab-2948-prototype-a-better-mcp-connect/` (Polina, 2026-10-27, on develop) is the design. Its `McpSectionMock.tsx` (page and cards), `Permissions.tsx` (`ScopeEditor`, `PermissionsDrawer`, `accessSummary`), `AccessRequest.tsx` (request note) and `mocks.ts` (scope copy, templates) already use production Drawer, Button, Badge, Tabs and CopyButton. Production code must not import from `prototypes/`, so the components are ported into `components/page/settings/mcp/`.

Production today: `components/page/connected-accounts/McpSection.tsx` (guide, list, revoke; LAB-2993's #3366 reorders the guide), and `services/mcp/mcp.service.ts` with an inline `['mcp-authorizations']` key. Settings pages follow the news-preferences recipe: a server `page.tsx` with a login redirect, then the `SettingsBackButton` + `SettingsMenu` aside + content, the `settings-navigate` listener and `triggerLoader(false)`.

Backend contract (from `pln-directory-portal` `openspec/changes/lab-2995-mcp-scopes`):

- `GET /v1/mcp/authorizations` → `{ items: [{ uid, clientName, connectedAt, lastUsedAt, status, scopes: [{ key, label, level, maxLevel, registryMax, lock }] }] }`. `registryMax` (added 2026-10-28) tells a row whether to show a locked "Read and write" option.
- `PATCH /v1/mcp/authorizations/:uid/scopes` `{ levels, requestUid? }` → item (400/404/409)
- `GET /v1/mcp/access-requests/:uid` → `{ uid, authorizationUid, scope, level, toolName, status, createdAt }`

## Goals / Non-Goals

**Goals:** port the prototype's page, cards and drawer to production with live data. Make the request link work. Keep one MCP place in Settings.

**Non-Goals:** consent screen (FE-2), launch banner, hints and New badge (LAB-3011), View activity (LAB-2938), account email, admin UI.

## Decisions

- **Port the prototype's copy and structure verbatim, with the deviations listed below** (each listed for Polina's review):
  1. The card meta shows connected and last-used dates. The prototype shows the client account email instead, which the backend can't get (decided 2026-10-28).
  2. The ⋯ menu has Revoke only, with no View activity.
  3. No "Lowering drops waiting actions" toast, because there's no queue.
  4. Scope rows come from the server. Rows with no tools yet (Job board, Office hours, Your profile) don't show.
  5. Copy trimmed to what the server exposes today: Search drops "and ask AI Search"; Investors write says "add notes and feedback to your paths, and edit investor records" (no refresh tool yet); the intro's use cases list search, investors and AI Apps feedback instead of posting news and RSVPs.
- **Scope descriptions** ("With write: start threads and reply") are kept in a frontend map keyed by scope key, copied from `mocks.ts`. Label and levels come from the server, and an unknown key renders with its server label and no description.
- **Data:** `services/mcp/constants.ts` gets `McpQueryKeys.AUTHORIZATIONS = 'mcp-authorizations'` (same string, so the old McpSection cache keeps working) and `ACCESS_REQUEST`. The hooks are `useMcpConnections`, `useUpdateMcpScopes` (on success, writes the returned item into the list cache), `useRevokeMcpConnection`, and `useMcpAccessRequest(id)` (enabled only when `?request=` is present and the member is logged in; per the customFetch reload-loop trap, gate in the hook). There's no optimistic update for Save: the drawer is a draft, so a pessimistic save keeps it simple and honest.
- **Deep link:** read `request` with `useSearchParams`. Once both the request and the list have loaded, open the drawer for `authorizationUid`. On close, drop `request` from the URL with `router.replace` (mind the replaceState `__NA` trap: use the router, not `history`).
- **Guide:** the guide content moves from `McpSection` into a shared `McpConnectGuide` component used by both McpSection (flag off) and the new page, so LAB-2993's steps aren't duplicated.
- **Flag:** `SHOW_MCP_CONNECTIONS_PAGE` in `utils/mcp.ts` (pattern: `SHOW_NEWS_PREFERENCES`). Page `notFound()` when off. Turbopack inlines the env, so both branches stay testable via jest env mocking.
- **Analytics** (in `MCP_ANALYTICS_EVENTS` + `useMcpAnalytics`): `mcp-connections-page-viewed`, `mcp-permissions-drawer-opened {authorizationUid, source: 'card'|'more'|'request'}`, `mcp-scope-levels-saved {authorizationUid, changes, viaRequest}`, `mcp-scope-levels-save-failed`, `mcp-access-request-opened {status}`. The existing revoke events are kept.

## Risks / Trade-offs

- [LAB-2993 is not merged yet] → Start on mocks, then rebase on develop once #3366 merges, before extracting `McpConnectGuide`.
- [The backend contract may shift during BE-1] → The zod contract lives in `libs/contracts` in BE. Mirror the types in `services/mcp/types.ts`, and check them against the real API on the feature env before the PR.
- [Status "Idle" is unreachable under the current refresh policy] → Render whatever the server sends. The badge map covers all four.

## Migration Plan

Ship behind the flag (off on prod). Turn it on in the `lab-2995` feature env for Roma and Polina. Turn it on in prod together with the release, once BE is live.

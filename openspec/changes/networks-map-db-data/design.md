# Design

## Context

- `islands.ts` holds `ISLANDS`, `PORTFOLIO` (284 rows: id, name, island, white logo URL, startYear, endYear) and `MAP_STATES`. `MAP_STATES` is a set of flat `[rowIndex, q, r]` triples per year (`'2014'…'2026'`) and per island (`'2026:<island>'`).
- `teamInfo.ts` maps 259 logo ids to `{ uid, displayName, oneLiner, stage, website }`.
- `IslandsMap` builds tiles as `PORTFOLIO[rowIndex]`. Colour and hover-dimming come from `logo.island`. A tile is shown when `startYear <= year <= endYear` and the year's state has a position for that row. `PortfolioPanel` (list view) groups `PORTFOLIO` by island. `directoryUrl` / `displayNameOf` read `TEAM_INFO`.
- The API (backend change) returns `{ teams: [{ id, teamUid, name, logoUrl, mapLogoUrl, island, startYear, endYear, oneLiner, stage, website }] }`. It is public and not cached by the API.

## Goals / Non-Goals

**Goals:**
- One merged list of 284 rows in fallback-file order, so `MAP_STATES` row indexes stay valid.
- The page never renders fewer tiles than today.

**Non-Goals:**
- Client-side fetching or polling.
- New tiles for teams that have no fallback row.

## Decisions

### D1. Fallback JSON replaces `PORTFOLIO` and `TEAM_INFO`
`data/portfolio.fallback.json` holds an array in `PORTFOLIO` order: `{ id, uid?, name, island, logo, startYear, endYear, oneLiner?, stage?, website? }`, where `name` is the Directory display name when matched and marketing's name otherwise. A one-off script generates it from the two TS files. It is committed and then edited by hand when needed. `PORTFOLIO` and `TEAM_INFO` are removed; `ISLANDS`, `IslandId` and `MAP_STATES` stay in `islands.ts`.
- *Why:* one row per tile, in one place, with the row index preserved.
- *Alternative:* keep both TS files and merge three sources (rejected: three sources for one row).

### D2. Server fetch with ISR
`services/explore-pl-network/portfolio.service.ts` exports `getPortfolioTeams()`. It calls `${DIRECTORY_API_URL}/v1/explore-pl-network/portfolio` with `next: { revalidate: 3600 }` and a 5s `AbortSignal.timeout`. It returns `[]` on any error or a non-200 response, and logs a warning. `page.tsx` awaits it and passes `apiTeams` to `ExplorePlNetworkView`.
- *Why:* the page is investor-facing and mostly static. ISR keeps it fast. No token is needed.
- *Alternative:* a TanStack Query client fetch (rejected: the tiles would flicker from fallback to DB data).

### D3. Merge function
`mergePortfolio(fallback, apiTeams): PortfolioTeam[]` is a pure function in `data/mergePortfolio.ts`. It returns the fallback order with `{ ...row, ...apiFieldsFor(row.uid), source: 'db' | 'fallback' }`.
- The API's `mapLogoUrl` replaces `logo` only when it is non-null. `name`, `oneLiner`, `stage` and `website` replace the row's values when non-null. Years replace them when `startYear` is non-null, and `endYear` follows the API, null included.
- If the API island is not one of the 5 `IslandId`s, or differs from the row's island, the row keeps the file island and a `console.warn` names the uid. Positions in `MAP_STATES` assume the file island.
- An API team whose uid matches no row is ignored.
- Everything downstream (`IslandsMap`, `PortfolioPanel`, `directoryUrl`, `displayNameOf`, analytics) reads `PortfolioTeam` from props, not the modules.

### D4. Profile link
A row with a uid links to `/teams/<uid>` only when its source is `db`. A row with a uid that the API did not return (for example an inactive team) and a row with no uid link to `/teams?searchBy=<name>`.

## Risks / Trade-offs

- [The API returns a team whose island moved in the DB] → The tile keeps the file island and position, and a warning is logged. Moving it means editing `MAP_STATES`.
- [The API changes a year so the tile is out of range for a year state] → The tile is just hidden for those years. It is never misplaced.
- [ISR serves data up to 1h old] → Accepted for a marketing page. `/api/revalidate` can be used if needed.
- [Dev/feature env DB lacks some prod uids] → Those rows fall back, so the map still shows 284 tiles.

## Migration Plan

Ship after the backend change is merged to `develop`; the goal PRs merge BE first. Rollback is reverting the FE goal PR, since the backend change is additive.

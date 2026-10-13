# Proposal

## Why

The Networks Map on `/explore-pl-network` reads all 284 teams from static files (`islands.ts`, `teamInfo.ts`), so Directory edits never reach the map. The Directory DB is now the source of truth for map team data, served by `GET /v1/explore-pl-network/portfolio`. The map must use it, and keep a fallback so no team disappears. Goal: [LAB-2832](https://linear.app/protocollabs/issue/LAB-2832), Task: [LAB-2834](https://linear.app/protocollabs/issue/LAB-2834). Blocked by the backend change `networks-map-db-data` in pln-directory-portal ([LAB-2833](https://linear.app/protocollabs/issue/LAB-2833)).

## What Changes

- The page fetches the portfolio API on the server and passes the teams to the map and list views.
- `islands.ts` (`PORTFOLIO`) and `teamInfo.ts` become one generated fallback JSON. Each row has the logo id, an optional Directory uid, and all display fields. `MAP_STATES` and `ISLANDS` stay in code.
- Merge by uid. For a matched team, the API value wins for name, one-liner, stage, website, white map logo, island and years. Teams without a uid, and teams the API does not return, use the fallback row.
- An invalid or mismatched API island falls back to the file's island, so tiles keep their colour and group.
- If the API fails, times out or returns no teams, the map renders entirely from the fallback.

## Capabilities

### New Capabilities
- `networks-map`: which team data the Networks Map shows, where it comes from, and how it falls back.

### Modified Capabilities
- None.

## Impact

- `app/explore-pl-network/page.tsx`
- `components/page/explore-pl-network/` (`ExplorePlNetworkView`, `PortfolioPanel`, `IslandsMap`, `EditorialIntro`, `data/*`)
- new `services/explore-pl-network/portfolio.service.ts`
- the tests in `__tests__/page/explore-pl-network/`
- No API changes on the v2 side. It consumes `mapLogoUrl`, which the backend change adds.

## Out of scope

- Computing hex positions. `MAP_STATES` stays as it is, so a team gets a tile only if the fallback file has a row for it.
- Showing PL Portfolio teams that are not in the fallback file.
- Changing analytics events (`logo_id` stays marketing's id).
- Editing map data in the back-office (a follow-up ticket).
- The `EXPLORE_PORTFOLIO_TEAM_COUNT` / "750+" copy (stays 284 while the tile set is fixed).

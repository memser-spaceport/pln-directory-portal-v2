# Tasks

Goal [LAB-2832](https://linear.app/protocollabs/issue/LAB-2832), Task [LAB-2834](https://linear.app/protocollabs/issue/LAB-2834). Blocked by [LAB-2833](https://linear.app/protocollabs/issue/LAB-2833) (backend `networks-map-db-data`). Goal branch `lab-2832`. Task branch `feat/LAB-2834-networks-map-db-data` off `lab-2832`, with its PR base `lab-2832`.

## 1. Fallback data

- [x] 1.1 Generate `components/page/explore-pl-network/data/portfolio.fallback.json` from `PORTFOLIO` + `TEAM_INFO`, in `PORTFOLIO` order (design D1). Verify with a test in `explore-data.test.ts`:
  - 284 rows, and `rows[i].id === PORTFOLIO_old[i].id` (snapshot of the ids)
  - 259 rows with a uid
  - every island is a valid `IslandId`
  - every `MAP_STATES` row index is below 284
- [x] 1.2 Remove `PORTFOLIO` and `TEAM_INFO`, and delete `teamInfo.ts`. Keep `ISLANDS`, `IslandId` and `MAP_STATES`. Verify that `npx tsc --noEmit` reports no references left.

## 2. API client and merge

- [x] 2.1 Add `services/explore-pl-network/portfolio.service.ts` with `getPortfolioTeams()`: `revalidate: 3600`, 5s timeout, `[]` on error or a non-200 response (design D2). Verify with unit tests (fetch mocked) for 200, 500, timeout and invalid JSON.
- [x] 2.2 Add the pure `mergePortfolio(fallback, apiTeams)` (design D3/D4). Verify with unit tests covering:
  - a DB value wins
  - an empty DB field keeps the file value
  - a null `mapLogoUrl` keeps the file logo
  - an invalid island and a mismatched island both keep the file island, and a warning is logged
  - a no-uid row gets `source: 'fallback'`
  - a uid the API does not return gets `source: 'fallback'`
  - an API-only uid is ignored
  - an empty API list returns the fallback unchanged

## 3. Wire the page

- [x] 3.1 Make `page.tsx` async: `await getPortfolioTeams()`, merge, and pass `teams` to `ExplorePlNetworkView`. Keep the `SHOW_EXPLORE_PL_NETWORK` gate first. Verify that the page test renders with mocked API data.
- [x] 3.2 Make `IslandsMap`, `PortfolioPanel`, `directoryUrl` / `displayNameOf` and the analytics param builders read `PortfolioTeam` from props. Verify with `portfolio-panel.test.tsx`:
  - with a mocked merged list, a tile card shows the DB one-liner
  - a no-uid tile links to `/teams?searchBy=`
  - List view shows 284 teams grouped by island
- [x] 3.3 Keep the analytics payloads (`logo_id`, `team_uid`, `island`) the same. Verify with the existing analytics assertions.

## 4. Checks

- [ ] 4.1 Run `npm run lint` and `npm run test`; both pass.
- [x] 4.2 Run `openspec validate networks-map-db-data --strict --json`; it reports the change valid.
- [ ] 4.3 Local smoke: run with the API on `localhost:3000` and the backend change applied. Confirm 284 tiles, DB data on a matched team, and search links on a no-uid team. Then set `DIRECTORY_API_URL` to an invalid host and confirm 284 tiles from the fallback.

## 5. Feature env verification (lab-2832, both refs `lab-2832`)

- [ ] 5.1 On `https://directory-portal-lab-2832.os.pl.xyz/explore-pl-network`:
  - 284 tiles in 2026 Map view and in List view
  - the year strip still adds and removes tiles by year
  - each island focus view shows its tiles
- [ ] 5.2 DB wins: edit one matched team's one-liner via the team edit UI on the feature env and trigger a revalidation (redeploy or `/api/revalidate`). The tile card shows the new text.
- [ ] 5.3 Fallback rows: a no-uid team (from the 25) shows and links to search. NEAR Protocol shows and links to search.
- [ ] 5.4 Comment "@agent run qa" on LAB-2832, then move LAB-2834 to `Ready for test ` for Roman.

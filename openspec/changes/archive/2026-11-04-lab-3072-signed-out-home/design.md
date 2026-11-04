# Design

## Context

Read from `origin/develop` on 2026-11-04 (FE `b05748e75`, BE `1db705c7`):

- **`app/home/page.tsx`.** It is one async server component. `getPageData` reads the cookies, then fetches in parallel:

  - focus areas, featured data and discover data;
  - the grouped team news (14 days, unpaginated), the popular items and the For You match;
  - Quick Actions access, when signed in.

  The featured and discover data are fetched but never rendered, and a failure in either sends the page to `<Error/>`. The page renders, in order: `HomeIntro` (a visually hidden `<h1>`), then `Welcome` (signed out) or `QuickActions` (signed in), then `TeamNews`, then `FocusAreaSection`, then `HomeAbout` (signed out).

- **The prototype** is `prototypes/entries/home-v2/`, which the registry serves at `homepage-redesign-v0`. Its README is the spec for what's shown, and the 2026-11-02/03 notes win over the older text. The signed-out page is `SignedOutHome.tsx`, with `StoryIntro.tsx` (hero, `FactsBand`, `FocusAreas`, `EntitiesRow`), `NewsPreviewList.tsx`, `HomeFooter.tsx` and the styles in `HomeV2Prototype.module.scss`. It imports pieces from sibling prototypes:

  - `home-refactor`: `JobsRail` and `EventsRail`;
  - `newsfeed-v0`: `FeedActions`;
  - `follow-shared`: `FollowButton` styles;
  - `team-profile`: some SCSS.

  Production code can't import from `prototypes/`: Jest ignores that folder, and it holds mocks.

- **Explore components already in production:** `components/page/explore-pl-network/`, with `PortfolioPanel`, `ExploreLogoWall`, `EditorialIntro` styles, `data/content.ts` (`PL_CONTEXT`, `FOCUS_AREAS`, `PL_ENTITIES`), `data/islands.ts`, `data/mergePortfolio.ts` and `PORTFOLIO_FALLBACK`. `/explore-pl-network` loads its data as `mergePortfolio(PORTFOLIO_FALLBACK, await getPortfolioTeams())`. `SHOW_EXPLORE_PL_NETWORK` gates only that route.
- **The data, all public:**
  - Team news: `getTeamNewsGroupedByFocusArea`, which Home already fetches. Each item carries `editorialRank`, and `selectTopStories` already picks the ranked ones.
  - Jobs: `GET /v1/job-openings`, with `sort=newest` and `totalRoles`. `limit` pages teams, so roles are flattened from the groups.
  - Events: `GET /v1/irl/events/upcoming`. [LAB-3071](https://linear.app/protocollabs/issue/LAB-3071) adds `days`, `limit`, `sort=soonest` and `total`.
  - Portfolio: `GET /v1/explore-pl-network/portfolio`.
- **Focus-area titles.** The directory's top-level titles are "Digital Human Rights", "Economies & Governance", "AI & Robotics", "Neurotech" and "Build Innovation Network". Marketing's `FOCUS_AREAS` says "Neurotechnology". `/teams?focusAreas=` matches by title.
- **Analytics.** `analytics/home.analytics.ts` exists. The repo convention for events is kebab-case `{domain}-{action}`. So the README's `home_role_clicked` style becomes `home-role-clicked`.

## Goals / Non-Goals

**Goals:**

- The prototype's signed-out page, ported verbatim into production components, with real data.
- Behind `NEXT_PUBLIC_SHOW_HOME_V2`. With the flag off, nothing changes.
- The shared rail sections (roles and events) and the focus-area cards, built once and reused by [LAB-3125](https://linear.app/protocollabs/issue/LAB-3125).
- One `<h1>` and the JSON-LD kept. The hero and This week are in the server HTML.

**Non-Goals:**

- The signed-in view, `?view=news`, the email-not-found dialog, open source picks and story images.
- Deleting the old Home components, which waits for prod sign-off.
- A design refresh beyond the prototype.

## Decisions

1. **Where the code lives.**
   - New components go in `components/page/home/HomeV2/`: `SignedOutHome`, `HomeHero`, `FactsBand`, `ThisWeekList`, `HomeRail` with `RolesSection` and `EventsSection`, `FocusAreaCards`, `EntitiesRow`, `HomeFooter`, and one `HomeV2.module.scss`.
   - The prototype's sibling imports are ported into this folder, keeping their markup and class values. They are not imported from `prototypes/`.
   - Production components the prototype already imports are used as they are: `PortfolioPanel`, `ExploreLogoWall`, `Badge`, `FollowButton` and `NewsCard` styles.
   - _Rejected: moving the prototype folder into production as is. It is wired to mocks and to review switches._
2. **Flag.**
   - `SHOW_HOME_V2` in `utils/home-v2.ts` reads `process.env.NEXT_PUBLIC_SHOW_HOME_V2 === 'true'` at build time, in the same pattern as `utils/mcp.ts`. It is documented in `.env.example`.
   - The page branches on it in `app/home/page.tsx`.
   - Known trap: Turbopack inlines the value, so the old branch must stay reachable and tested with the flag off. The tests mock the module, not `process.env`.
3. **Server data.**
   - With the flag on and the viewer signed out, `getPageData` fetches only what the new page needs, in parallel, with `Promise.allSettled`:
     - team news, which it already fetches;
     - jobs, through a server-side call to `/v1/job-openings?sort=newest`;
     - events, through `/v1/irl/events/upcoming?days=30&limit=3&sort=soonest`;
     - the portfolio, through `mergePortfolio(PORTFOLIO_FALLBACK, getPortfolioTeams())`.
   - A failed roles or events call drops only that section. A failed portfolio call uses the fallback.
   - The unused featured and discover fetches are skipped on this path, so they can no longer turn the page into `<Error/>`.
4. **This week's three stories.** `selectTopStories` (rank 1–3) runs over the grouped items, which are then topped up with the newest news items not already chosen. Hiring roll-ups and forum posts are excluded. This is a pure function with unit tests.
5. **Rail.**
   - `RolesSection` takes the flattened newest roles and the `total`. It shows 3 roles, or 5 when `EventsSection` has no events, and takes an optional `note`.
   - `EventsSection` renders nothing for an empty list.
   - Both link rows send `home-role-clicked` and `home-event-clicked`.
6. **Focus-area cards.**
   - A constant maps each of marketing's four island ids to the directory title: Neurotech, Digital Human Rights, Economies & Governance, AI & Robotics. The cards show marketing's name and line, link with the directory title, and count the merged portfolio teams per island.
   - The mapping has a unit test.
   - Checking it against the live `GET /v1/focus-areas` is a task on the env.
7. **Auth doors.**
   - "Sign in" uses the navbar's sign-in path (`#login`, which loads Privy since LAB-3092).
   - "Sign up for free" uses the navbar's Sign up target.
   - Both send `home-auth-door-clicked`.
8. **SEO.**
   - The hero's mission is the `<h1>`. `HomeIntro` (the hidden `<h1>`) and `HomeAbout` are not rendered on this path.
   - The JSON-LD script stays at the top of the page.
   - `metadata` is unchanged.
9. **The map's weight.**
   - `PortfolioPanel` is a client component below the fold. It stays server-rendered, as on `/explore-pl-network`, so the map's teams are in the HTML.
   - The phone clamp is CSS: a max-height and a fade, plus a button that toggles a class.
   - Lighthouse is re-measured against the LAB-3100 baseline. If Total Blocking Time worsens by more than 100 ms, the map's client code loads on idle.

## Risks / Trade-offs

- **Two type scales** (Explore at 32/42, directory at 20/28) side by side. The prototype README accepts this, and Polina reviews it on the env.
- **The map's island blues are not PL tokens.** That is accepted in the prototype, unchanged.
- **The portfolio count won't equal what `/teams?focusAreas=X` lists.** The card says "portfolio teams" to make that clear. This was decided with the user on 2026-11-04.
- **The page relies on LAB-3071's event params.** Without them, the endpoint sorts newest first. Build LAB-3071 first. Until it's merged, the events section reads the current response and sorts and filters it on the client.
- **Performance.** The page adds the map and the logo wall to `/home`. See decision 9 and LAB-3100.

## Migration Plan

1. Ship with the flag off on prod. Turn it on on the `lab-3070` feature env and on dev.
2. Polina and Roma review on the env. The flag goes on in prod after LAB-3125 ships too.
3. Cleanup ticket after prod: remove the old Home branch and its components.

Rollback: turn the flag off and redeploy.

## Open Questions

- Story images (`imageUrl` already exists in the backend): waiting on Polina. Not in this change.

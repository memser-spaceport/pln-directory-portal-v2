# Tasks

## 1. Flag and page branch (design 2, 3)

- [ ] 1.1 Add `SHOW_HOME_V2` to `utils/home-v2.ts` and document `NEXT_PUBLIC_SHOW_HOME_V2` in `.env.example`. Verify: with the flag mocked off, a jest test of `/home` renders the previous Home (Welcome, TeamNews, FocusAreaSection).
- [ ] 1.2 In `app/home/page.tsx`, branch on the flag and on whether the viewer is signed in. On the new path, fetch with `Promise.allSettled` only what the page needs, and skip the featured and discover fetches. Verify: jest tests show that a failed roles or events call drops only that section, and that a failed portfolio call uses `PORTFOLIO_FALLBACK`.

## 2. Pure data helpers (design 4, 5, 6)

- [ ] 2.1 `pickThisWeek(items)`: the top stories (rank 1–3), topped up with the newest news, three in total, with no hiring roll-ups or forum posts. Verify: unit tests for ranked plus newest, none ranked, and fewer than three items.
- [ ] 2.2 `flattenNewestRoles(groups, n)` from the job-openings response, plus the total from `totalRoles`. Verify: unit tests.
- [ ] 2.3 The island-to-directory focus-area map, and the per-island count and logos from the merged portfolio. Verify: a unit test shows that "Neurotech" (not "Neurotechnology") goes into the link and that each card's count matches its island.

## 3. Components, ported from `prototypes/entries/home-v2` (design 1)

- [ ] 3.1 `HomeHero` with the Join the network card, and `FactsBand`, from `StoryIntro.tsx`. Diff the copy and classes against the prototype file. Verify: one `<h1>` with the mission, and both doors render.
- [ ] 3.2 `ThisWeekList`, from `NewsPreviewList.tsx`. Follow and Like call sign-up when signed out, a row opens the story, and "See all updates →" goes to `/home?view=news`. Verify: jest tests.
- [ ] 3.3 `HomeRail` with `RolesSection` and `EventsSection`, ported from `home-refactor/JobsRail` and `EventsRail`. The signed-out roles note is included, and the reflow from 3 roles to 5 happens when there are no events. Verify: jest tests for events present, events absent, and a failed source.
- [ ] 3.4 The portfolio section: `PortfolioPanel`, the phone clamp with "Show the whole map", and `FocusAreaCards`. Verify: a jest test shows the clamp button toggling, and each card's links.
- [ ] 3.5 `EntitiesRow`, `ExploreLogoWall` and `HomeFooter`, with Contact support opening the support form. Verify: jest tests.
- [ ] 3.6 `SignedOutHome` assembles the sections in the spec's order on the Explore measure (a 1184px column). Verify: screenshots at 1440, 768 and 375 px next to the prototype show matching structure and no horizontal scroll.

## 4. Analytics

- [ ] 4.1 Add the six `home-*` events to `analytics/home.analytics.ts`, with constants following the repo pattern, and fire them from the sections. Verify: jest tests assert the event and its properties for the hero sign-up door, a role, an event, a focus-area link and See all.

## 5. SEO and performance (design 8, 9)

- [ ] 5.1 Verify: on the new path the server HTML has exactly one `<h1>`, the Organization and WebSite JSON-LD, and the hero and This week text, and has no "About Protocol Labs Directory". Use a jest render plus `curl` on the env.
- [ ] 5.2 Run Lighthouse mobile on the env's `/home` (signed out, 3 runs) and compare with the LAB-3100 baseline. Verify: the numbers are recorded in the PR. If TBT worsens by more than 100 ms, the map loads on idle.

## 6. Spec and checks

- [ ] 6.1 Run `npm run lint`, `npm run test` and `npx tsc --noEmit`. Verify: no new failures or errors against `lab-3070`.
- [ ] 6.2 Run `openspec validate lab-3072-signed-out-home --json`. Verify: valid.
- [ ] 6.3 On the `lab-3070` feature env with the flag on, every focus-area link lands on a non-empty list, and the page matches the prototype at 1440 and 375 px. Verify: notes and screenshots in the PR.

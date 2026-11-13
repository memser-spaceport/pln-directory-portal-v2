# Tasks

## 1. Branches

- [ ] 1.1 Create goal branch `lab-3244` from `origin/develop` in pln-directory-portal-v2 and the task branch `feat/LAB-3250-news-tag-card` off it; move this change folder onto the task branch; add `human-only` to LAB-3250 and note on it that saving is by button, as in the LAB-3245 design; verify with `git ls-remote --heads origin lab-3244`

## 2. Data and events

- [x] 2.1 Add the service calls for `GET /v1/team-news/default-tags` and `POST /v1/team-news/default-tags/approve` (JSON body) in `services/team-news/`, a query key, and the hooks `useNewsDefaultTags(enabled)` (`staleTime: Infinity`, `retry: false`, error or bad shape → no data) and `useApproveNewsDefaultTags()` (writes the response into the default-tags cache; invalidates `MembersQueryKeys.GET_MEMBER_PREFERENCES` when tags were sent); unit test the shape guard and the cache write; verify with `npm run test -- news-default-tags`
- [x] 2.2 Add the five `team-news-tags-card-*` event names to `TEAM_NEWS_ANALYTICS_EVENTS` in `utils/constants.ts` and their handlers to `analytics/team-news.analytics.ts` with the fields of the spec's Analytics requirement; verify in the component test of 3.3

## 3. The card

- [x] 3.1 Create `components/page/home/TeamNews/components/NewsTagCard/` with the pure helpers `resolveTagCard(response)` → `{ tags, source } | null` (null when approved, `member-set`, or no tags), `isTagCardVisible({ preferencesOn, signedIn, hasCard, isForYouView, activeTab, activeCategory, query, hasTopicFilter })` and `sourceLine(source)`; unit tests for each branch; verify with `npm run test -- news-tag-card`
- [x] 3.2 Build the component and its SCSS module from the prototype (`git show origin/events-update:prototypes/entries/for-you-starter-topics/ForYouStarterTopicsPrototype.tsx` and its `.module.scss`): title, source line, News preferences chips with the check and plus icons and `aria-pressed`, "Looks good" / "Save topics" (disabled with no chip on, loading while the request runs), "See all topics" (approve, then `/settings/news-preferences?from=feed`), "Topics saved" toast, error toast "Could not save your topics. Please try again.", stacked full-width buttons on phones; no import from `prototypes/`; verify in the component test of 3.3
- [x] 3.3 Component tests in `__tests__/page/home/news-tag-card.test.tsx` for each scenario of the four "Tag card" requirements and the three card scenarios of "Analytics" (approve sends `{}`; save sends the chips that are on; a chip turns off and on with no request; every chip off disables the button; a failed request keeps the chips and shows the error; `shown` fires once across a filter on and off); verify with `npm run test -- news-tag-card`

## 4. Home wiring

- [x] 4.1 In `components/page/home/HomeV2/NetworkUpdates.tsx` render the card in the `forYouLine` slot on For You and on the resting All view; while it is visible render neither `ForYouSetupPrompt` nor `ForYouCaption`. Tests in `__tests__/page/home/home-v2/signed-in-home.test.tsx` for the new `home` scenario (card on All and on For You; another pill hides it and shows the curated line; it stands in for the set-up row; an answered member, a member with own tags and a member with no default tag see the curated line; News preferences off); verify with `npx jest __tests__/page/home/home-v2/signed-in-home.test.tsx __tests__/page/home/for-you-setup-prompt.test.tsx`
- [x] 4.2 In `components/page/home/TeamNews/TeamNews.tsx` render the card where `ForYouSetupPrompt` renders, hide `ForYouHint` and the set-up row while the card is visible; add to `team-news.test.tsx`: card shown → no set-up row and no `team-news-for-you-setup-shown`; verify with `npx jest __tests__/page/home/team-news.test.tsx`
- [x] 4.3 `isForYouSetupVisible` keeps its signature (the callers decide with `tagCardVisible`), so `prototypes/entries/newsfeed/NewsfeedPrototype.tsx` is untouched; verify `npx tsc --noEmit` reports no error in the touched files

## 5. Check on the feature env

- [ ] 5.1 On feature env `lab-3244` (backend PR #3709, job flag on) prepare four members: (a) stored AI tags; (b) team focus areas only, no AI tags; (c) saved tags; (d) no tags from any source. Verify on both Home layouts, desktop and phone width: (a) card with the AI line; (b) card with the team line; (c) no card; (d) no card and the set-up line
- [ ] 5.2 On the env: "Looks good" on (a) → toast, caption back, reload → no card, `GET /v1/team-news/default-tags` has `approved: true` and the preferences read is unchanged; turn a chip off and "Save topics" on (b) → reload → no card, News preferences shows the saved tags; "See all topics" on a fresh member → News preferences opens, back on Home → no card; Top pill hides the card. Check the five events in PostHog live events from a real browser
- [ ] 5.3 Post desktop and phone screenshots of the card (AI, team, changed, every chip off) on LAB-3250 for Polina, with the two open points (source lines, card on All); apply her notes; verify her ok is on the ticket before the Goal PR

## 6. Quality and PR

- [ ] 6.1 Run `npm run lint` and `npm run test`; verify both pass (the two known non-UTC timezone suites aside)
- [x] 6.2 Run `openspec validate news-tag-suggestion-card --json`; verify it reports valid
- [x] 6.3 Sync the deltas into `openspec/specs/team-news/spec.md` and `openspec/specs/home/spec.md` in the same PR; verify the main specs hold the four "Tag card" requirements
- [ ] 6.4 Open the Task PR into `lab-3244` (Conventional Commit title, LAB-3250 linked) and move LAB-3250 to Code review; verify the PR base is `lab-3244`

## Workflow follow-up

- Goal PR `lab-3244` → `develop` after the backend Goal PR; dev check on dev v2.
- Prod push per the lab-ticket-workflow; Roman tests on the feature env before it.
- Archive this change after the prod check (ask first).

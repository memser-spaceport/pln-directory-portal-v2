# Tasks

Start after `lab-3072-signed-out-home` is merged into `lab-3070`.

## 1. Extract the feed hook, with no behaviour change (design 1)

- [ ] 1.1 Move TeamNews's data and state logic into `useHomeFeed`. `TeamNews` renders from it with the same output. Verify: every test under `__tests__/page/home/` passes with no test edits, and on the env with the flag off the signed-in Home looks unchanged.
- [ ] 1.2 Replace `topicFilter: string` with `topicScope: string[]` and `newsItemHasAllTags`. The old layout uses at most one tag. Verify: the existing tag-filter tests pass, and new unit tests cover stacking two tags.

## 2. Filters and search (design 4, 5, 6)

- [ ] 2.1 Add a `top` category (`editorialRank` 1–3) to `matchesTeamNewsCategory`, and the fixed v2 pill row with counts over the in-scope list, hiding pills with a count of 0. Verify: unit tests.
- [ ] 2.2 Strip leading `#`s in `matchesTeamNewsQuery`. Verify: a unit test shows `#ai` matching tag `ai`, and the existing query tests still pass.
- [ ] 2.3 Add "Narrow by", the top three other tags in scope. Verify: a unit test.

## 3. Network Updates layout (design 2, 3, 7)

- [ ] 3.1 Diff the prototype's `V0FeedCard` against production `NewsCard`, then add a `full` variant with `#tag` links and the Top label. Verify: a jest test shows the full body, the tag links calling the scope handler, and the Top label for rank 1–3.
- [ ] 3.2 Build `NetworkUpdates`: the header, the filter row with pills, Type and Sort by, the For You caption, the scope row (chips, count, Follow or Clear all, Narrow by), and the stream of news `full` cards plus production `ForumPostCard`. Verify: jest tests for no Discussions without forum access, the active pill resetting, the Clear all and Follow rules, and no hiring, deals or job entries in the stream.
- [ ] 3.3 The cut: a `ResizeObserver` on the rail sets max-height on wide screens; phones show three cards plus 140px; the faded part ignores clicks; "See all news" goes to `/home?view=news`. Verify: a jest test with a mocked observer, plus screenshots at 1440 and 375 px.

## 4. Rail (design 8)

- [ ] 4.1 Add Teams to follow, `DealsRail` (ported, `offerValue` pill, only with `useDealsAccess`, "See all N deals →") and `PopularThisWeekCard` to `HomeRail` in the spec's order. Verify: jest tests for no deals without access, a pill only when `offerValue` is set, and the section order.

## 5. Page and analytics (design 9)

- [ ] 5.1 Make the signed-in branch of `app/home/page.tsx` use `NetworkUpdates`, `HomeRail` and `FocusAreaCards` when the flag is on, with no Quick Actions and no access fetch. Verify: jest tests for the page with the flag on and off, both signed in.
- [ ] 5.2 Add `home-deal-clicked` and `home-feed-tag-scope-changed`, and wire the shared `home-*` events. Verify: jest tests assert the events and their properties.

## 6. Spec and checks

- [ ] 6.1 Run `npm run lint`, `npm run test` and `npx tsc --noEmit`. Verify: no new failures or errors against `lab-3070`.
- [ ] 6.2 Run `openspec validate lab-3125-signed-in-home --json`. Verify: valid.
- [ ] 6.3 On the feature env with the flag on, check three members (forum access with deals, no forum access, no deals access) against the prototype's `signed-in` and `signed-in-no-deals` states at 1440 and 375 px. With the flag off, check that the old Home is unchanged. Verify: screenshots and notes in the PR.

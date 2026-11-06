# Tasks

## 1. Feed and card

- [x] 1.1 `useHomeFeed`: a `newsOnly` stream option. No forum posts, opens on All, pill counts follow the search. Verify: the existing home tests pass unchanged.
- [x] 1.2 `NewsCard` boxed variant: opt-in tags, image, `stretch` and `onNeedsAccount`. Verify: the existing card tests pass unchanged.

## 2. The page

- [x] 2.1 Extract `FeedFilterBar` and `TagScopeRow` from `NetworkUpdates`. Verify: `signed-in-home.test.tsx` passes unchanged.
- [x] 2.2 `NewsPage`: head with held-open search, filter bar, scope row, grid, empty, miss and unavailable lines, the story dialog signed in and out. Verify: `news-page.test.tsx`.
- [x] 2.3 `app/home/page.tsx`: the `view=news` branch behind the flag, its loader and the tab title. Verify: `home-page-v2.test.tsx` covers flag off, signed in, signed out, a failed call and a deep link.

## 3. Checks

- [x] 3.1 eslint, prettier and `tsc` show no new errors on the changed files.
- [x] 3.2 Locally against the dev API with the flag on: 2 columns at 1440 and 768 px, 1 at 375 px; images on the card's floor; pills, search, tag stacking and sort work; "See all news" and "See all updates" open the page.

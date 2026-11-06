# Tasks

One PR from `lab-2969-3000` into `lab-2969`. The backend contract comes from LAB-2998 (pln-directory-portal, also into `lab-2969`).

## 1. Data

- [x] 1.1 Confirm the contract against the LAB-2998 PR (tag list path and shape, `newsTags`, `newsTagsSeeded`) and update design.md if it differs.
- [x] 1.2 Add `newsTags` and `newsTagsSeeded` to the member preferences type read by `useGetMemberPreferences`.
- [x] 1.3 Add a tag list service and React Query hook (query key in the team-news constants). Verify: a hook test covers success and failure.
- [x] 1.4 Add `useSetNewsTags` (optimistic, rolls back on error), modelled on `useSetNewsCategories`, which is then deleted. Verify: hook tests cover success and rollback.

## 2. Tags card (D1–D4)

- [x] 2.1 Replace the Categories and Suggested cards in `NewsPreferences` with the Tags card: chosen first with the order frozen, grouped by parent, check/plus chips with `aria-pressed`, "Saved", seed note, empty note, list-unavailable notice. Follow `prototypes/entries/digest-topics/` for layout and copy.
- [x] 2.2 Simplify `app/settings/news-preferences/page.tsx`: pass `newsTags`/`newsTagsSeeded` from preferences, drop the team fetches and `buildTeamSignals`.
- [x] 2.3 Arrival outline: `gap` is `teams` or `tags`. Verify: the From the For You hint scenario.
- [x] 2.4 Analytics per D6. Verify: tests assert `settings-news-preferences-tag-toggled` with tag, state and `from`.
- [x] 2.5 Tests for every News tags scenario in the spec delta (add, never chosen, first change saves the seed, remove every tag, save fails, list unavailable).

## 3. For You without categories (D5)

- [x] 3.1 Stop reading `newsCategories` in `app/home/page.tsx` and stop passing categories to `selectForYouItems`. Remove `NEWS_PREFERENCE_CATEGORIES` users. Verify: existing For You tests pass without the category cases, which are deleted.

## 4. Check and ship

- [x] 4.1 Run the page locally with the flag on against the LAB-2998 branch's API (or the feature env): seeded member, member with saved tags, member with none. Check the browser console for hydration warnings.
- [x] 4.2 Run `npm run lint` and `npm run test`.
- [x] 4.3 Run `npx -y @fission-ai/openspec@1.14.1 validate --json`, then archive this change in the same PR.

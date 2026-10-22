# Tasks

## 1. Data

- [x] 1.1 Add `newsCategories` to the member preferences types and mappings (`useGetMemberPreferences` and `getMemberPreferences`). Add the `NEWS_PREFERENCE_CATEGORIES` constant (the 6 backend types) and a `readNewsCategories(prefs)` helper that falls back to all 6. Verify with a Jest test for the helper and the hook mapping.
- [x] 1.2 Add `useFollowedTeams` (React Query around `getFollowedTeams`, key under `FollowQueryKeys`). Verify with a Jest test of its query function.

## 2. For You filter

- [x] 2.1 Give `selectForYouItems` an optional `categories` set that keeps only news in those categories, and use it at all three `TeamNews` call sites. Verify with new cases in `select-for-you-items.test.ts`; existing cases must stay unchanged.
- [x] 2.2 In `app/home/page.tsx`, load the signed-in member's `newsCategories` with the existing server fetches and pass them to `TeamNews`. Verify that `team-news.test.tsx` passes and that a new test shows a narrowed For You when categories are passed.

## 3. Page

- [x] 3.1 Create the `app/settings/news-preferences/page.tsx` server component. It handles the auth redirect with `returnTo=settings-news-preferences`, loads member info and up to 5 teams (`getTeam`) for the signals, and renders the settings shell and menu. Add metadata. Verify by running the page in dev, logged in and logged out.
- [x] 3.2 Build the client component from the prototype:
  - the Categories card: chips, summary, Select all, "Saved", at-least-one rule, optimistic save with rollback and a toast on error;
  - the Suggested from your profile card;
  - the Teams you follow card: `FollowButton`, undo in place, empty state;
  - the `from` arrival outline;
  - the `settings-navigate` listener.

  Verify with a Jest test of the toggle, the last-chip lock, save rollback, unfollow/undo and the empty state.
- [x] 3.3 Port the prototype styles that production doesn't have yet (chips, outline, Saved note, signal list) into a co-located SCSS module. Verify by comparing against the prototype at desktop and mobile widths in the browser.

## 4. Ways in

- [x] 4.1 Add the "news preferences" settings menu item after email preferences. Verify by updating `use-get-menu-items.test.tsx`.
- [x] 4.2 Add the line under Network news on Email Preferences that links to the page, shown while Network news is on. Verify with a case in the email preferences tests.
- [x] 4.3 Make the For You hint link "Tune For You" to `/settings/news-preferences?from=feed`. Verify by updating `for-you-hint.test.tsx`.

## 5. Analytics

- [x] 5.1 Add the settings events (opened with `from`, category toggled, save failed, follow toggled) and the team-news `for-you-tune-clicked` event, with their constants, and wire them in. Verify with assertions in the page and hint tests.

## 6. Checks

- [x] 6.1 Run `npm run lint` and `npm run test` (and `npx tsc --noEmit` on changed files). Verify no new errors compared with `develop`. (Done: lint is clean on changed files, with no new type errors. Full Jest: 5524 passed; 6 PLAA suites failed only because the borrowed node_modules lacked `@phosphor-icons/react`, an environment gap.)
- [x] 6.2 Check the page in the browser against the prototype, logged in, with categories saved through the real dev API (`.env.local`). Verify that For You on Home is narrowed after a change. (Done on :4300 against the dev API: the save persists across a reload. Dev has no news in the 14-day window, so the For You narrowing is covered by the TeamNews tests instead.)
- [x] 6.3 Run `openspec validate lab-2929-news-preferences --json`. Verify it reports valid.

## Workflow follow-up

- PR `lab-2929-2941` → `lab-2929`, with this change archived in the same PR.

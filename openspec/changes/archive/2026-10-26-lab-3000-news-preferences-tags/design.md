# Design

## Context

See proposal.md for the motivation. Code at `9ad04f6ea` (`lab-2969` cut from `develop`, 2026-10-26):

- **Page.** `app/settings/news-preferences/page.tsx` is a Server Component behind `SHOW_NEWS_PREFERENCES` (`utils/news-categories.ts`). It reads preferences and the member, fetches up to 5 of the member's teams, builds `signals`, and renders `components/page/news-preferences/NewsPreferences.tsx` with `initialCategories`.
- **Component.** `NewsPreferences.tsx` (319 lines) has three cards: Categories (`useSetNewsCategories`, optimistic, `Saved` note, "at least one"), Suggested from your profile (read-only `signals`), Teams you follow (`useFollowedTeams`, `useFollowTeam`, undo in place). Arriving from the digest or the feed outlines `gap`: `teams` when the member follows none, otherwise `categories`.
- **Data.** `useGetMemberPreferences` reads `GET /v1/members/:uid/preferences`; `useUpdateMemberPreferences` sends `PATCH /v1/member/:uid/preferences`, a shallow merge of top-level keys on the backend (pln-directory-portal#3413).
- **For You.** `TeamNews.tsx` narrows For You with `selectForYouItems(items, forYouTeamUids, categories)` when `newsCategories` narrows; `app/home/page.tsx` reads `newsCategories` when the flag is on.
- **Design.** `prototypes/entries/digest-topics/` (rewritten 2026-10-23) shows a Topics card: chips with a check or plus, chosen first with the order frozen, "Saved", an empty note, and the arrival outline. It uses invented hashtags; the real vocabulary is focus areas.
- **Backend contract (LAB-2998, built in parallel).** Assumed here, to be confirmed against that PR:
  - `GET /v1/members/:uid/preferences` returns `newsTags: string[]` (focus-area slugs) and `newsTagsSeeded: true` when the member never saved tags (the list is then their teams' focus areas).
  - `PATCH /v1/member/:uid/preferences` with `{ newsTags: string[] }`; unknown slugs answer 400; `[]` is allowed.
  - A tag list endpoint (working name `GET /v1/team-news/tags`) returns `{ slug, title, children: { slug, title }[] }[]` for focus areas used by news in the last 90 days.

## Goals / Non-Goals

**Goals:**

- One Tags card replacing Categories and Suggested from your profile, matching the prototype's interaction.
- No category filter in For You, so For You is exactly as it was before LAB-2941 while the tag matching (LAB-3001) is built.
- Nothing visible changes in production: everything stays behind the flag.

**Non-Goals:**

- For You matching by tags (LAB-3001) and tags on posts (LAB-3003).
- A free-text tag input.
- Deleting `newsCategories` code paths on the backend.

## Decisions

### D1. The Tags card replaces both removed cards

`NewsPreferences` loses the Categories and signals cards and `useSetNewsCategories`; it gains a Tags card driven by a new `useSetNewsTags` (same optimistic pattern: local state, rollback and `toast.error` on failure, `Saved` note for 2 s). The page stops fetching the member's teams (no `getTeam` calls), because the backend seeds the tags.

_Alternative:_ keep "Suggested from your profile" as an explanation of the seed. Rejected: the seed note in the Tags card says the same in one line, and the Goal asks for one section.

### D2. Chosen tags first, order frozen while the page is open

As in the prototype: the order is computed once from the tags chosen on load, so a chip doesn't jump when toggled. Unchosen tags follow, grouped under their parent focus area with the parent as a chip too. Picking a parent is a single tag; the backend expands it when matching (LAB-2999).

### D3. Seeded tags are saved on the first change, not on open

When `newsTagsSeeded` is true, the card shows the seeded list as chosen plus the note. The first add or remove PATCHes the whole resulting list, so the seed is stored together with the change. Opening the page writes nothing.

### D4. The tag list loads on the client; chosen tags never disappear

The tag list comes from its own React Query hook. A chosen tag that is not in the 90-day list still shows (by its title when the list knows it, otherwise by slug). If the list fails, the card shows the chosen tags and a one-line notice; Teams you follow is unaffected.

### D5. For You drops the category filter now

`app/home/page.tsx` stops reading `newsCategories`, and `TeamNews` calls `selectForYouItems` without categories. `selectForYouItems` keeps its signature for LAB-3001, which adds tags. `utils/news-categories.ts` keeps only the flag.

### D6. Analytics

`onNewsPreferencesCategoryToggled` becomes `onNewsPreferencesTagToggled({ tag, on, from })` with constant `SETTINGS_NEWS_PREFERENCES_TAG_TOGGLED: 'settings-news-preferences-tag-toggled'`. `save-failed` takes `section: 'tags' | 'teams'`. The arrival `gap` is `teams` or `tags`.

## Risks / Trade-offs

- [The backend contract shifts while LAB-2998 is built] → The two hooks own the shapes; tasks start with confirming the contract against the LAB-2998 PR.
- [A long tag list on a narrow screen] → 25 tags today; chips wrap. Parents group their children, so the list scans by area.
- [Removing the category filter changes For You for anyone who turned categories off] → Only behind the flag, which is off in production; on dev it returns For You to its pre-LAB-2941 behaviour until LAB-3001 lands.

# Design

## Context

- **Backend (LAB-2940, merged into `lab-2929`):**
  - `PATCH /v1/member/:uid/preferences` accepts `{ newsCategories: NewsEventType[] }`. It validates the list: non-empty, the 6 known types only, otherwise 400. The jsonb merge leaves other keys untouched.
  - `GET /v1/members/:uid/preferences` always returns `newsCategories`, all 6 by default.
  - `digest-picks` already filters by these categories.
- **The frontend drops unknown preference keys today.** The preferences hook (`useGetMemberPreferences`) and `getMemberPreferences` map only the keys they know, so `newsCategories` is discarded.
- **For You on Home is built on the client** by `selectForYouItems(items, forYouTeamUids)`. `forYouTeamUids` comes from the server-rendered `app/home/page.tsx` and is frozen with `useState`. The initial tab (For You or All) is decided during the first render.
- **Other building blocks:**
  - The settings pages share one shell (`app/settings/email/page.module.css`, back button + menu aside + content) and a `settings-navigate` listener in each content component.
  - `FollowButton` is presentational. `followTeam`/`unfollowTeam` return null on failure and don't throw.
  - `getFollowedTeams` lists followed teams.
  - No endpoint returns a member's teams with focus areas and industry tags. `GET /v1/teams/:uid` returns both for one team.

## Goals / Non-Goals

**Goals**
- Port the prototype's look and behaviour with production pieces: the settings shell, the Email Preferences cards, `FollowButton`, and the category labels.
- Keep For You consistent from the first paint, with no flash of filtered-out news.

**Non-Goals**
- Live-refreshing For You's team set after a follow change; it updates on the next Home load.
- A new backend endpoint for profile signals.

## Decisions

1. **Categories come from the server for Home.** `app/home/page.tsx` already has the auth token. It calls `getMemberPreferences(uid, authToken)` in its existing `Promise.all` and passes `newsCategories` to `TeamNews` as a prop.
   - `selectForYouItems` gains an optional `categories` set, so its three call sites stay consistent.
   - *Alternative:* the client hook, cached by GlobalFeedback. It may be undefined on first paint and would flip the initial tab.
2. **The page saves through the existing preferences mutation, optimistically.** It sets `[GET_MEMBER_PREFERENCES, uid]` in the cache first, then PATCHes `{ newsCategories }`. On error it restores the previous list, shows `toast.error`, and records the failure. The "Saved" note shows for 2 s on success. This is the pattern of `useSetShowFeedbackButton`.
3. **The categories are the 6 backend `NewsEventType` values**, in a new constant `NEWS_PREFERENCE_CATEGORIES`. Labels come from `getEventTypeConfig`. The prototype's `DEALS` would be rejected by the backend.
4. **Profile signals are fetched on the server, one team at a time.** The page server component loads member info (team roles), then `getTeam(teamUid)` for each team (at most 5, main team first) in parallel. It passes `{ teamName, focusAreas, industryTags }[]` to the client.
   - *Alternative:* a backend endpoint. That's more scope for a short list.
5. **Follows use a new `useFollowedTeams` hook** around `getFollowedTeams`, plus local row state. An unfollowed row stays as "Follow" until the page unmounts. Toggles call `followTeam`/`unfollowTeam` and revert on a null result.
   - Followed teams have no focus-area data, so each row shows only the team name and logo, not the prototype's per-team line.
6. **Arrival outline.** `from=digest|feed` → no followed teams ? Teams : Categories. The outline lasts until the first change. With skills dropped, the prototype's "no skills → profile" branch has nothing to point at.
7. **For You hint.** The sentence stays, and the "Update your profile" link is replaced by "Tune For You" → `/settings/news-preferences?from=feed`. The profile link moves onto the page, in the signals section, as "Edit profile". This is an assumption to confirm with Polina in review.
8. **Menu item** `{ name: 'news preferences', url: '/settings/news-preferences', icon: '/icons/globe.svg', activeIcon: '/icons/globe-blue.svg' }`, right after email preferences. `returnTo=settings-news-preferences` already resolves to `/settings/news-preferences` after login.

## Risks / Trade-offs

- [Several `getTeam` calls per page view] → Capped at 5 and run in parallel. Members rarely have more than 2 teams.
- [The Jest global `useQuery` mock returns `{ memberInfo: {} }`] → Code reading preferences treats a missing `newsCategories` as "all", so existing TeamNews tests keep passing.
- [A follow change doesn't update For You until the next Home load] → Accepted. The page says nothing that promises an instant change.

## Migration Plan

Ships with the Goal merge. The backend is already on `lab-2929`. The digest link (LAB-2942) and this page reach `develop` together, so the link never points at a missing page.

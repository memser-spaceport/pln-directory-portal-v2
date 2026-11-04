# Design

## Context

Read from `origin/develop` on 2026-11-04:

- **`components/page/home/TeamNews/TeamNews.tsx`** (1,324 lines) is the signed-in feed. One component holds both the data and state logic and the layout:
  - Data and state:
    - tabs (All plus the focus areas), categories and sort;
    - search and a single `topicFilter`;
    - forum posts, through `useFeedSocial` (access-gated, 14-day window);
    - upvote and like overlays, followed teams, and the deep-linked item;
    - For You, from team uids and tags;
    - hiring, deals and For You job entries, the Top stories selection, and the feed analytics.
  - Layout: the tabs, the filter bar, `TopStoriesBlock`, `NewsGroupCard` clusters, `NewsRail` and `FeedScrollers`.
  - Its tests sit under `__tests__/page/home/`. These include `matches-team-news-category`, `matches-team-news-query`, `merge-feed-entries`, `news-rail` and `news-tag-chips`.
- **The data.** `getTeamNewsGroupedByFocusArea` returns 14 days unpaginated, and every filter and count is client-side, so stacking tags and counting them on the client is correct. Tags come back on every news item, and forum posts carry none. Top means `editorialRank` 1–3.
- **The prototype's signed-in page** is `prototypes/entries/home-v2/WeekFeed.tsx`, together with `DealsRail.tsx`, `TeamsToFollowRail.tsx` and `HomeV2Prototype.tsx` (rail order, the cut via `fillTo`), and the README "Signed in" notes. The cards there come from `newsfeed-v0` (`V0FeedCard`, `ForumPostCard`, `TopicTags`). Production has its own `ForumPostCard` and `NewsCard`.
- **Deals.** `useDealsAccess` answers access. `services/deals/deals.service.ts` lists every active deal, newest first. `DEAL_ICONS` holds the vendor marks. `offerValue` arrives with [LAB-3071](https://linear.app/protocollabs/issue/LAB-3071).
- **The rail.** Teams to follow (`useSuggestedTeamsToFollow`) and `PopularThisWeekCard` already exist. The roles and events sections come from [LAB-3072](https://linear.app/protocollabs/issue/LAB-3072).

## Goals / Non-Goals

**Goals:**

- The prototype's signed-in page, ported verbatim, behind `NEXT_PUBLIC_SHOW_HOME_V2`.
- No behaviour change for the old layout with the flag off.
- Keep what production's feed already does well: forum access gating, likes and comments, deep links, For You and the feed analytics.

**Non-Goals:**

- `?view=news` (LAB-3126), open source picks, story images, server-side filtering, and deleting the old layout.

## Decisions

1. **Split TeamNews into a hook and two layouts.**
   - Move the data and state logic out of `TeamNews.tsx` into `useHomeFeed`, with no behaviour change. The old `TeamNews` renders from it unchanged.
   - The new `NetworkUpdates` layout renders the same state in the v2 shape.
   - The existing TeamNews tests must pass untouched after the move, before any v2 code is written.
   - _Rejected: a `variant` prop inside TeamNews. It would add v2 branches to a 1,300-line component that is due for deletion._
   - _Rejected: writing a fresh feed from the prototype. It would drop deep links, like and comment overlays, forum gating and the analytics that production already proves._
2. **The v2 stream.**
   - It is news plus forum posts, merged by recency with the existing `mergeFeedEntries`.
   - Hiring, deals and For You job entries are not injected.
   - There are no focus-area tabs, so the stream acts like production's All tab.
3. **Cards.**
   - News uses production `NewsCard` in the full-body form the prototype shows: the prototype's `V0FeedCard` markup is ported into a `NewsCard` variant, `full`, with the `TopicTags`-style `#tag` links and a Top label.
   - Forum posts use production `ForumPostCard` as is.
   - Before building, diff `V0FeedCard` against `NewsCard` and port only the differences.
4. **Pills.**
   - The row is fixed: forYou, all, top, discussions, FUNDING, LAUNCH, ANNOUNCEMENT.
   - Counts come from the existing category matchers over the in-scope list. A count of 0 hides the pill.
   - `top` is a new category in `matchesTeamNewsCategory`, true for `editorialRank` 1–3.
   - The mobile "Type:" dropdown and Sort by are production's.
5. **Tag scope.**
   - `topicFilter: string` becomes `topicScope: string[]` in the hook.
   - The old layout passes one tag at most, so its behaviour is kept.
   - `newsItemHasAllTags` replaces the single-tag check.
   - "Narrow by" is the top three tags by frequency among the in-scope stories, excluding the selected ones.
   - "Follow" (one tag, news preferences on) adds the tag through the existing News preferences update, with the same mutation as `/settings/news-preferences`.
6. **Search.** `matchesTeamNewsQuery` strips leading `#`s from the query. This is a one-line change that is safe for both layouts.
7. **The cut.**
   - A `ResizeObserver` on the rail sets the stream's `max-height` to the rail's height on screens of 960px and wider, with a CSS mask fade on the last card and `pointer-events: none` on the faded part.
   - Under 960px: three cards plus 140px, which is a fixed rule.
   - "See all news" sits under the fade.
   - This is ported from the prototype's `fillTo` logic.
8. **Rail.**
   - `HomeRail` from LAB-3072 gets the signed-in sections: Teams to follow (production hook, prototype markup), `DealsRail` (ported, `offerValue` pill, rendered only when `useDealsAccess` is true), and `PopularThisWeekCard` (production).
   - The rail is one card with hairlines between sections.
9. **Page data.** The signed-in branch keeps today's server fetches for the feed (groups, For You match, popular items, deep link, digest settings). It drops the Quick Actions access fetch when the flag is on.

## Risks / Trade-offs

- **The hook extraction touches production's feed.** The mitigation is decision 1's rule that the old tests pass before any v2 work, plus a manual check with the flag off on the env.
- **Forum posts carry no tags,** so they leave the stream while a tag is selected, as production does today. The prototype mocks tags on threads. Its "across news and threads" scope isn't possible without forum tags.
- **The cut depends on the rail's height.** If Teams to follow or deals load late, the cut grows. The observer handles that, and the layout shift stays below the fold.
- **The For You pill counts follow production's For You,** not the prototype's mock slice.

## Migration Plan

Behind the same flag as LAB-3072. It ships off on prod. After Polina and Roma sign off on both views, the flag goes on in prod, and a cleanup ticket removes the old layout and Quick Actions. Rollback: turn the flag off.

## Open Questions

- Story images (Polina).
- Whether the For You caption (production's `ForYouHint`, redrawn as a caption in the prototype) ships here. It is in the prototype README, so this change includes it, using production's copy and link.

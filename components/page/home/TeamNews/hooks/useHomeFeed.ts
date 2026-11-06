import { flushSync } from 'react-dom';
import { useCallback, useEffect, useMemo, useRef, useState, type FocusEvent } from 'react';

import type { IFeedForumPost, IFeedForumPostLikeStatus } from '@/types/feed.types';
import type { ForumDigestSettings } from '@/services/forum/hooks/useGetForumDigestSettings';
import type { ITeamNewsGroup, ITeamNewsItem, ITeamNewsPopularItem, TeamCluster } from '@/types/team-news.types';

import {
  useTeamNewsAnalytics,
  type TeamNewsCardClickVia,
  type TeamNewsAnalyticsSource,
  type TeamNewsTagFilterVia,
} from '@/analytics/team-news.analytics';
import { useCurrentUserStore } from '@/services/auth/store';
import { useIsBelowDesktop } from '@/hooks/useIsBelowDesktop';
import { useFollowTeam } from '@/services/follow/hooks/useFollowTeam';
import { useFeedForumTopicLike } from '@/services/feed/hooks/useFeedComments';
import { useTeamNewsImpressions } from '@/services/team-news/hooks/useTeamNewsImpressions';
import { applyViewOverlay } from '@/services/team-news/applyViewOverlay';
import { useTeamNewsUpvoteToggle } from '@/services/team-news/hooks/useTeamNewsUpvoteToggle';
import { useSuggestedTeamsToFollow } from '@/services/follow/hooks/useSuggestedTeamsToFollow';
import { useFeedForumPostLikeToggle } from '@/services/feed/hooks/useFeedForumPostLikeToggle';
import { useFollowAnalytics, type FollowAnalyticsSource } from '@/analytics/follow.analytics';
import type { HomeFeedTagScopeAction } from '@/analytics/home.analytics';
import { FEED_FOR_YOU_FORUM_POST_WINDOW_DAYS } from '@/services/feed/constants';
import { newsItemHasAllTags, newsItemHasTag } from '@/utils/news-tag-chips';
import { setStoredForumPostLike } from '@/utils/forumPostLikeStorage';

import {
  ALL_TAB,
  ALL_CAT,
  CATEGORIES,
  DISCUSSIONS_CAT,
  FOR_YOU_CAT,
  FOR_YOU_CATEGORY,
  SHOW_HIRING_NEWS,
  MAX_FOR_YOU_JOB_ENTRIES,
  DISCUSSIONS_CATEGORY,
  SHOW_POPULAR_THIS_WEEK,
  STREAM_CATEGORIES,
  type TeamNewsCategoryId,
} from '../constants';
import { EVENT_TYPE_LABEL } from '../utils/getEventTypeConfig';
import { type TeamNewsSort, sortTeamNewsClusters, DEFAULT_TEAM_NEWS_SORT } from '../utils/sortTeamNewsClusters';
import { dedupeByUid } from '../utils/dedupeByUid';
import { clusterByTeam } from '../utils/clusterByTeam';
import { getSearchInputEl } from '../utils/getSearchInputEl';
import { injectFeedSignals } from '../utils/injectFeedSignals';
import { applyUpvoteOverlay } from '../utils/applyUpvoteOverlay';
import { resolveForumPostLike } from '../utils/resolveForumPostLike';
import { isOwnForumPost } from '../utils/isOwnForumPost';
import { matchesTeamNewsQuery } from '../utils/matchesTeamNewsQuery';
import { matchesStreamNewsCategory, matchesTeamNewsCategory } from '../utils/matchesTeamNewsCategory';
import { sortAllTabItemsByEventDate } from '../utils/sortAllTabItemsByEventDate';
import { isEditorialRank, selectTopStories, TOP_STORIES_MIN_CORPUS } from '../utils/selectTopStories';
import { selectForYouItems } from '../utils/selectForYouItems';
import { feedEntryKey, mergeFeedEntries } from '../utils/mergeFeedEntries';
import { feedWindowCutoffIso } from '../utils/feedForumPostWindow';
import {
  categoryIncludesForumPosts,
  filterFeedForumPosts,
  selectForYouForumPosts,
} from '../utils/matchesFeedForumPost';
import {
  useFeedModulesViewAnalytics,
  useDelayedHideFollowedSuggestions,
} from '../components/NewsRail/useSuggestionsModule';
import type { TopStorySlot } from '../components/TopStories';

import { useFeedDeals } from './useFeedDeals';
import { useFeedSocial } from './useFeedSocial';
import { useFeedHiring } from './useFeedHiring';
import { useFeedForYouJobs } from './useFeedForYouJobs';
import { useStoryReveal } from './useStoryReveal';
import { useNewsDeepLink } from './useNewsDeepLink';
import { useForumPostDeepLink } from './useForumPostDeepLink';

// Stable empty list for the views a tag filter clears of forum posts (they carry
// no tags), so the memos below don't hand a fresh array to the merge each render.
const NO_FORUM_POSTS: IFeedForumPost[] = [];
// The empty tag scope, one identity for every "no tags" state.
const NO_TAGS: string[] = [];

export interface HomeFeedProps {
  groups: ITeamNewsGroup[];
  /** Teams with no focus-area group; shown on "All" only. */
  allTabExtraItems?: ITeamNewsItem[];
  /** Memberships ∪ follows ∪ matcher teams; empty for guests. Frozen at mount.
   *  With `forYouTags`, memberships ∪ follows only (`resolveForYouMatch`). */
  forYouTeamUids?: string[];
  /** The member's news tags (LAB-3001); For You also keeps stories sharing one.
   *  Undefined = match on `forYouTeamUids` only. Frozen at mount. */
  forYouTags?: string[];
  /** Server-ranked "Popular this week" (GET /v1/team-news/popular), fetched SSR
   * alongside `groups`. Empty → the rail's Popular module hides itself. */
  popularItems?: ITeamNewsPopularItem[];
  pageSize?: number;
  initialDigestSettings?: ForumDigestSettings | null;
  /** Story named by ?news=<uid> that the feed window does not cover, resolved
   *  server-side by uid. Feeds the detail modal only — never the rendered feed,
   *  which must stay the 14-day corpus. Null when there is no deep link, or
   *  when the story is already in `groups`. */
  deepLinkedItem?: ITeamNewsItem | null;
}

/** How a tag scope change came about, for `home-feed-tag-scope-changed` (LAB-3125). */
export type { HomeFeedTagScopeAction };

export interface HomeFeedOptions {
  /**
   * `grouped` (default): the previous Home — focus-area tabs, team clusters, the Top stories band, hiring / deals /
   * For You job entries, a first page of `pageSize`, one tag at most.
   *
   * `stream` (the new Home's Network Updates, LAB-3125): one card per story, news and forum posts only, every entry
   * (the layout cuts the list), no band (Top is a pill), Discussions is forum posts only, a pill whose count drops to 0
   * falls back to All, and tags stack.
   */
  layout?: 'grouped' | 'stream';
  /** Stream only: the scope after a tag change, and how it changed. */
  onTagScopeChange?: (tags: string[], action: HomeFeedTagScopeAction) => void;
  /**
   * Stream only: news, no forum posts (the new Home's news page, `?view=news`, LAB-3126). With no posts, Discussions
   * counts 0 and drops out of the pill row like any empty pill. The page opens on All, as the prototype's grid does.
   */
  newsOnly?: boolean;
}

/** A story as its own card: the stream doesn't group a team's stories. */
const storyCluster = (item: ITeamNewsItem): TeamCluster => ({
  teamUid: item.teamUid,
  teamName: item.teamName,
  teamLogoUrl: item.teamLogoUrl,
  items: [item],
});

/**
 * The Home feed's data and state: tabs, categories, sort, search, the tag filter, forum posts, the upvote / like /
 * follow overlays, the deep-linked story and post, For You, the hiring / deals / For You job entries, Top stories and
 * the feed analytics. Moved out of `TeamNews` unchanged (LAB-3125), so the previous layout and the new Home's
 * `NetworkUpdates` render the same state.
 */
export function useHomeFeed(
  {
    groups,
    allTabExtraItems = [],
    forYouTeamUids = [],
    forYouTags,
    popularItems = [],
    pageSize = 6,
    deepLinkedItem = null,
  }: HomeFeedProps,
  { layout = 'grouped', onTagScopeChange, newsOnly = false }: HomeFeedOptions = {},
) {
  const isStream = layout === 'stream';
  const isNewsOnly = isStream && newsOnly;
  // Stable module functions, so the memos below see one identity per layout.
  const matchesCategory = isStream ? matchesStreamNewsCategory : matchesTeamNewsCategory;
  const [activeTab, setActiveTab] = useState<string>(ALL_TAB);
  const [initialForYouTeamUids] = useState<ReadonlySet<string>>(() => new Set(forYouTeamUids));
  const [initialForYouTags] = useState<ReadonlySet<string> | undefined>(() =>
    forYouTags ? new Set(forYouTags) : undefined,
  );
  const [selectedCategory, setActiveCategory] = useState<TeamNewsCategoryId>(() => {
    if (isNewsOnly) return ALL_CAT;
    const items = sortAllTabItemsByEventDate(dedupeByUid([...groups.flatMap((g) => g.items), ...allTabExtraItems]));
    return selectForYouItems(items, initialForYouTeamUids, initialForYouTags).length > 0 ? FOR_YOU_CAT : ALL_CAT;
  });
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState('');
  // The Home feed's tag scope (LAB-3010), set by clicking a `#tag` on a story.
  // [] = no filter. Exact tag match, not the search box: "ai" in search also
  // finds "maintain", and a click on `#ai` has to return only what's tagged ai.
  // A list since LAB-3125: the new Home stacks tags (a story must carry every
  // one); the previous layout holds one at most.
  const [topicScope, setTopicScope] = useState<string[]>(NO_TAGS);
  const hasTopicScope = topicScope.length > 0;
  const filterBarRef = useRef<HTMLDivElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const desktopFieldRef = useRef<HTMLDivElement>(null);
  const analytics = useTeamNewsAnalytics();
  const followAnalytics = useFollowAnalytics();
  const { mutate: followMutate } = useFollowTeam();
  const { mutate: upvoteMutate } = useTeamNewsUpvoteToggle();
  const { mutate: postLikeMutate } = useFeedForumPostLikeToggle();
  // Read here rather than beside the rail's suggestions, where it used to sit:
  // the For You jobs query below needs it, and that is above the rail.
  const { currentUser } = useCurrentUserStore();
  // One instance for the whole page: holds every rendered card's dedup/queue
  // state, regardless of tab/category remounts below it (see the hook's own
  // unmount-vs-page-load-scoped comments).
  // `viewedUids` is what this page load actually reported as read. Merged into
  // the item lists below so a card shows the view it just caused, instead of the
  // number the page arrived with — the server count moved the moment the card
  // was seen, and until now only a reload revealed it.
  const { recordVisible, viewedUids } = useTeamNewsImpressions();

  // `groups` is an SSR prop, not a React Query cache — there's nothing here for a
  // useArticleLike-style setQueryData patch to act on. Upvote state is tracked the
  // same way follow state already is (see followedTeamUids below): a local overlay,
  // applied via applyUpvoteOverlay in both allItems and itemsForActiveTab, so every
  // item-derived view (tabs, clusters, the detail modal) reads the same merged item.
  // The Popular rail still reads the separate server-ranked popularItems prop and
  // does not reflect the overlay — accepted staleness, tracked separately.
  const [upvoteOverlay, setUpvoteOverlay] = useState<Map<string, { viewerHasUpvoted: boolean; upvoteCount: number }>>(
    () => new Map(),
  );

  // Set by handlePopularItemClick to signal which story a "Popular this week"
  // click should reveal; read by the NewsGroupCard render below to force that
  // card's own truncation open, then cleared right after use (see the handler).
  const [scrollTarget, setScrollTarget] = useState<{ teamUid: string; storyUid: string } | null>(null);
  const revealStory = useStoryReveal();

  const allItems = useMemo(
    () =>
      applyViewOverlay(
        applyUpvoteOverlay(
          sortAllTabItemsByEventDate(dedupeByUid([...groups.flatMap((g) => g.items), ...allTabExtraItems])),
          upvoteOverlay,
        ),
        viewedUids,
      ),
    [groups, allTabExtraItems, upvoteOverlay, viewedUids],
  );

  // Same overlay pipeline as allItems: without it an optimistic Like taken in
  // the modal would leave the count frozen, since this item is not in the array
  // those overlays are applied to.
  const deepLinkedNewsItem = useMemo(
    () =>
      deepLinkedItem ? applyViewOverlay(applyUpvoteOverlay([deepLinkedItem], upvoteOverlay), viewedUids)[0] : null,
    [deepLinkedItem, upvoteOverlay, viewedUids],
  );

  // Derived from `groups` (not allItems) so its identity never churns with the
  // upvote overlay — it feeds the session-stable comment-counts batch.
  const newsUids = useMemo(
    () => dedupeByUid([...groups.flatMap((g) => g.items), ...allTabExtraItems]).map((i) => i.uid),
    [groups, allTabExtraItems],
  );

  // The feed's social layer (forum posts + comment counts), flag- and
  // access-gated in one hook. `forumPosts` undefined ⇒ news-only feed.
  //
  // `forumPosts` is trimmed to the last 14 days (last activity) and is what
  // All / Discussions render and count. For You is a further createdAt L7D cut
  // of this same list — see selectForYouForumPosts.
  //
  // `unwindowedForumPosts` is the same access-gated list with only that trim
  // lifted, and has exactly two consumers — both on the ?post= deep-link path,
  // so a shared link to an older topic still opens.
  const social = useFeedSocial({ newsUids });
  const { hasAccess, deepLinkSettled } = social;
  // The news page holds news only: no posts to list, count or open from `?post=`.
  const forumPosts = isNewsOnly ? undefined : social.forumPosts;
  const unwindowedForumPosts = isNewsOnly ? undefined : social.unwindowedForumPosts;

  // Optimistic like state for forum posts — the exact upvoteOverlay pattern:
  // a render-time overlay the buttons read, never written to the query cache,
  // so the session-frozen post ordering can't reorder mid-session.
  const [postLikeOverlay, setPostLikeOverlay] = useState<Map<string, IFeedForumPostLikeStatus>>(() => new Map());

  const [followedTeamUids, setFollowedTeamUids] = useState<Set<string>>(
    () => new Set(allItems.filter((i) => i.isFollowed).map((i) => i.teamUid)),
  );

  // Mount-time snapshot of the followed set, used only by sortedClusters below:
  // follow/unfollow flips buttons immediately (via the live set above) but must
  // not reorder the feed mid-session — the new order applies on the next page
  // load, when this reseeds from fresh SSR data. Setter-less useState so the
  // snapshot is captured during render (first paint is already sorted) and its
  // identity never changes; the copy severs aliasing with the live set.
  const [initialFollowedTeamUids] = useState<ReadonlySet<string>>(() => new Set(followedTeamUids));

  // Same freeze for upvotes: captured while upvoteOverlay is still empty (its initial
  // state), so these are the server-rendered counts. Drives sorting only — the live
  // overlay keeps driving the buttons — so an optimistic upvote can never reorder the
  // feed mid-session; the new ranking applies on the next page load. Seeded from
  // allItems (not the active tab) so every tab's clusters rank consistently.
  const [initialUpvoteCounts] = useState<ReadonlyMap<string, number>>(
    () => new Map(allItems.map((i) => [i.uid, i.upvoteCount ?? 0])),
  );

  const [sort, setSort] = useState<TeamNewsSort>(DEFAULT_TEAM_NEWS_SORT);

  // Both are client-side and non-blocking: the feed renders without them and
  // the cards pop in, the same arrival forum posts already have. `undefined`
  // (not loaded / no deals access / request failed) leaves the feed untouched.
  // The stream injects neither (roles and deals are in its rail), so it doesn't fetch them.
  const { hiring: feedHiring } = useFeedHiring(!isStream);
  const { deals: feedDeals } = useFeedDeals(!isStream);

  // The tag filter narrows the stories every tab, pill and count below is built
  // from, so the tab and pill counts describe the cards under them. `allItems`
  // itself stays whole: the deep link, Popular and the For You pill read it.
  const feedItems = useMemo(
    () => (hasTopicScope ? allItems.filter((i) => newsItemHasAllTags(i, topicScope)) : allItems),
    [allItems, hasTopicScope, topicScope],
  );
  const feedGroups = useMemo(() => {
    if (!hasTopicScope) return groups;
    return groups
      .map((g) => {
        const items = g.items.filter((i) => newsItemHasAllTags(i, topicScope));
        return { ...g, items, total: items.length };
      })
      .filter((g) => g.items.length > 0);
  }, [groups, hasTopicScope, topicScope]);

  const itemsForActiveTab = useMemo(() => {
    if (activeTab === ALL_TAB) return feedItems;
    const group = feedGroups.find((g) => g.focusArea.title === activeTab);
    return applyViewOverlay(applyUpvoteOverlay(group?.items ?? [], upvoteOverlay), viewedUids);
  }, [activeTab, feedItems, feedGroups, upvoteOverlay, viewedUids]);

  const forYouItemsForActiveTab = useMemo(
    () => selectForYouItems(itemsForActiveTab, initialForYouTeamUids, initialForYouTags),
    [itemsForActiveTab, initialForYouTeamUids, initialForYouTags],
  );

  const hasForYouNews = useMemo(
    () => selectForYouItems(allItems, initialForYouTeamUids, initialForYouTags).length > 0,
    [allItems, initialForYouTeamUids, initialForYouTags],
  );

  // Jobs matched to this member — the whole match (two-week window,
  // skills/role/experience signal, ranking) is the server's; see
  // `useFeedForYouJobs`. Fetched whenever the For You pill exists for a signed-in
  // member rather than on the click: the pill's own count includes these, so
  // deferring the request would show a number that then jumped.
  const { forYouJobs } = useFeedForYouJobs(!isStream && Boolean(currentUser?.uid) && hasForYouNews, currentUser?.uid);

  /**
   * The roll-ups For You actually shows, pre-sliced to `MAX_FOR_YOU_JOB_ENTRIES`.
   *
   * Pre-slicing HERE is what preserves the server's ranking: `injectFeedSignals`
   * re-sorts what it is handed, so cutting there would pick a different set of
   * teams than the one the matcher ranked. The same cap goes to
   * `injectFeedSignals` as `maxHiring` so the two cannot disagree.
   *
   * All tab only. A focus-area tab is a cut of the news corpus BY focus area and
   * a job carries none of its own, so filtering these by tab would mean
   * inventing one — they simply don't appear there.
   */
  const forYouJobEntries = useMemo(
    () =>
      !isStream && activeTab === ALL_TAB && !hasTopicScope ? forYouJobs?.slice(0, MAX_FOR_YOU_JOB_ENTRIES) : undefined,
    [isStream, activeTab, forYouJobs, hasTopicScope],
  );

  // Forum posts joining the current tab (All / Discussions use this 14-day
  // activity list; For You is a further createdAt L7D cut below). Memoized so
  // its array identity can't re-run the merge on unrelated renders (e.g. upvote
  // overlay writes).
  // A tag filter leaves forum posts out of every view: they carry no tags.
  const tabForumPosts = useMemo(
    () =>
      hasTopicScope
        ? NO_FORUM_POSTS
        : filterFeedForumPosts(forumPosts, { tab: activeTab, category: ALL_CAT, query: '' }),
    [forumPosts, activeTab, hasTopicScope],
  );

  // Frozen once per session, same reason useFeedSocial freezes the 14-day
  // cutoff: a clock re-read each render would creep forward and drop a post
  // out from under someone mid-read.
  const [forYouForumCutoffIso] = useState(() => feedWindowCutoffIso(FEED_FOR_YOU_FORUM_POST_WINDOW_DAYS, Date.now()));

  const forYouForumPosts = useMemo(
    () =>
      hasTopicScope
        ? NO_FORUM_POSTS
        : selectForYouForumPosts(forumPosts, forYouForumCutoffIso, { tab: activeTab, query: '' }),
    [forumPosts, forYouForumCutoffIso, activeTab, hasTopicScope],
  );

  // The news page's pill counts follow its search, as the prototype's grid does (LAB-3126). Every other layout counts
  // the window, whatever the search.
  const countQuery = isNewsOnly ? query.trim().toLowerCase() : '';
  const countItems = useMemo(
    () => (countQuery ? itemsForActiveTab.filter((i) => matchesTeamNewsQuery(i, countQuery)) : itemsForActiveTab),
    [itemsForActiveTab, countQuery],
  );
  const countForYouItems = useMemo(
    () =>
      countQuery ? forYouItemsForActiveTab.filter((i) => matchesTeamNewsQuery(i, countQuery)) : forYouItemsForActiveTab,
    [forYouItemsForActiveTab, countQuery],
  );

  // One definition of "how many does this pill have", used both to render the
  // pills and to report the count on click — two copies of this drifted apart
  // once already.
  const countForCategory = useCallback(
    (id: TeamNewsCategoryId) => {
      if (id === FOR_YOU_CAT)
        return countForYouItems.length + forYouForumPosts.length + (forYouJobEntries?.length ?? 0);
      const newsCount = id === ALL_CAT ? countItems.length : countItems.filter((i) => matchesCategory(i, id)).length;
      // Forum posts show under All, Discussions, and For You. For You has its
      // own L7D list; All / Discussions share tabForumPosts.
      return newsCount + (categoryIncludesForumPosts(id) ? tabForumPosts.length : 0);
    },
    [countItems, tabForumPosts, countForYouItems, forYouForumPosts, forYouJobEntries, matchesCategory],
  );

  // The stream's fixed pill row (LAB-3125) with its counts. A pill whose count is 0 is left out, not greyed — All
  // always stays. Without forum access there are no posts, so no Discussions.
  const streamCategories = useMemo(
    () =>
      STREAM_CATEGORIES.map((c) => ({ ...c, count: countForCategory(c.id) })).filter(
        (c) => c.id === ALL_CAT || c.count > 0,
      ),
    [countForCategory],
  );

  // The category the feed is cut by. On the stream, a pill that drops out (a tag scope emptied it) shows All, so the
  // feed never sits under a pill that isn't there.
  const activeCategory: TeamNewsCategoryId =
    isStream && selectedCategory !== ALL_CAT && !streamCategories.some((c) => c.id === selectedCategory)
      ? ALL_CAT
      : selectedCategory;

  const categoriesWithCounts = useMemo(() => {
    const base = CATEGORIES.reduce<Array<{ id: TeamNewsCategoryId; label: string; count: number }>>((acc, c) => {
      if (c.label === EVENT_TYPE_LABEL.HIRING) {
        if (SHOW_HIRING_NEWS) {
          acc.push({ ...c, count: countForCategory(c.id) });
        }
      } else {
        acc.push({ ...c, count: countForCategory(c.id) });
      }

      return acc;
    }, []);

    const discussionsCount = countForCategory(DISCUSSIONS_CAT);
    const forYouCount = countForCategory(FOR_YOU_CAT);

    const withForYou: Array<{ id: TeamNewsCategoryId; label: string; count: number }> = hasForYouNews
      ? [{ ...FOR_YOU_CATEGORY, count: forYouCount }, ...base]
      : base;

    // Nothing to filter to ⇒ no pill, the same rule every other pill follows.
    if (discussionsCount === 0) {
      return withForYou;
    }

    const withDiscussions: Array<{ id: TeamNewsCategoryId; label: string; count: number }> = [];
    for (const c of withForYou) {
      withDiscussions.push(c);
      if (c.id === ALL_CAT) {
        withDiscussions.push({ ...DISCUSSIONS_CATEGORY, count: discussionsCount });
      }
    }
    return withDiscussions;
  }, [countForCategory, hasForYouNews]);

  /**
   * The same list the pills render, shaped for the mobile "Type:" dropdown.
   *
   * Counts fold into the label because `SortDropdown` options are plain text —
   * there's no separate count slot the way the pill has its own `<span>`.
   * Empty categories are DROPPED rather than shown disabled: `SortDropdown`
   * has no disabled state today, and a menu listing choices you can't pick is
   * worse than a pill row where they're visibly greyed. A category with
   * nothing in the current window just doesn't appear, matching the pill
   * row's `isDisabled` rule in spirit (nothing to filter to ⇒ not offered).
   */
  const categoryOptions = useMemo(
    () =>
      categoriesWithCounts
        .filter((c) => c.id === ALL_CAT || c.id === FOR_YOU_CAT || c.count > 0)
        .map((c) => ({ value: c.id, label: c.id === ALL_CAT ? c.label : `${c.label} (${c.count})` })),
    [categoriesWithCounts],
  );

  const filteredItems = useMemo(() => {
    if (activeCategory === FOR_YOU_CAT) return forYouItemsForActiveTab;
    if (activeCategory === ALL_CAT) return itemsForActiveTab;
    return itemsForActiveTab.filter((i) => matchesCategory(i, activeCategory));
  }, [activeCategory, itemsForActiveTab, forYouItemsForActiveTab, matchesCategory]);

  // Narrows filteredItems by team name, story title, summary, or tags —
  // combines with (doesn't replace) the active tab/category filter.
  const searchedItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return filteredItems;
    return filteredItems.filter((i) => matchesTeamNewsQuery(i, q));
  }, [filteredItems, query]);

  // The band is network-wide, so ranking it inside a focus area or an event-type
  // pill would make "Top stories" mean something different on every filter.
  // For You is a resting view (the landing one), not a cut of the week — it
  // gets the same three editorial picks as All categories.
  //
  // Hiring/deals still gate on `isNarrowedView` (All only). Those are mixed-feed
  // signals, and this flag used to drive both; splitting them is what lets the
  // band sit on For You without dragging hiring and deals into that slice.
  const isRestingCategory = activeCategory === ALL_CAT || activeCategory === FOR_YOU_CAT;
  // A tag filter is a narrowed view too: no hiring roll-ups or deals (they carry no tags).
  const isNarrowedView = activeTab !== ALL_TAB || activeCategory !== ALL_CAT || Boolean(query.trim()) || hasTopicScope;
  // For You is a narrowed view by the flag above, but it is the one narrowed view
  // that carries signals of its own — personalized ones. Searching inside it
  // narrows again, and drops them like every other search does.
  const isForYouStream = activeCategory === FOR_YOU_CAT && !query.trim() && !hasTopicScope;
  // Hidden under a tag filter: the band's picks are network-wide and would sit
  // above a feed they don't belong to.
  // The stream has no band: its top stories stay where they stand, labelled, and the Top pill lists them.
  const showTopStoriesBand = !isStream && activeTab === ALL_TAB && isRestingCategory && !query.trim() && !hasTopicScope;

  // Ranked from editorialRank (LLM Top Stories picks), rendered from the live
  // overlay. Independent of upvote counts so the band stays distinct from
  // Popular this week. The band exists to sit above a feed, so it only appears
  // once the window can supply both it and a full first page (TOP_STORIES_MIN_CORPUS).
  const topStories = useMemo(
    () => (showTopStoriesBand ? selectTopStories(allItems, TOP_STORIES_MIN_CORPUS) : null),
    [showTopStoriesBand, allItems],
  );
  const hasTopStories = Boolean(topStories?.lead);

  // Excluded BEFORE clusterByTeam: pulling items out of already-built clusters
  // would leave one with a hole, or leave an empty card behind. A team whose
  // only story is in the band simply produces no cluster.
  const streamItems = useMemo(
    () => (topStories && hasTopStories ? searchedItems.filter((i) => !topStories.uids.has(i.uid)) : searchedItems),
    [searchedItems, topStories, hasTopStories],
  );

  const clusters = useMemo(
    () => (isStream ? streamItems.map(storyCluster) : clusterByTeam(streamItems)),
    [isStream, streamItems],
  );

  const sortedClusters = useMemo(
    () => sortTeamNewsClusters(clusters, sort, initialFollowedTeamUids, initialUpvoteCounts),
    [clusters, sort, initialFollowedTeamUids, initialUpvoteCounts],
  );

  // Forum posts under the CURRENT filters (category + search). For You uses
  // the posted-this-week cut; every other pill uses the 14-day activity list.
  const visibleForumPosts = useMemo(() => {
    if (hasTopicScope) return NO_FORUM_POSTS;
    return activeCategory === FOR_YOU_CAT
      ? selectForYouForumPosts(forumPosts, forYouForumCutoffIso, { tab: activeTab, query })
      : filterFeedForumPosts(forumPosts, { tab: activeTab, category: activeCategory, query });
  }, [forumPosts, activeTab, activeCategory, query, forYouForumCutoffIso, hasTopicScope]);

  // The unified feed: forum posts interleaved into the sorted clusters. The
  // merge DELEGATES to sortedClusters' order (news-vs-news order stays
  // byte-identical to the pre-feature feed) and ranks posts by their frozen
  // query-data likeCount — the live postLikeOverlay is applied at render only,
  // so likes never reorder anything.
  const rankedEntries = useMemo(
    () =>
      mergeFeedEntries({
        sortedClusters,
        forumPosts: visibleForumPosts,
        sort,
        followedTeamUids: initialFollowedTeamUids,
        upvoteCounts: initialUpvoteCounts,
      }),
    [sortedClusters, visibleForumPosts, sort, initialFollowedTeamUids, initialUpvoteCounts],
  );

  // Hiring roll-ups and deals are slotted in AFTER the ranked merge, never
  // through it: they carry no popularity signal, so ranking them would mean
  // inventing one — and under 'popular' (the default) an honest zero would sink
  // them past pageSize forever. See injectFeedSignals for the full rationale.
  //
  // Both are unfiltered by tab/category/search on purpose: neither carries a
  // focus area or an event type, so every narrowed view drops them — For You
  // excepted, which brings roll-ups of its own. That falls out of
  // `isForYouStream` / `isNarrowedView` rather than being re-derived per stream.
  // SHOW_HIRING_NEWS gates the INJECTION, not the render. Gating only the card
  // (as #2775 did) still let the entry into `entries`, where it silently ate a
  // `pageSize` slot — a first page of six showed five — and shifted the
  // analytics `position` of every card after it. `undefined` is the same "leave
  // the feed alone" signal a failed request already sends.
  const entries = useMemo(() => {
    // The stream is news and forum posts only: roles and deals are in its rail.
    if (isStream) return rankedEntries;
    // For You gets the PERSONALIZED roll-ups and no deals: a perk is network-wide,
    // so it belongs to the resting view rather than to a slice built about one
    // member. `SHOW_HIRING_NEWS` is not consulted — it gates the unpersonalized
    // roll-ups on All, which is a different question from this one.
    if (isForYouStream) {
      return injectFeedSignals({
        entries: rankedEntries,
        hiring: forYouJobEntries,
        deals: undefined,
        maxHiring: MAX_FOR_YOU_JOB_ENTRIES,
      });
    }
    return isNarrowedView
      ? rankedEntries
      : injectFeedSignals({
          entries: rankedEntries,
          hiring: SHOW_HIRING_NEWS ? feedHiring : undefined,
          deals: feedDeals,
        });
  }, [isStream, rankedEntries, isForYouStream, forYouJobEntries, isNarrowedView, feedHiring, feedDeals]);

  // The stream renders every entry: its layout cuts the list where the rail ends.
  const visibleEntries = isStream || expanded ? entries : entries.slice(0, pageSize);

  // A news card's index in the rendered entries: the team's cluster on the grouped feed, the story's own card on the
  // stream (where a team has one card per story).
  const newsEntryIndex = (item: ITeamNewsItem) =>
    isStream
      ? visibleEntries.findIndex((e) => e.kind === 'news' && e.cluster.items[0]?.uid === item.uid)
      : visibleEntries.findIndex((e) => e.kind === 'news' && e.cluster.teamUid === item.teamUid);
  const newCount = allItems.length + (forumPosts?.length ?? 0);

  // Band is editorialRank; rail is upvotes — they should already diverge, but
  // still drop any accidental overlap so the same story isn't shown twice.
  // The stream keeps the same rule without a band (prototype): its top stories are labelled in the stream, so Popular
  // leaves them out.
  const railPopularItems = useMemo(() => {
    if (isStream) {
      const topUids = new Set(allItems.filter((i) => isEditorialRank(i.editorialRank)).map((i) => i.uid));
      return topUids.size > 0 ? popularItems.filter((p) => !topUids.has(p.uid)) : popularItems;
    }
    return topStories && hasTopStories ? popularItems.filter((p) => !topStories.uids.has(p.uid)) : popularItems;
  }, [isStream, allItems, popularItems, topStories, hasTopStories]);

  // ?news=<uid> ↔ detail-modal sync (declared after the allItems memo — the
  // validator closes over it). All URL writes are history.replaceState; see
  // the hook for why router.replace is the wrong tool here.
  const isValidNewsUid = useCallback(
    (uid: string) => allItems.some((i) => i.uid === uid) || deepLinkedNewsItem?.uid === uid,
    [allItems, deepLinkedNewsItem],
  );
  const { activeNewsUid, openNews, closeNews, openedViaDeepLink } = useNewsDeepLink({ isValidUid: isValidNewsUid });

  // Resolved fresh each render from overlay-merged allItems so the modal's Like
  // count can never disagree with the rows; null lookup (an item expired away)
  // renders nothing rather than a stale copy. Guarded — closed-modal renders
  // skip the scan; deliberately not memoized (O(hundreds), single-digit µs).
  const activeNewsItem = activeNewsUid
    ? (allItems.find((i) => i.uid === activeNewsUid) ??
      (deepLinkedNewsItem?.uid === activeNewsUid ? deepLinkedNewsItem : null))
    : null;

  // Deep-link opens have no click to ride on — report them once. Ref-guarded
  // effect with no dependency array, per this file's latest-ref idiom.
  const deepLinkTrackedRef = useRef(false);
  useEffect(() => {
    if (deepLinkTrackedRef.current || !openedViaDeepLink || !activeNewsItem) return;
    deepLinkTrackedRef.current = true;
    analytics.onTeamNewsDetailModalOpened(activeNewsItem);
  });

  // ?post=<uid> ↔ forum-post-modal sync. Unlike ?news=, this resolves
  // asynchronously (hydration → access → posts) — the hook holds the param
  // while pending and strips it silently once settled-invalid. Deep-link
  // analytics ride the resolver's single 'valid' transition.
  // Resolves against the UNWINDOWED list on purpose: a link someone shared
  // three weeks ago should still open the thread it points at, even though that
  // thread no longer earns a slot in the feed.
  const { activePostUid, openPost, closePost } = useForumPostDeepLink({
    posts: unwindowedForumPosts,
    isSettled: deepLinkSettled,
    onDeepLinkOpen: (post) => analytics.onFeedForumPostModalOpened(post),
  });

  // Resolved fresh each render with the like overlay merged (same contract as
  // activeNewsItem: modal and row can never disagree). The post list going
  // undefined — e.g. mid-session access revocation, which empties both the
  // windowed and unwindowed arrays — nulls this out and the modal unmounts;
  // the effect below also strips the URL param.
  // A forum card can't know whether the viewer already liked the post: the
  // /api/recent listing it's built from has no per-viewer vote state, so
  // `viewerHasLiked` is false by default and a "like" on something already liked
  // would send a vote NodeBB ignores while the local count climbed. Opening the
  // thread fetches the topic, which does know — resolved at render time, under
  // the viewer's own toggle. Because the resolved value is what feeds
  // handleForumPostLikeToggle, the correction lands in the overlay on first use
  // and outlives the modal.
  const activePostTopicLike = useFeedForumTopicLike(activePostUid);

  // Persists the topic's correction to the local like cache the moment it's
  // learned, so it also benefits this card on a future reload/session — not
  // just the modal's own render (which resolvePostLike already covers).
  useEffect(() => {
    if (!activePostUid || !activePostTopicLike) return;
    setStoredForumPostLike(activePostUid, activePostTopicLike.viewerHasLiked);
  }, [activePostUid, activePostTopicLike]);

  const resolvePostLike = useCallback(
    (post: IFeedForumPost) =>
      resolveForumPostLike(
        post,
        post.uid === activePostUid ? activePostTopicLike : undefined,
        postLikeOverlay.get(post.uid),
      ),
    [activePostUid, activePostTopicLike, postLikeOverlay],
  );

  // Unwindowed for the same reason as the resolver above — and it must match
  // it: this is what the modal actually renders, so resolving from the windowed
  // list would let a valid deep link open an empty modal.
  const activeForumPost = useMemo(() => {
    if (!activePostUid) return null;
    const post = unwindowedForumPosts?.find((p) => p.uid === activePostUid);
    return post ? resolvePostLike(post) : null;
  }, [activePostUid, unwindowedForumPosts, resolvePostLike]);

  useEffect(() => {
    if (activePostUid && !hasAccess) closePost();
  }, [activePostUid, hasAccess, closePost]);

  const { suggestions: suggestedTeams, isLoading: isLoadingSuggestedTeams } = useSuggestedTeamsToFollow({
    currentUserUid: currentUser?.uid ?? null,
  });

  // Below 1200px the grid drops the rail's column and the sidebar stacks under
  // the whole feed, which buries Teams-to-follow and Popular about three screens
  // down. They lift into horizontal rows just under the top-stories band
  // instead. A JS switch rather than CSS show/hide: NewsRail animates its cards
  // through AnimatePresence, so a hidden second copy would still mount a motion
  // tree — and would double-count the view events below.
  const isBelowDesktop = useIsBelowDesktop();

  // Owned here, not in NewsRail, because both surfaces need the same list AND
  // the same delayed-hide-after-follow confirm — computing it twice would let
  // the two drift.
  const visibleSuggestions = useDelayedHideFollowedSuggestions(suggestedTeams, followedTeamUids);

  const showSuggestionsModule = isLoadingSuggestedTeams || visibleSuggestions.length > 0;

  // Fired from the parent, which mounts exactly one surface, so the count is one
  // per session at either width.
  useFeedModulesViewAnalytics({
    suggestionsShown: showSuggestionsModule && !isLoadingSuggestedTeams ? visibleSuggestions.length : 0,
    isLoadingSuggestedTeams,
    popularCount: SHOW_POPULAR_THIS_WEEK ? railPopularItems.length : 0,
  });

  const handleTab = (id: string) => {
    const nextItems = id === ALL_TAB ? allItems : (groups.find((g) => g.focusArea.title === id)?.items ?? []);
    analytics.onTeamNewsTabClicked(id, nextItems.length);
    setActiveTab(id);
    if (activeCategory !== FOR_YOU_CAT) {
      setActiveCategory(ALL_CAT);
    }
    setExpanded(false);
  };

  const handleCategory = (id: TeamNewsCategoryId) => {
    analytics.onTeamNewsCategoryClicked(String(id), countForCategory(id), activeTab);
    setActiveCategory(id);
    setExpanded(false);
  };

  const handleSort = (value: string) => {
    analytics.onTeamNewsSortChanged(value, sort, clusters.length);
    setSort(value as TeamNewsSort);
    setExpanded(false);
  };

  const handleToggleAll = () => {
    analytics.onTeamNewsLoadMoreClicked(visibleEntries.length, entries.length, 'home', {
      currentTab: activeTab,
      currentCategory: String(activeCategory),
    });
    setExpanded((v) => !v);
  };

  // Single owner of a row click's consequences: analytics (card-clicked with
  // outcome 'modal', derived in the analytics module) + modal state + URL.
  // Positions are entry-list indices now that forum posts interleave.
  const handleStoryOpen = (item: ITeamNewsItem, via: TeamNewsCardClickVia = 'row') => {
    const position = newsEntryIndex(item);
    analytics.onTeamNewsCardClicked(item, position >= 0 ? position : 0, 'home', via);
    // One modal, one URL param at a time — closing the other side first keeps
    // ?news= and ?post= mutually exclusive (both writes are synchronous).
    if (activePostUid) closePost();
    openNews(item.uid);
  };

  // Top-stories counterpart of handleStoryOpen. Its own event, not
  // onTeamNewsCardClicked: band items aren't in `visibleEntries`, so that
  // handler's position lookup would report -1 for every one of them, and the
  // lead's pull can't be told from a runner-up's without `slot`.
  const handleTopStoryOpen = (item: ITeamNewsItem, slot: TopStorySlot, position: number) => {
    analytics.onTopStoryClicked(item, slot, position);
    if (activePostUid) closePost();
    openNews(item.uid);
  };

  // A `#tag` click (LAB-3010). It opens the tag whole — back to the All tab and
  // All categories — because `#storage` asks "what's tagged storage", not "what's
  // tagged storage within the pill I happened to be on". Clicking the active tag
  // again clears it. From the modal, the modal closes first: the filtered feed
  // is what the reader asked to see.
  const handleTagSelect = (tag: string, via: TeamNewsTagFilterVia) => {
    if (via === 'modal') closeNews();
    setExpanded(false);
    if (topicScope.length === 1 && tag === topicScope[0]) {
      analytics.onTeamNewsTagFilterCleared({ tag, via });
      setTopicScope(NO_TAGS);
      return;
    }
    analytics.onTeamNewsTagFilterApplied({
      tag,
      via,
      itemCount: allItems.filter((i) => newsItemHasTag(i, tag)).length,
    });
    setTopicScope([tag]);
    setActiveTab(ALL_TAB);
    setActiveCategory(ALL_CAT);
  };

  // The stream's tags stack (LAB-3125): a click adds the tag to the scope, a click on a selected one removes it, and a
  // story must carry every tag in it. The pill stays where it is: a tag added from a card on screen keeps that card.
  const changeTopicScope = (next: string[], action: HomeFeedTagScopeAction) => {
    setTopicScope(next.length > 0 ? next : NO_TAGS);
    setExpanded(false);
    onTagScopeChange?.(next, action);
  };

  const handleScopeTagToggle = (tag: string, via: TeamNewsTagFilterVia) => {
    if (via === 'modal') closeNews();
    if (topicScope.includes(tag)) {
      analytics.onTeamNewsTagFilterCleared({ tag, via });
      changeTopicScope(
        topicScope.filter((t) => t !== tag),
        'remove',
      );
      return;
    }
    const next = [...topicScope, tag];
    analytics.onTeamNewsTagFilterApplied({
      tag,
      via,
      itemCount: allItems.filter((i) => newsItemHasAllTags(i, next)).length,
    });
    changeTopicScope(next, 'add');
  };

  /** A chip's ×. */
  const handleScopeTagRemove = (tag: string) => {
    analytics.onTeamNewsTagFilterCleared({ tag, via: 'chip' });
    changeTopicScope(
      topicScope.filter((t) => t !== tag),
      'remove',
    );
  };

  /** "Clear all". */
  const handleScopeClear = () => {
    topicScope.forEach((tag) => analytics.onTeamNewsTagFilterCleared({ tag, via: 'chip' }));
    changeTopicScope([], 'clear');
  };

  /** A "Narrow by" suggestion. */
  const handleScopeNarrow = (tag: string) => {
    if (topicScope.includes(tag)) return;
    const next = [...topicScope, tag];
    analytics.onTeamNewsTagFilterApplied({
      tag,
      via: 'card',
      itemCount: allItems.filter((i) => newsItemHasAllTags(i, next)).length,
    });
    changeTopicScope(next, 'narrow');
  };

  const handleTagFilterClear = () => {
    analytics.onTeamNewsTagFilterCleared({ tag: topicScope[0] ?? '', via: 'chip' });
    setTopicScope(NO_TAGS);
    setExpanded(false);
  };

  // A tag is clicked deep in the feed (or in the modal over it); the result is
  // the top of a re-cut feed, so bring the chip that says what happened into view.
  const topicScopeKey = topicScope.join('\n');
  useEffect(() => {
    if (!topicScopeKey) return;
    filterBarRef.current?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
  }, [topicScopeKey]);

  // Forum-post counterpart of handleStoryOpen (card-clicked analytics fire in
  // ForumPostCard, which knows its own position).
  const handleForumPostOpen = (post: IFeedForumPost) => {
    if (activeNewsUid) {
      closeNews();
    }

    openPost(post.uid);
  };

  // "Latest ref" pattern: lets handleSearch read current context synchronously
  // without adding it to handleSearch's dependency array, which must stay
  // empty (see the comment on handleSearch below). Refs are synced in an
  // effect with no dependency array (runs after every render) rather than
  // written during render, per this repo's react-hooks/refs lint rule.
  const filteredItemsRef = useRef(filteredItems);
  const forumPostsRef = useRef(forumPosts);
  const activeTabRef = useRef(activeTab);
  const activeCategoryRef = useRef(activeCategory);
  const analyticsRef = useRef(analytics);
  const forYouForumCutoffIsoRef = useRef(forYouForumCutoffIso);
  const hasTopicScopeRef = useRef(hasTopicScope);
  useEffect(() => {
    filteredItemsRef.current = filteredItems;
    forumPostsRef.current = forumPosts;
    activeTabRef.current = activeTab;
    activeCategoryRef.current = activeCategory;
    analyticsRef.current = analytics;
    forYouForumCutoffIsoRef.current = forYouForumCutoffIso;
    hasTopicScopeRef.current = hasTopicScope;
  });

  // useCallback with empty deps is required here, not just tidy: SearchInput's
  // DebouncedInput recreates its internal debounce instance whenever this
  // function's identity changes, which orphans any in-flight debounce timer
  // rather than cancelling it — a stale timer can then overwrite text the
  // user typed after an unrelated re-render (e.g. clicking Follow). This is
  // also why resultCount/activeTab/activeCategory/analytics are read via the
  // refs above rather than added here as dependencies.
  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    setExpanded(false); // matches handleTab/handleCategory's reset-on-filter-change convention

    const trimmed = value.trim();
    if (!trimmed) return; // clearing a search isn't a search event
    const q = trimmed.toLowerCase();
    // Same definition of "matches" as the rendered entries: news narrowed by
    // the query + forum posts under the current tab/category filters.
    const category = activeCategoryRef.current;
    // A tag filter shows no forum posts, so none of them count as results.
    const forumMatches = hasTopicScopeRef.current
      ? NO_FORUM_POSTS
      : category === FOR_YOU_CAT
        ? selectForYouForumPosts(forumPostsRef.current, forYouForumCutoffIsoRef.current, {
            tab: activeTabRef.current,
            query: trimmed,
          })
        : filterFeedForumPosts(forumPostsRef.current, {
            tab: activeTabRef.current,
            category,
            query: trimmed,
          });
    const resultCount = filteredItemsRef.current.filter((i) => matchesTeamNewsQuery(i, q)).length + forumMatches.length;
    const truncatedSearchValue = value.length > 100 ? value.slice(0, 100) : value;
    analyticsRef.current.onTeamNewsSearch(
      truncatedSearchValue,
      resultCount,
      activeTabRef.current,
      String(activeCategoryRef.current),
    );
  }, []);

  const handleFieldBlur = useCallback((e: FocusEvent<HTMLDivElement>) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    // Reads the live (undebounced) value so the field never collapses while
    // the user is still mid-typing a query that hasn't flushed yet.
    const live = getSearchInputEl(e.currentTarget)?.value ?? '';
    if (!live.trim()) setSearchOpen(false);
  }, []);

  // Focus the field the moment it expands.
  useEffect(() => {
    if (!searchOpen) return;
    getSearchInputEl(desktopFieldRef.current)?.focus();
  }, [searchOpen]);

  const handleFollowToggle = (
    teamUid: string,
    teamName: string,
    isCurrentlyFollowing: boolean,
    source: FollowAnalyticsSource = 'news-feed',
    meta?: { position?: number; reason?: string },
  ) => {
    const action = isCurrentlyFollowing ? 'unfollow' : 'follow';
    setFollowedTeamUids((prev) => {
      const next = new Set(prev);
      isCurrentlyFollowing ? next.delete(teamUid) : next.add(teamUid);
      return next;
    });
    const revert = () => {
      setFollowedTeamUids((prev) => {
        const next = new Set(prev);
        isCurrentlyFollowing ? next.add(teamUid) : next.delete(teamUid);
        return next;
      });
    };
    followMutate(
      { teamUid, action },
      {
        onError: () => {
          revert();
          followAnalytics.onTeamFollowFailed({
            teamUid,
            teamName,
            source,
            action,
          });
        },
        onSuccess: (data) => {
          // followTeam/unfollowTeam return null on non-OK responses instead of
          // throwing, so onError only covers network failures — revert on null,
          // matching useTeamFollowToggle and useToggleTeamFollowInList.
          if (!data) {
            revert();
            return;
          }
          if (action === 'follow') {
            followAnalytics.onTeamFollowed({ teamUid, teamName, source, ...meta });
          } else {
            followAnalytics.onTeamUnfollowed({ teamUid, teamName, source });
          }
        },
      },
    );
  };

  // Auth check + login redirect happens in the calling card component (see
  // NewsGroupCard.handleUpvoteClick), matching handleFollowToggle's split below —
  // this handler assumes an authenticated caller.
  // `source` is a parameter, not the constant 'home' it used to be: this
  // handler serves the card AND the detail modal, so hardcoding it made the
  // dimension carry no information at all.
  const handleUpvoteToggle = (item: ITeamNewsItem, source: TeamNewsAnalyticsSource = 'home') => {
    const wasUpvoted = Boolean(item.viewerHasUpvoted);
    const nextUpvoted = !wasUpvoted;
    const prevCount = item.upvoteCount ?? 0;
    const nextCount = wasUpvoted ? Math.max(0, prevCount - 1) : prevCount + 1;

    setUpvoteOverlay((prev) => {
      const next = new Map(prev);
      next.set(item.uid, { viewerHasUpvoted: nextUpvoted, upvoteCount: nextCount });
      return next;
    });

    // -1, not 0: a deep-linked modal item isn't in visibleEntries at all, and
    // reporting it as position 0 makes it indistinguishable from the top card.
    const position = newsEntryIndex(item);

    upvoteMutate(
      { uid: item.uid, isUpvoted: nextUpvoted },
      {
        onError: () => {
          setUpvoteOverlay((prev) => {
            const next = new Map(prev);
            next.set(item.uid, { viewerHasUpvoted: wasUpvoted, upvoteCount: prevCount });
            return next;
          });
          analytics.onTeamNewsUpvoteFailed(item, position, nextUpvoted, source);
        },
        onSuccess: (status) => {
          // Reconcile the optimistic overlay with the server's authoritative
          // count/state (e.g. concurrent votes from others), when available.
          if (status) {
            setUpvoteOverlay((prev) => {
              const next = new Map(prev);
              next.set(item.uid, { viewerHasUpvoted: status.viewerHasUpvoted, upvoteCount: status.upvoteCount });
              return next;
            });
          }
          analytics.onTeamNewsUpvoteToggled(item, position, nextUpvoted, source);
        },
      },
    );
  };

  // Forum-post Like — handleUpvoteToggle's exact shape (optimistic overlay,
  // rollback on error, reconcile with the server's authoritative status). The
  // caller passes the overlay-merged post, so `viewerHasLiked` is current.
  // No signed-out branch: only access-holding (signed-in) viewers see posts.
  const handleForumPostLikeToggle = (post: IFeedForumPost, source: TeamNewsAnalyticsSource = 'home') => {
    // The button is already disabled for your own post, but the identity it's
    // derived from hydrates client-side: for the first paint after a reload
    // there is no currentUser yet and the control is briefly live. Bail rather
    // than send a vote NodeBB will refuse ([[error:self-vote]]) and book a
    // like-FAILED event for something that was never going to work.
    if (isOwnForumPost(post, currentUser?.uid)) return;

    const wasLiked = post.viewerHasLiked;
    const nextLiked = !wasLiked;
    const prevCount = post.likeCount;
    const nextCount = wasLiked ? Math.max(0, prevCount - 1) : prevCount + 1;

    setPostLikeOverlay((prev) => new Map(prev).set(post.uid, { viewerHasLiked: nextLiked, likeCount: nextCount }));
    setStoredForumPostLike(post.uid, nextLiked);

    const position = visibleEntries.findIndex((e) => feedEntryKey(e) === `forum:${post.uid}`);

    postLikeMutate(
      { post, isLiked: nextLiked },
      {
        onError: () => {
          setPostLikeOverlay((prev) => new Map(prev).set(post.uid, { viewerHasLiked: wasLiked, likeCount: prevCount }));
          setStoredForumPostLike(post.uid, wasLiked);
          analytics.onFeedForumPostLikeFailed(post, position, nextLiked, source);
        },
        onSuccess: (status) => {
          if (status) {
            setPostLikeOverlay((prev) => new Map(prev).set(post.uid, status));
            setStoredForumPostLike(post.uid, status.viewerHasLiked);
          }
          analytics.onFeedForumPostLikeToggled(post, position, nextLiked, source);
        },
      },
    );
  };

  const handlePopularItemClick = (item: ITeamNewsPopularItem, position: number) => {
    analytics.onTeamNewsPopularStoryClicked(item, position); // unchanged — fires regardless of outcome below

    const fullItem = allItems.find((i) => i.uid === item.uid);
    if (!fullItem) {
      // Expired/removed from the 14-day window since Popular was ranked server-side.
      // Nothing to scroll to — fall back to the old behavior instead of a dead click.
      analytics.onPopularStoryFallbackOpened(item, position);
      window.open(item.sourceUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    // The stream is cut where the rail ends, so it can't promise the story is on screen to scroll to: a row opens the
    // story itself (prototype).
    if (isStream) {
      if (activePostUid) closePost();
      openNews(fullItem.uid);
      return;
    }

    // Reuse the already-memoized itemsForActiveTab rather than recomputing the
    // same ALL_TAB-vs-group lookup inline — accurate here, before any of this
    // handler's own setState calls have applied.
    const tabMismatch = activeTab !== ALL_TAB && !itemsForActiveTab.some((i) => i.uid === fullItem.uid);
    const categoryMismatch =
      activeCategory !== ALL_CAT &&
      (activeCategory === FOR_YOU_CAT
        ? !forYouItemsForActiveTab.some((i) => i.uid === fullItem.uid)
        : !matchesCategory(fullItem, activeCategory));
    const searchMismatch = query.trim() !== '' && !matchesTeamNewsQuery(fullItem, query.trim().toLowerCase());
    const topicMismatch = hasTopicScope && !newsItemHasAllTags(fullItem, topicScope);
    const filtersChanging = tabMismatch || categoryMismatch || searchMismatch || topicMismatch;

    // If filters are already about to reflow substantially, don't also re-derive
    // clusterByTeam for the *new* filters just to check pageSize precisely —
    // force-expanding blends into a view that's changing anyway. Otherwise,
    // entries (in scope, this render — the unified list the pageSize slice
    // actually cuts) already reflects the item's real position, so only expand
    // if it's actually beyond pageSize.
    const shouldExpandOuter =
      filtersChanging ||
      entries.findIndex((e) => e.kind === 'news' && e.cluster.teamUid === fullItem.teamUid) >= pageSize;

    // flushSync forces this batch of state updates — and every layout effect they
    // synchronously trigger in children, including NewsGroupCard's own auto-expand
    // effect — to commit to the DOM before this call returns, so the querySelector
    // right after is safe without polling.
    flushSync(() => {
      if (tabMismatch) setActiveTab(ALL_TAB);
      if (categoryMismatch) setActiveCategory(ALL_CAT);
      if (searchMismatch) setQuery('');
      if (topicMismatch) setTopicScope(NO_TAGS);
      if (shouldExpandOuter) setExpanded(true);
      setScrollTarget({ teamUid: fullItem.teamUid, storyUid: fullItem.uid });
    });

    const selector = `[data-story-uid="${CSS.escape(fullItem.uid)}"]`;
    if (process.env.NODE_ENV !== 'production') {
      const matches = document.querySelectorAll(selector);
      if (matches.length > 1) {
        console.warn(`[TeamNews] data-story-uid matched ${matches.length} elements for uid ${fullItem.uid}`);
      }
    }
    const el = document.querySelector<HTMLElement>(selector);
    setScrollTarget(null); // one-shot signal — clear right after use so a later, unrelated remount can't replay it

    if (el) {
      revealStory(el);
      analytics.onPopularStoryScrollSucceeded(item, position);
    }
    // else: unexpected — flushSync above should guarantee `el` exists. Left
    // unreported on purpose: clicked minus succeeded minus fallback IS this
    // case, so it stays visible without inventing an event for it.
  };

  return {
    allItems,
    forumPosts,
    newCount,
    searchOpen,
    setSearchOpen,
    query,
    handleSearch,
    handleFieldBlur,
    desktopFieldRef,
    filterBarRef,
    feedGroups,
    feedItems,
    activeTab,
    handleTab,
    categoriesWithCounts,
    categoryOptions,
    streamCategories,
    activeCategory,
    handleCategory,
    countForCategory,
    topicScope,
    handleTagSelect,
    handleTagFilterClear,
    handleScopeTagToggle,
    handleScopeTagRemove,
    handleScopeClear,
    handleScopeNarrow,
    searchedItems,
    sort,
    handleSort,
    currentUser,
    topStories,
    followedTeamUids,
    handleFollowToggle,
    handleUpvoteToggle,
    handleTopStoryOpen,
    handleStoryOpen,
    recordVisible,
    isBelowDesktop,
    showSuggestionsModule,
    suggestedTeams,
    visibleSuggestions,
    isLoadingSuggestedTeams,
    railPopularItems,
    hasForumAccess: hasAccess,
    handlePopularItemClick,
    entries,
    visibleEntries,
    pageSize,
    expanded,
    handleToggleAll,
    scrollTarget,
    resolvePostLike,
    handleForumPostOpen,
    handleForumPostLikeToggle,
    analytics,
    activeNewsUid,
    activeNewsItem,
    closeNews,
    activeForumPost,
    closePost,
  };
}

export type HomeFeed = ReturnType<typeof useHomeFeed>;

'use client';

import clsx from 'clsx';
import isEmpty from 'lodash/isEmpty';
import { flushSync } from 'react-dom';
import { useCallback, useEffect, useMemo, useRef, useState, type FocusEvent } from 'react';

import type { IFeedForumPost, IFeedForumPostLikeStatus } from '@/types/feed.types';
import type { ForumDigestSettings } from '@/services/forum/hooks/useGetForumDigestSettings';
import type { ITeamNewsGroup, ITeamNewsItem, ITeamNewsPopularItem } from '@/types/team-news.types';

import {
  useTeamNewsAnalytics,
  type TeamNewsCardClickVia,
  type TeamNewsAnalyticsSource,
} from '@/analytics/team-news.analytics';
import { useCurrentUserStore } from '@/services/auth/store';
import { useIsBelowDesktop } from '@/hooks/useIsBelowDesktop';
import { useFollowTeam } from '@/services/follow/hooks/useFollowTeam';
import { useFeedForumTopicLike } from '@/services/feed/hooks/useFeedComments';
import { useTeamNewsImpressions } from '@/services/team-news/hooks/useTeamNewsImpressions';
import { useTeamNewsUpvoteToggle } from '@/services/team-news/hooks/useTeamNewsUpvoteToggle';
import { useSuggestedTeamsToFollow } from '@/services/follow/hooks/useSuggestedTeamsToFollow';
import { useFeedForumPostLikeToggle } from '@/services/feed/hooks/useFeedForumPostLikeToggle';
import { useFollowAnalytics, type FollowAnalyticsSource } from '@/analytics/follow.analytics';

import { Button } from '@/components/common/Button';
import { SearchInput } from '@/components/common/filters/SearchInput';
import { SortDropdown } from '@/components/common/filters/SortDropdown';

import {
  ALL_TAB,
  ALL_CAT,
  CATEGORIES,
  DISCUSSIONS_CAT,
  SHOW_HIRING_NEWS,
  DISCUSSIONS_CATEGORY,
  SHOW_POPULAR_THIS_WEEK,
  type TeamNewsCategoryId,
  TOP_STORIES_WINDOW_LABEL,
} from './constants';
import { EVENT_TYPE_LABEL } from './utils/getEventTypeConfig';

import {
  SORT_OPTIONS,
  type TeamNewsSort,
  sortTeamNewsClusters,
  DEFAULT_TEAM_NEWS_SORT,
} from './utils/sortTeamNewsClusters';
import { dedupeByUid } from './utils/dedupeByUid';
import { clusterByTeam } from './utils/clusterByTeam';
import { getSearchInputEl } from './utils/getSearchInputEl';
import { injectFeedSignals } from './utils/injectFeedSignals';
import { applyUpvoteOverlay } from './utils/applyUpvoteOverlay';
import { resolveForumPostLike } from './utils/resolveForumPostLike';
import { isOwnForumPost } from './utils/isOwnForumPost';
import { matchesTeamNewsQuery } from './utils/matchesTeamNewsQuery';
import { matchesTeamNewsCategory } from './utils/matchesTeamNewsCategory';
import { sortAllTabItemsByEventDate } from './utils/sortAllTabItemsByEventDate';
import { selectTopStories, TOP_STORIES_MIN_CORPUS } from './utils/selectTopStories';
import { assertNever, feedEntryKey, mergeFeedEntries } from './utils/mergeFeedEntries';
import { categoryIncludesForumPosts, filterFeedForumPosts } from './utils/matchesFeedForumPost';

import {
  useFeedModulesViewAnalytics,
  useDelayedHideFollowedSuggestions,
} from './components/NewsRail/useSuggestionsModule';
import { useFeedDeals } from './hooks/useFeedDeals';
import { useFeedSocial } from './hooks/useFeedSocial';
import { useFeedHiring } from './hooks/useFeedHiring';
import { useStoryReveal } from './hooks/useStoryReveal';
import { useNewsDeepLink } from './hooks/useNewsDeepLink';
import { useForumPostDeepLink } from './hooks/useForumPostDeepLink';

import { NewsBase } from './components/NewsBase';
import { NewsRail } from './components/NewsRail';
import { NewsSearch } from './components/NewsSearch';
import { TeamNewsTabs } from './components/TeamNewsTabs';
import { NewsGroupCard } from './components/NewsGroupCard';
import { ForumPostCard } from './components/ForumPostCard';
import { NewsDetailModal } from './components/NewsDetailModal';
import { HiringCard } from './components/HiringCard/HiringCard';
import { ForumPostModal } from './components/ForumPostModal/ForumPostModal';
import { TopStoriesBlock, type TopStorySlot } from './components/TopStories';
import { PopularScroller } from './components/FeedScrollers/PopularScroller';
import { DealCardCompact } from './components/DealCardCompact/DealCardCompact';
import { FollowTeamsScroller } from './components/FeedScrollers/FollowTeamsScroller';

import s from './TeamNews.module.scss';

interface TeamNewsProps {
  groups: ITeamNewsGroup[];
  /** Allowlisted teams with no focus-area group; shown on "All" only. */
  allTabExtraItems?: ITeamNewsItem[];
  /** Server-ranked "Popular this week" (GET /v1/team-news/popular), fetched SSR
   * alongside `groups`. Empty → the rail's Popular module hides itself. */
  popularItems?: ITeamNewsPopularItem[];
  pageSize?: number;
  initialDigestSettings?: ForumDigestSettings | null;
}

export const TeamNews = ({
  groups,
  allTabExtraItems = [],
  popularItems = [],
  pageSize = 6,
  initialDigestSettings = null,
}: TeamNewsProps) => {
  const [activeTab, setActiveTab] = useState<string>(ALL_TAB);
  const [activeCategory, setActiveCategory] = useState<TeamNewsCategoryId>(ALL_CAT);
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const desktopFieldRef = useRef<HTMLDivElement>(null);
  const analytics = useTeamNewsAnalytics();
  const followAnalytics = useFollowAnalytics();
  const { mutate: followMutate } = useFollowTeam();
  const { mutate: upvoteMutate } = useTeamNewsUpvoteToggle();
  const { mutate: postLikeMutate } = useFeedForumPostLikeToggle();
  // One instance for the whole page: holds every rendered card's dedup/queue
  // state, regardless of tab/category remounts below it (see the hook's own
  // unmount-vs-page-load-scoped comments).
  const { recordVisible } = useTeamNewsImpressions();

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
      applyUpvoteOverlay(
        sortAllTabItemsByEventDate(dedupeByUid([...groups.flatMap((g) => g.items), ...allTabExtraItems])),
        upvoteOverlay,
      ),
    [groups, allTabExtraItems, upvoteOverlay],
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
  // `forumPosts` is trimmed to the last 14 days and is what everything below
  // renders and counts. `unwindowedForumPosts` is the same access-gated list
  // with only that trim lifted, and has exactly two consumers — both on the
  // ?post= deep-link path, so a shared link to an older topic still opens.
  const { forumPosts, unwindowedForumPosts, hasAccess, deepLinkSettled } = useFeedSocial({ newsUids });

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
  const { hiring: feedHiring } = useFeedHiring();
  const { deals: feedDeals } = useFeedDeals();

  const itemsForActiveTab = useMemo(() => {
    if (activeTab === ALL_TAB) return allItems;
    const group = groups.find((g) => g.focusArea.title === activeTab);
    return applyUpvoteOverlay(group?.items ?? [], upvoteOverlay);
  }, [activeTab, allItems, groups, upvoteOverlay]);

  // Forum posts joining the current tab (they only ever show under the "All"
  // category pill — a post has no event type). Memoized so its array identity
  // can't re-run the merge on unrelated renders (e.g. upvote overlay writes).
  const tabForumPosts = useMemo(
    () => filterFeedForumPosts(forumPosts, { tab: activeTab, category: ALL_CAT, query: '' }),
    [forumPosts, activeTab],
  );

  // One definition of "how many does this pill have", used both to render the
  // pills and to report the count on click — two copies of this drifted apart
  // once already.
  const countForCategory = useCallback(
    (id: TeamNewsCategoryId) => {
      const newsCount =
        id === ALL_CAT
          ? itemsForActiveTab.length
          : itemsForActiveTab.filter((i) => matchesTeamNewsCategory(i, id)).length;
      // Forum posts show under All and Discussions, and nowhere else.
      return newsCount + (categoryIncludesForumPosts(id) ? tabForumPosts.length : 0);
    },
    [itemsForActiveTab, tabForumPosts],
  );

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

    // Nothing to filter to ⇒ no pill, the same rule every other pill follows.
    if (discussionsCount === 0) {
      return base;
    }

    const withDiscussions: Array<{ id: TeamNewsCategoryId; label: string; count: number }> = [];
    for (const c of base) {
      withDiscussions.push(c);
      if (c.id === ALL_CAT) {
        withDiscussions.push({ ...DISCUSSIONS_CATEGORY, count: discussionsCount });
      }
    }
    return withDiscussions;
  }, [countForCategory]);

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
        .filter((c) => c.id === ALL_CAT || c.count > 0)
        .map((c) => ({ value: c.id, label: c.id === ALL_CAT ? c.label : `${c.label} (${c.count})` })),
    [categoriesWithCounts],
  );

  const filteredItems = useMemo(() => {
    if (activeCategory === ALL_CAT) return itemsForActiveTab;
    return itemsForActiveTab.filter((i) => matchesTeamNewsCategory(i, activeCategory));
  }, [activeCategory, itemsForActiveTab]);

  // Narrows filteredItems by team name, story title, summary, or tags —
  // combines with (doesn't replace) the active tab/category filter.
  const searchedItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return filteredItems;
    return filteredItems.filter((i) => matchesTeamNewsQuery(i, q));
  }, [filteredItems, query]);

  // The band is network-wide, so it only exists on the unfiltered view: ranking
  // it inside a focus area or a category pill would make "Top stories" mean
  // something different on every filter. This one flag drives the band's
  // visibility, the stream exclusion below, and the rail's Popular dedup — three
  // separate conditions would drift.
  const isNarrowedView = activeTab !== ALL_TAB || activeCategory !== ALL_CAT || Boolean(query.trim());

  // Ranked from editorialRank (LLM Top Stories picks), rendered from the live
  // overlay. Independent of upvote counts so the band stays distinct from
  // Popular this week. The band exists to sit above a feed, so it only appears
  // once the window can supply both it and a full first page (TOP_STORIES_MIN_CORPUS).
  const topStories = useMemo(
    () => (isNarrowedView ? null : selectTopStories(allItems, TOP_STORIES_MIN_CORPUS)),
    [isNarrowedView, allItems],
  );
  const hasTopStories = Boolean(topStories?.lead);

  // Excluded BEFORE clusterByTeam: pulling items out of already-built clusters
  // would leave one with a hole, or leave an empty card behind. A team whose
  // only story is in the band simply produces no cluster.
  const streamItems = useMemo(
    () => (topStories && hasTopStories ? searchedItems.filter((i) => !topStories.uids.has(i.uid)) : searchedItems),
    [searchedItems, topStories, hasTopStories],
  );

  const clusters = useMemo(() => clusterByTeam(streamItems), [streamItems]);

  const sortedClusters = useMemo(
    () => sortTeamNewsClusters(clusters, sort, initialFollowedTeamUids, initialUpvoteCounts),
    [clusters, sort, initialFollowedTeamUids, initialUpvoteCounts],
  );

  // Forum posts under the CURRENT filters (category + search narrow tabForumPosts).
  const visibleForumPosts = useMemo(
    () => filterFeedForumPosts(forumPosts, { tab: activeTab, category: activeCategory, query }),
    [forumPosts, activeTab, activeCategory, query],
  );

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
  // focus area or an event type, so every narrowed view drops them. That falls
  // out of `isNarrowedView` below rather than being re-derived per stream.
  // SHOW_HIRING_NEWS gates the INJECTION, not the render. Gating only the card
  // (as #2775 did) still let the entry into `entries`, where it silently ate a
  // `pageSize` slot — a first page of six showed five — and shifted the
  // analytics `position` of every card after it. `undefined` is the same "leave
  // the feed alone" signal a failed request already sends.
  const entries = useMemo(
    () =>
      isNarrowedView
        ? rankedEntries
        : injectFeedSignals({
            entries: rankedEntries,
            hiring: SHOW_HIRING_NEWS ? feedHiring : undefined,
            deals: feedDeals,
          }),
    [rankedEntries, isNarrowedView, feedHiring, feedDeals],
  );

  const visibleEntries = expanded ? entries : entries.slice(0, pageSize);
  const newCount = allItems.length + (forumPosts?.length ?? 0);

  // Band is editorialRank; rail is upvotes — they should already diverge, but
  // still drop any accidental overlap so the same story isn't shown twice.
  const railPopularItems = useMemo(
    () => (topStories && hasTopStories ? popularItems.filter((p) => !topStories.uids.has(p.uid)) : popularItems),
    [popularItems, topStories, hasTopStories],
  );

  // ?news=<uid> ↔ detail-modal sync (declared after the allItems memo — the
  // validator closes over it). All URL writes are history.replaceState; see
  // the hook for why router.replace is the wrong tool here.
  const isValidNewsUid = useCallback((uid: string) => allItems.some((i) => i.uid === uid), [allItems]);
  const { activeNewsUid, openNews, closeNews, openedViaDeepLink } = useNewsDeepLink({ isValidUid: isValidNewsUid });

  // Resolved fresh each render from overlay-merged allItems so the modal's Like
  // count can never disagree with the rows; null lookup (an item expired away)
  // renders nothing rather than a stale copy. Guarded — closed-modal renders
  // skip the scan; deliberately not memoized (O(hundreds), single-digit µs).
  const activeNewsItem = activeNewsUid ? (allItems.find((i) => i.uid === activeNewsUid) ?? null) : null;

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

  const { currentUser } = useCurrentUserStore();
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
    setActiveCategory(ALL_CAT);
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
    const position = visibleEntries.findIndex((e) => e.kind === 'news' && e.cluster.teamUid === item.teamUid);
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
  useEffect(() => {
    filteredItemsRef.current = filteredItems;
    forumPostsRef.current = forumPosts;
    activeTabRef.current = activeTab;
    activeCategoryRef.current = activeCategory;
    analyticsRef.current = analytics;
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
    const resultCount =
      filteredItemsRef.current.filter((i) => matchesTeamNewsQuery(i, q)).length +
      filterFeedForumPosts(forumPostsRef.current, {
        tab: activeTabRef.current,
        category: activeCategoryRef.current,
        query: trimmed,
      }).length;
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
    const position = visibleEntries.findIndex((e) => e.kind === 'news' && e.cluster.teamUid === item.teamUid);

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

    const position = visibleEntries.findIndex((e) => feedEntryKey(e) === `forum:${post.uid}`);

    postLikeMutate(
      { post, isLiked: nextLiked },
      {
        onError: () => {
          setPostLikeOverlay((prev) => new Map(prev).set(post.uid, { viewerHasLiked: wasLiked, likeCount: prevCount }));
          analytics.onFeedForumPostLikeFailed(post, position, nextLiked, source);
        },
        onSuccess: (status) => {
          if (status) {
            setPostLikeOverlay((prev) => new Map(prev).set(post.uid, status));
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

    // Reuse the already-memoized itemsForActiveTab rather than recomputing the
    // same ALL_TAB-vs-group lookup inline — accurate here, before any of this
    // handler's own setState calls have applied.
    const tabMismatch = activeTab !== ALL_TAB && !itemsForActiveTab.some((i) => i.uid === fullItem.uid);
    const categoryMismatch = activeCategory !== ALL_CAT && !matchesTeamNewsCategory(fullItem, activeCategory);
    const searchMismatch = query.trim() !== '' && !matchesTeamNewsQuery(fullItem, query.trim().toLowerCase());
    const filtersChanging = tabMismatch || categoryMismatch || searchMismatch;

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

  // A forum-access member with zero news in the window still gets their posts
  // (they render alone once the posts query lands — accepted pop-in).
  if (isEmpty(allItems) && (forumPosts?.length ?? 0) === 0) {
    return (
      <NewsBase>
        <div className={s.empty}>No network news in the last 14 days yet. Check back soon.</div>
      </NewsBase>
    );
  }

  return (
    <NewsBase
      headerDetails={
        <div className={s.headerActions}>
          {newCount > 0 && <span className={s.unreadBadge}>{newCount} new</span>}
          <NewsSearch
            open={searchOpen}
            value={query}
            onOpen={() => setSearchOpen(true)}
            onChange={handleSearch}
            onBlur={handleFieldBlur}
            fieldRef={desktopFieldRef}
          />
        </div>
      }
    >
      {/* Mobile only: header has no room to expand inline, so the field lives
          here as a permanent full-width row. Hidden on desktop via CSS. */}
      <div className={s.mobileSearchRow}>
        <SearchInput value={query} onChange={handleSearch} placeholder="Search by news, teams…" />
      </div>

      <TeamNewsTabs groups={groups} allItems={allItems} activeTab={activeTab} onTabChange={handleTab} />

      <div className={s.filterBar}>
        <div className={s.catRow}>
          {categoriesWithCounts.map((c) => {
            const isActive = activeCategory === c.id;
            const isDisabled = c.count === 0 && c.id !== ALL_CAT;
            return (
              <button
                key={c.id}
                type="button"
                className={clsx(s.cat, { [s.catActive]: isActive })}
                onClick={() => handleCategory(c.id)}
                disabled={isDisabled}
              >
                {c.label}
                {c.count > 0 && c.id !== ALL_CAT && <span>{c.count}</span>}
              </button>
            );
          })}
        </div>
        <div className={s.filterActions}>
          {/* Mobile only — `.catRow`'s pill row holds the category filter at
              every wider breakpoint (see TeamNews.module.scss `.catRow` /
              `.typeMobile`). Same SortDropdown "Sort by:" already uses, so the
              two read as one control family on a narrow screen. */}
          <span className={s.typeMobile}>
            <SortDropdown
              sortByLabel="Type:"
              options={categoryOptions}
              currentSort={activeCategory}
              onSortChange={(value) => handleCategory(value as TeamNewsCategoryId)}
            />
          </span>
          <SortDropdown sortByLabel="Sort by:" options={SORT_OPTIONS} currentSort={sort} onSortChange={handleSort} />
        </div>
      </div>

      <div className={s.layout}>
        {/* tabIndex={-1}: focus-restore fallback target when the modal closes and
            the originating row is gone (deep link to a folded story) — focus must
            land somewhere in the feed, never on <body>. */}
        <div className={s.main} data-news-feed-root tabIndex={-1}>
          {topStories?.lead && (
            <div className={s.topStories}>
              <TopStoriesBlock
                lead={topStories.lead}
                also={topStories.also}
                windowLabel={TOP_STORIES_WINDOW_LABEL}
                followedTeamUids={followedTeamUids}
                onFollowToggle={handleFollowToggle}
                onUpvoteToggle={handleUpvoteToggle}
                onStoryOpen={handleTopStoryOpen}
                onStoryVisible={recordVisible}
              />
            </div>
          )}

          {/* The rail's two modules, lifted to just under the band at widths
              where the rail itself stacks below the whole feed. Rendered only
              here — NewsRail drops them at the same breakpoint, so exactly one
              instance of each is ever on screen. Kept in the rail's own order
              so the modules don't swap places between widths. */}
          {isBelowDesktop && (
            <div className={s.feedScrollers}>
              {showSuggestionsModule && (
                <FollowTeamsScroller
                  suggestions={visibleSuggestions}
                  followedTeamUids={followedTeamUids}
                  onFollowToggle={handleFollowToggle}
                />
              )}
              {SHOW_POPULAR_THIS_WEEK && (
                <PopularScroller items={railPopularItems} onPopularItemClick={handlePopularItemClick} />
              )}
            </div>
          )}

          {/* Suppressed when the band is showing: a window whose every story is
              in the band leaves the stream empty, and "No network news in this
              filter" directly under three stories reads as a bug. */}
          {entries.length === 0 ? (
            !topStories?.lead && (
              <div className={s.empty}>
                {query.trim() ? `No network news matches "${query.trim()}".` : 'No network news in this filter.'}
              </div>
            )
          ) : (
            <>
              {/* The stream, marked so it can be addressed apart from the
                  top-stories band above it — which renders its own copies of
                  the same stories. */}
              <div className={s.feed} data-news-feed-list>
                {visibleEntries.map((entry, index) => {
                  // Composite key intentionally forces a remount on every tab/category
                  // change so each card's local state (expanded stories, open comment
                  // threads) resets — see rationale in
                  // docs/plans/2026-07-06-feat-team-news-grouped-by-team-plan.md.
                  // NOTE: any future CSS transition on .storyRow/.expander will not
                  // animate across a filter change, since this replaces the DOM node
                  // rather than updating it in place.
                  const key = `${activeTab}::${String(activeCategory)}::${feedEntryKey(entry)}`;
                  switch (entry.kind) {
                    case 'news':
                      return (
                        <NewsGroupCard
                          key={key}
                          cluster={entry.cluster}
                          onStoryOpen={handleStoryOpen}
                          isFollowing={followedTeamUids.has(entry.cluster.teamUid)}
                          onFollowToggle={handleFollowToggle}
                          onUpvoteToggle={handleUpvoteToggle}
                          autoExpandStoryUid={
                            scrollTarget?.teamUid === entry.cluster.teamUid ? scrollTarget.storyUid : undefined
                          }
                          onStoryVisible={recordVisible}
                        />
                      );
                    case 'forum':
                      return (
                        <ForumPostCard
                          key={key}
                          // Live like state resolved at render only — the merge
                          // above ranked by frozen counts, so likes never reorder
                          // the feed.
                          post={resolvePostLike(entry.post)}
                          position={index}
                          isOwnPost={isOwnForumPost(entry.post, currentUser?.uid)}
                          onOpenDetail={handleForumPostOpen}
                          onLikeToggle={handleForumPostLikeToggle}
                        />
                      );
                    case 'hiring':
                      // No flag check here: with the injection gated above, a
                      // hiring entry only exists when it is meant to be seen.
                      // Re-checking would reintroduce the invisible-entry bug
                      // the moment the two guards disagreed.
                      return (
                        <HiringCard
                          key={key}
                          group={entry.group}
                          isFollowing={followedTeamUids.has(entry.group.team.uid)}
                          onFollowToggle={handleFollowToggle}
                          onRoleClick={(group, role, rolePosition) =>
                            analytics.onFeedHiringRoleClicked(group, role, rolePosition, index)
                          }
                          onViewAllClick={(group) => analytics.onFeedHiringViewAllClicked(group, index)}
                        />
                      );
                    case 'deal':
                      return (
                        <DealCardCompact
                          key={key}
                          deal={entry.deal}
                          onClick={(deal) => analytics.onFeedDealClicked(deal, index)}
                        />
                      );
                    default:
                      return assertNever(entry);
                  }
                })}
              </div>
              {entries.length > pageSize && (
                <div className={s.showAll}>
                  <Button style="border" variant="secondary" type="button" onClick={handleToggleAll}>
                    {expanded ? 'Show Less' : 'Show All'}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
        <NewsRail
          initialDigestSettings={initialDigestSettings}
          popularItems={railPopularItems}
          isLoadingSuggestedTeams={isLoadingSuggestedTeams}
          visibleSuggestions={visibleSuggestions}
          renderModules={!isBelowDesktop}
          followedTeamUids={followedTeamUids}
          onFollowToggle={handleFollowToggle}
          onPopularItemClick={handlePopularItemClick}
        />
      </div>

      {/* Conditional mount, no isOpen half-state: the item prop is always the
          live overlay-merged object. Trades away the exit animation (accepted). */}
      {activeNewsItem && (
        <NewsDetailModal
          item={activeNewsItem}
          onClose={closeNews}
          onUpvoteToggle={(item) => handleUpvoteToggle(item, 'news-modal')}
          isFollowing={followedTeamUids.has(activeNewsItem.teamUid)}
          onFollowToggle={handleFollowToggle}
        />
      )}
      {activeForumPost && (
        <ForumPostModal
          onClose={closePost}
          post={activeForumPost}
          isOwnPost={isOwnForumPost(activeForumPost, currentUser?.uid)}
          onLikeToggle={(post) => handleForumPostLikeToggle(post, 'news-modal')}
        />
      )}
    </NewsBase>
  );
};

'use client';

import clsx from 'clsx';
import isEmpty from 'lodash/isEmpty';
import { useCallback, useEffect, useMemo, useRef, useState, type FocusEvent } from 'react';
import { flushSync } from 'react-dom';

import { useTeamNewsAnalytics } from '@/analytics/team-news.analytics';
import { useFollowAnalytics, type FollowAnalyticsSource } from '@/analytics/follow.analytics';
import { useFollowTeam } from '@/services/follow/hooks/useFollowTeam';
import { useSuggestedTeamsToFollow } from '@/services/follow/hooks/useSuggestedTeamsToFollow';
import { useTeamNewsUpvoteToggle } from '@/services/team-news/hooks/useTeamNewsUpvoteToggle';
import { useCurrentUserStore } from '@/services/auth/store';
import type { ForumDigestSettings } from '@/services/forum/hooks/useGetForumDigestSettings';
import type { ITeamNewsGroup, ITeamNewsItem, ITeamNewsPopularItem } from '@/types/team-news.types';

import { Button } from '@/components/common/Button';
import { SearchInput } from '@/components/common/filters/SearchInput';
import { SortDropdown } from '@/components/common/filters/SortDropdown';

import {
  ACTIVE_DISCUSSIONS_CAT,
  ACTIVE_DISCUSSIONS_CATEGORY,
  ALL_TAB,
  ALL_CAT,
  CATEGORIES,
  type TeamNewsCategoryId,
} from './constants';

import { hasExistingDiscussion } from './components/NewsCard/components/StartConversationButton/utils/hasExistingDiscussion';

import { dedupeByUid } from './utils/dedupeByUid';
import { applyUpvoteOverlay } from './utils/applyUpvoteOverlay';
import { clusterByTeam } from './utils/clusterByTeam';
import { useStoryReveal } from './hooks/useStoryReveal';

import { NewsGroupCard } from './components/NewsGroupCard';
import { NewsBase } from './components/NewsBase';
import { NewsRail } from './components/NewsRail';
import { NewsSearch } from './components/NewsSearch';
import { TeamNewsTabs } from './components/TeamNewsTabs';

import s from './TeamNews.module.scss';

import { sortAllTabItemsByEventDate } from './utils/sortAllTabItemsByEventDate';
import { SORT_OPTIONS, sortTeamNewsClusters, type TeamNewsSort } from './utils/sortTeamNewsClusters';

// DebouncedInput (inside SearchInput) doesn't expose its <input> via props or
// a forwarded ref, so this is the only way to read its live (undebounced)
// value or focus it programmatically. Centralized so there's one place — not
// two — that assumes it renders exactly one bare <input>.
function getSearchInputEl(container: HTMLDivElement | null): HTMLInputElement | null {
  return container?.querySelector('input') ?? null;
}

// Shared by searchedItems' useMemo and handleSearch's synchronous result-count
// computation, so the two never drift into different definitions of "matches".
function matchesTeamNewsQuery(item: ITeamNewsItem, lowerCaseQuery: string): boolean {
  if (!lowerCaseQuery) return true;
  return (
    item.teamName.toLowerCase().includes(lowerCaseQuery) ||
    item.title.toLowerCase().includes(lowerCaseQuery) ||
    (item.summary?.toLowerCase().includes(lowerCaseQuery) ?? false) ||
    item.tags.some((t) => t.toLowerCase().includes(lowerCaseQuery))
  );
}

// Shared by filteredItems' useMemo and handlePopularItemClick's synchronous
// category-mismatch check, so the two never drift into different definitions
// of "matches" — same rationale as matchesTeamNewsQuery above.
function matchesTeamNewsCategory(item: ITeamNewsItem, categoryId: TeamNewsCategoryId): boolean {
  if (categoryId === ALL_CAT) return true;
  if (categoryId === ACTIVE_DISCUSSIONS_CAT) return hasExistingDiscussion(item.discussion);
  return item.eventType === categoryId;
}

interface TeamNewsProps {
  groups: ITeamNewsGroup[];
  /** Server-ranked "Popular this week" (GET /v1/team-news/popular), fetched SSR
   * alongside `groups`. Empty → the rail's Popular module hides itself. */
  popularItems?: ITeamNewsPopularItem[];
  pageSize?: number;
  initialDigestSettings?: ForumDigestSettings | null;
}

export const TeamNews = ({ groups, popularItems = [], pageSize = 6, initialDigestSettings = null }: TeamNewsProps) => {
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
    () => applyUpvoteOverlay(sortAllTabItemsByEventDate(dedupeByUid(groups.flatMap((g) => g.items))), upvoteOverlay),
    [groups, upvoteOverlay],
  );

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

  // Default: Following when the user follows any teams; otherwise Most popular.
  const [sort, setSort] = useState<TeamNewsSort>(() => (initialFollowedTeamUids.size > 0 ? 'following' : 'popular'));

  const itemsForActiveTab = useMemo(() => {
    if (activeTab === ALL_TAB) return allItems;
    const group = groups.find((g) => g.focusArea.title === activeTab);
    return applyUpvoteOverlay(group?.items ?? [], upvoteOverlay);
  }, [activeTab, allItems, groups, upvoteOverlay]);

  const categoriesWithCounts = useMemo(() => {
    const activeDiscussionsCount = itemsForActiveTab.filter((i) => hasExistingDiscussion(i.discussion)).length;
    const base = CATEGORIES.map((c) => ({
      ...c,
      count: c.id === ALL_CAT ? itemsForActiveTab.length : itemsForActiveTab.filter((i) => i.eventType === c.id).length,
    }));

    if (activeDiscussionsCount === 0) return base;

    const withActive: Array<{ id: TeamNewsCategoryId; label: string; count: number }> = [];
    for (const c of base) {
      withActive.push(c);
      if (c.id === ALL_CAT) {
        withActive.push({ ...ACTIVE_DISCUSSIONS_CATEGORY, count: activeDiscussionsCount });
      }
    }
    return withActive;
  }, [itemsForActiveTab]);

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

  const clusters = useMemo(() => clusterByTeam(searchedItems), [searchedItems]);

  const sortedClusters = useMemo(
    () => sortTeamNewsClusters(clusters, sort, initialFollowedTeamUids, initialUpvoteCounts),
    [clusters, sort, initialFollowedTeamUids, initialUpvoteCounts],
  );

  const visibleClusters = expanded ? sortedClusters : sortedClusters.slice(0, pageSize);
  const newCount = allItems.length;

  const { currentUser } = useCurrentUserStore();
  const { suggestions: suggestedTeams, isLoading: isLoadingSuggestedTeams } = useSuggestedTeamsToFollow({
    currentUserUid: currentUser?.uid ?? null,
  });

  const handleTab = (id: string) => {
    const nextItems = id === ALL_TAB ? allItems : (groups.find((g) => g.focusArea.title === id)?.items ?? []);
    analytics.onTeamNewsTabClicked(id, nextItems.length);
    setActiveTab(id);
    setActiveCategory(ALL_CAT);
    setExpanded(false);
  };

  const handleCategory = (id: TeamNewsCategoryId) => {
    const nextCount =
      id === ALL_CAT
        ? itemsForActiveTab.length
        : id === ACTIVE_DISCUSSIONS_CAT
          ? itemsForActiveTab.filter((i) => hasExistingDiscussion(i.discussion)).length
          : itemsForActiveTab.filter((i) => i.eventType === id).length;
    analytics.onTeamNewsCategoryClicked(String(id), nextCount, activeTab);
    setActiveCategory(id);
    setExpanded(false);
  };

  const handleSort = (value: string) => {
    analytics.onTeamNewsSortChanged(value, sort, clusters.length);
    setSort(value as TeamNewsSort);
    setExpanded(false);
  };

  const handleToggleAll = () => {
    analytics.onTeamNewsLoadMoreClicked(visibleClusters.length, clusters.length, 'home', {
      currentTab: activeTab,
      currentCategory: String(activeCategory),
    });
    setExpanded((v) => !v);
  };

  const handleCardClick = (item: ITeamNewsItem) => {
    const position = visibleClusters.findIndex((c) => c.teamUid === item.teamUid);
    analytics.onTeamNewsCardClicked(item, position >= 0 ? position : 0, 'home');
  };

  // "Latest ref" pattern: lets handleSearch read current context synchronously
  // without adding it to handleSearch's dependency array, which must stay
  // empty (see the comment on handleSearch below). Refs are synced in an
  // effect with no dependency array (runs after every render) rather than
  // written during render, per this repo's react-hooks/refs lint rule.
  const filteredItemsRef = useRef(filteredItems);
  const activeTabRef = useRef(activeTab);
  const activeCategoryRef = useRef(activeCategory);
  const analyticsRef = useRef(analytics);
  useEffect(() => {
    filteredItemsRef.current = filteredItems;
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
    const resultCount = filteredItemsRef.current.filter((i) => matchesTeamNewsQuery(i, q)).length;
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
  const handleUpvoteToggle = (item: ITeamNewsItem) => {
    const wasUpvoted = Boolean(item.viewerHasUpvoted);
    const nextUpvoted = !wasUpvoted;
    const prevCount = item.upvoteCount ?? 0;
    const nextCount = wasUpvoted ? Math.max(0, prevCount - 1) : prevCount + 1;

    setUpvoteOverlay((prev) => {
      const next = new Map(prev);
      next.set(item.uid, { viewerHasUpvoted: nextUpvoted, upvoteCount: nextCount });
      return next;
    });

    const position = visibleClusters.findIndex((c) => c.teamUid === item.teamUid);

    upvoteMutate(
      { uid: item.uid, isUpvoted: nextUpvoted },
      {
        onError: () => {
          setUpvoteOverlay((prev) => {
            const next = new Map(prev);
            next.set(item.uid, { viewerHasUpvoted: wasUpvoted, upvoteCount: prevCount });
            return next;
          });
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
          analytics.onTeamNewsUpvoteToggled(item, position >= 0 ? position : 0, nextUpvoted, 'home');
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
    // sortedClusters (in scope, this render) already reflects the item's real
    // position, so only expand if it's actually beyond pageSize.
    const shouldExpandOuter =
      filtersChanging || sortedClusters.findIndex((c) => c.teamUid === fullItem.teamUid) >= pageSize;

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

    if (el) revealStory(el);
    // else: unexpected — flushSync above should guarantee `el` exists.
  };

  if (isEmpty(allItems)) {
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
          <SortDropdown sortByLabel="Sort by:" options={SORT_OPTIONS} currentSort={sort} onSortChange={handleSort} />
        </div>
      </div>

      <div className={s.layout}>
        <div className={s.main}>
          {searchedItems.length === 0 ? (
            <div className={s.empty}>
              {query.trim() ? `No network news matches "${query.trim()}".` : 'No network news in this filter.'}
            </div>
          ) : (
            <>
              <div className={s.feed}>
                {visibleClusters.map((cluster) => (
                  // Composite key intentionally forces a remount on every tab/category
                  // change so each card's local `expanded` resets — see rationale in
                  // docs/plans/2026-07-06-feat-team-news-grouped-by-team-plan.md.
                  // NOTE: any future CSS transition on .storyRow/.expander will not
                  // animate across a filter change, since this replaces the DOM node
                  // rather than updating it in place.
                  <NewsGroupCard
                    key={`${activeTab}::${String(activeCategory)}::${cluster.teamUid}`}
                    cluster={cluster}
                    onStoryClick={handleCardClick}
                    isFollowing={followedTeamUids.has(cluster.teamUid)}
                    onFollowToggle={handleFollowToggle}
                    onUpvoteToggle={handleUpvoteToggle}
                    autoExpandStoryUid={scrollTarget?.teamUid === cluster.teamUid ? scrollTarget.storyUid : undefined}
                  />
                ))}
              </div>
              {clusters.length > pageSize && (
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
          popularItems={popularItems}
          suggestedTeams={suggestedTeams}
          isLoadingSuggestedTeams={isLoadingSuggestedTeams}
          followedTeamUids={followedTeamUids}
          onFollowToggle={handleFollowToggle}
          onPopularItemClick={handlePopularItemClick}
        />
      </div>
    </NewsBase>
  );
};

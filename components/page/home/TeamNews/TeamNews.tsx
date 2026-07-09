'use client';

import clsx from 'clsx';
import isEmpty from 'lodash/isEmpty';
import { useCallback, useEffect, useMemo, useRef, useState, type FocusEvent } from 'react';

import { useTeamNewsAnalytics } from '@/analytics/team-news.analytics';
import { useFollowAnalytics } from '@/analytics/follow.analytics';
import { useFollowTeam } from '@/services/follow/hooks/useFollowTeam';
import { useSuggestedTeamsToFollow } from '@/services/follow/hooks/useSuggestedTeamsToFollow';
import { useTeamNewsUpvoteToggle } from '@/services/team-news/hooks/useTeamNewsUpvoteToggle';
import { useCurrentUserStore } from '@/services/auth/store';
import type { ForumDigestSettings } from '@/services/forum/hooks/useGetForumDigestSettings';
import type { ITeamNewsGroup, ITeamNewsItem, ITeamNewsPopularItem } from '@/types/team-news.types';

import { Button } from '@/components/common/Button';
import { SearchInput } from '@/components/common/filters/SearchInput';

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
import { clusterByTeam } from './utils/clusterByTeam';

import { NewsGroupCard } from './components/NewsGroupCard';
import { NewsBase } from './components/NewsBase';
import { NewsRail } from './components/NewsRail';
import { NewsSearch } from './components/NewsSearch';
import { TeamNewsTabs } from './components/TeamNewsTabs';

import s from './TeamNews.module.scss';

import { sortAllTabItemsByEventDate } from './utils/sortAllTabItemsByEventDate';

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

interface TeamNewsProps {
  groups: ITeamNewsGroup[];
  /** Server-ranked "Popular this week" (GET /v1/team-news/popular), fetched SSR
   * alongside `groups`. Empty → the rail's Popular module hides itself. */
  popularItems?: ITeamNewsPopularItem[];
  pageSize?: number;
  initialDigestSettings?: ForumDigestSettings | null;
}

export const TeamNews = ({
  groups,
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

  // `groups` is an SSR prop, not a React Query cache — there's nothing here for a
  // useArticleLike-style setQueryData patch to act on. Upvote state is tracked the
  // same way follow state already is (see followedTeamUids below): a local overlay,
  // applied once in this memo, so every derived view (tabs, clusters, the Popular
  // rail) reads the same merged item and can never drift out of sync with itself.
  const [upvoteOverlay, setUpvoteOverlay] = useState<Map<string, { viewerHasUpvoted: boolean; upvoteCount: number }>>(
    () => new Map(),
  );

  const allItems = useMemo(() => {
    const merged = sortAllTabItemsByEventDate(dedupeByUid(groups.flatMap((g) => g.items)));
    if (upvoteOverlay.size === 0) return merged;
    return merged.map((item) => (upvoteOverlay.has(item.uid) ? { ...item, ...upvoteOverlay.get(item.uid) } : item));
  }, [groups, upvoteOverlay]);

  const [followedTeamUids, setFollowedTeamUids] = useState<Set<string>>(
    () => new Set(allItems.filter((i) => i.isFollowed).map((i) => i.teamUid)),
  );

  const itemsForActiveTab = useMemo(() => {
    if (activeTab === ALL_TAB) return allItems;
    const group = groups.find((g) => g.focusArea.title === activeTab);
    return group?.items ?? [];
  }, [activeTab, allItems, groups]);

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
    if (activeCategory === ACTIVE_DISCUSSIONS_CAT) {
      return itemsForActiveTab.filter((i) => hasExistingDiscussion(i.discussion));
    }
    return itemsForActiveTab.filter((i) => i.eventType === activeCategory);
  }, [activeCategory, itemsForActiveTab]);

  // Narrows filteredItems by team name, story title, summary, or tags —
  // combines with (doesn't replace) the active tab/category filter.
  const searchedItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return filteredItems;
    return filteredItems.filter((i) => matchesTeamNewsQuery(i, q));
  }, [filteredItems, query]);

  const clusters = useMemo(() => clusterByTeam(searchedItems), [searchedItems]);

  const sortedClusters = useMemo(() => {
    const followed = clusters.filter((c) => followedTeamUids.has(c.teamUid));
    const unfollowed = clusters.filter((c) => !followedTeamUids.has(c.teamUid));
    return [...followed, ...unfollowed];
  }, [clusters, followedTeamUids]);

  const visibleClusters = expanded ? sortedClusters : sortedClusters.slice(0, pageSize);
  const newCount = allItems.length;

  const { currentUser } = useCurrentUserStore();
  const { suggestions: suggestedTeams, isLoading: isLoadingSuggestedTeams } = useSuggestedTeamsToFollow({
    currentUserUid: currentUser?.uid ?? null,
    followedTeamUids,
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

  const handleFollowToggle = (teamUid: string, teamName: string, isCurrentlyFollowing: boolean) => {
    const action = isCurrentlyFollowing ? 'unfollow' : 'follow';
    setFollowedTeamUids((prev) => {
      const next = new Set(prev);
      isCurrentlyFollowing ? next.delete(teamUid) : next.add(teamUid);
      return next;
    });
    followMutate(
      { teamUid, action },
      {
        onError: () => {
          setFollowedTeamUids((prev) => {
            const next = new Set(prev);
            isCurrentlyFollowing ? next.add(teamUid) : next.delete(teamUid);
            return next;
          });
          followAnalytics.onTeamFollowFailed({
            teamUid,
            teamName,
            source: 'news-feed',
            action,
          });
        },
        onSuccess: () => {
          if (action === 'follow') {
            followAnalytics.onTeamFollowed({ teamUid, teamName, source: 'news-feed' });
          } else {
            followAnalytics.onTeamUnfollowed({ teamUid, teamName, source: 'news-feed' });
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
          onFollowToggle={handleFollowToggle}
        />
      </div>
    </NewsBase>
  );
};

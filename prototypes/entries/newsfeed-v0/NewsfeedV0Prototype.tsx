'use client';

import clsx from 'clsx';
import isEmpty from 'lodash/isEmpty';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { FocusEvent } from 'react';

import type { ITeamNewsItem } from '@/types/team-news.types';

import { Button } from '@/components/common/Button';

import {
  ACTIVE_DISCUSSIONS_CAT,
  ACTIVE_DISCUSSIONS_CATEGORY,
  ALL_TAB,
  ALL_CAT,
  CATEGORIES,
  type TeamNewsCategoryId,
} from '@/components/page/home/TeamNews/constants';
import { hasExistingDiscussion } from '@/components/page/home/TeamNews/components/NewsCard/components/StartConversationButton/utils/hasExistingDiscussion';
import { dedupeByUid } from '@/components/page/home/TeamNews/utils/dedupeByUid';
import { sortAllTabItemsByEventDate } from '@/components/page/home/TeamNews/utils/sortAllTabItemsByEventDate';
import { NewsBase } from '@/components/page/home/TeamNews/components/NewsBase';
import { TeamNewsTabs } from '@/components/page/home/TeamNews/components/TeamNewsTabs';

// Reuse the production feed layout styling 1:1.
import s from '@/components/page/home/TeamNews/TeamNews.module.scss';
// Production home-page shell (outer layout + section spacing), reused 1:1.
import styles from '@/app/home/page.module.css';

import { V0FeedCard } from './V0FeedCard';
import type { TeamCluster } from './V0NewsCard';
import { FeedRail } from './FeedRail';
import { QuickActionsMock } from './QuickActionsMock';
// Compact chip-row variant kept for later — hidden for now (Cards view only).
// import { CompactQuickActions } from './CompactQuickActions';
// Reuse the production sort control (base-ui Menu) 1:1 — same "Sort by: … ▾"
// dropdown used on the Projects/Members toolbars.
import { SortDropdown } from '@/components/common/filters/SortDropdown';
import { HeaderSearch } from './HeaderSearch';
// Production search field, reused 1:1 for the mobile drop-down row.
import { SearchInput } from '@/components/common/filters/SearchInput';
import { FollowToast } from '../follow-shared/FollowToast';
import { MOCK_GROUPS, UPVOTES } from './mocks';
import type { TeamCluster as Cluster } from './V0NewsCard';
import local from './NewsfeedV0.module.scss';

const groups = MOCK_GROUPS;
const PAGE_SIZE = 6;

// One personalization axis: sort order. Following is a *ranking* here, not a
// hard filter — "Following first" floats followed teams to the top without
// hiding the rest, so the network-wide feed stays intact. It's the default, so
// it leads the list (like Reddit's "Best").
type Sort = 'latest' | 'popular' | 'following';

const SORT_OPTIONS = [
  { value: 'following', label: 'Following first' },
  { value: 'latest', label: 'Latest' },
  { value: 'popular', label: 'Most popular' },
] as const;

// A cluster's interest score = its most-upvoted story (leads rank the card).
const clusterUpvotes = (c: Cluster) =>
  [c.lead, ...c.rest].reduce((max, i) => Math.max(max, UPVOTES[i.uid] ?? 0), 0);

// How much each event type matters when picking a cluster's lead story.
const EVENT_TYPE_WEIGHT: Record<ITeamNewsItem['eventType'], number> = {
  FUNDING: 5,
  LAUNCH: 4,
  PARTNERSHIP: 3,
  MILESTONE: 2,
  ANNOUNCEMENT: 1,
  OTHER: 0,
};

/**
 * Lead = most important, not most recent: event-type weight dominates, live
 * discussion activity adds to it, and recency only breaks ties (items arrive
 * newest-first, so the first highest-scored item wins).
 */
function pickLead(items: ITeamNewsItem[]): ITeamNewsItem {
  let lead = items[0];
  let best = -1;
  for (const item of items) {
    const score = EVENT_TYPE_WEIGHT[item.eventType] * 2 + Math.min(item.discussion.count, 5);
    if (score > best) {
      best = score;
      lead = item;
    }
  }
  return lead;
}

/** Group filtered items (already newest-first) into one cluster per team. */
function clusterByTeam(items: ITeamNewsItem[]): TeamCluster[] {
  const byTeam = new Map<string, ITeamNewsItem[]>();
  for (const item of items) {
    const existing = byTeam.get(item.teamUid);
    if (existing) existing.push(item);
    else byTeam.set(item.teamUid, [item]);
  }

  return Array.from(byTeam.values()).map((teamItems) => {
    const lead = pickLead(teamItems);
    return {
      teamUid: lead.teamUid,
      teamName: lead.teamName,
      teamLogoUrl: lead.teamLogoUrl,
      lead,
      rest: teamItems.filter((i) => i.uid !== lead.uid),
      isLeadNewest: lead.uid === teamItems[0].uid,
    };
  });
}

/**
 * Newsfeed redesign. Single-column feed (one card per team) with the
 * follow-suggestions / focus-areas / popular right rail and per-story upvotes.
 * Personalization is a single Sort control (Following first / Latest / Most
 * popular); Quick Actions can render compact or as the production card grid.
 */
export default function NewsfeedV0Prototype() {
  // Tabs are base-ui / client-only — gate render so SSR === first client render.
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(ALL_TAB);
  const [activeCategory, setActiveCategory] = useState<TeamNewsCategoryId>(ALL_CAT);
  const [sort, setSort] = useState<Sort>('following');
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Desktop expands an inline field from the header icon; mobile shows a
  // permanent full-width field in its own row. The ref focuses the desktop field
  // when it expands.
  const desktopFieldRef = useRef<HTMLDivElement>(null);
  const [followedTeams, setFollowedTeams] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  // Auto-dismiss the follow confirmation.
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const toggleFollow = (teamUid: string, teamName: string) => {
    setFollowedTeams((prev) => {
      const next = new Set(prev);
      if (next.has(teamUid)) {
        next.delete(teamUid);
        setToast(null);
      } else {
        next.add(teamUid);
        setToast(teamName);
      }
      return next;
    });
  };

  const allItems = useMemo(() => sortAllTabItemsByEventDate(dedupeByUid(groups.flatMap((g) => g.items))), []);

  const itemsForActiveTab = useMemo(() => {
    if (activeTab === ALL_TAB) return allItems;
    const group = groups.find((g) => g.focusArea.title === activeTab);
    return group?.items ?? [];
  }, [activeTab, allItems]);

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

  // Free-text search narrows the current tab/category slice by team name, story
  // headline, summary, or tag.
  const searchedItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return filteredItems;
    return filteredItems.filter(
      (i) =>
        i.teamName.toLowerCase().includes(q) ||
        i.title.toLowerCase().includes(q) ||
        (i.summary?.toLowerCase().includes(q) ?? false) ||
        i.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }, [filteredItems, query]);

  const clusters = useMemo(() => clusterByTeam(searchedItems), [searchedItems]);

  // Sort is the only re-ordering axis. "Most popular" ranks by interest;
  // "Following first" floats followed teams to the top (stable, so recency holds
  // within each group) without dropping anyone; "Latest" leaves order untouched.
  const lensedClusters = useMemo(() => {
    if (sort === 'popular') return [...clusters].sort((a, b) => clusterUpvotes(b) - clusterUpvotes(a));
    if (sort === 'following') {
      return [...clusters].sort(
        (a, b) => Number(followedTeams.has(b.teamUid)) - Number(followedTeams.has(a.teamUid)),
      );
    }
    return clusters;
  }, [clusters, sort, followedTeams]);

  const visibleClusters = expanded ? lensedClusters : lensedClusters.slice(0, PAGE_SIZE);
  const newCount = allItems.length;

  const handleTab = (id: string) => {
    setActiveTab(id);
    setActiveCategory(ALL_CAT);
    setExpanded(false);
  };

  const handleCategory = (id: TeamNewsCategoryId) => {
    setActiveCategory(id);
    setExpanded(false);
  };

  const handleSort = (value: string) => {
    setSort(value as Sort);
    setExpanded(false);
  };

  const handleSearch = (value: string) => {
    setQuery(value);
    setExpanded(false);
  };

  const openSearch = () => setSearchOpen(true);

  // Desktop only: collapse the inline field when focus leaves it while empty; a
  // live query keeps it open so an active filter is never hidden. Reads the live
  // input value (not the debounced `query`) so a just-typed/just-cleared field is
  // judged by what's on screen.
  const handleFieldBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    const live = e.currentTarget.querySelector('input')?.value ?? '';
    if (!live.trim()) setSearchOpen(false);
  };

  // Focus the desktop field the moment it expands.
  useEffect(() => {
    if (!searchOpen) return;
    desktopFieldRef.current?.querySelector('input')?.focus();
  }, [searchOpen]);

  if (!mounted) return <div className={local.page} />;

  return (
    <div className={clsx(local.page, styles.home)}>
      <div className={styles.home__cn}>
        <QuickActionsMock />

        <div className={styles.home__cn__teamnews}>
          {isEmpty(allItems) ? (
          <NewsBase>
            <div className={s.empty}>No network news in the last 14 days yet. Check back soon.</div>
          </NewsBase>
        ) : (
          <NewsBase
            headerDetails={
              <div className={local.headerActions}>
                {newCount > 0 && <span className={s.unreadBadge}>{newCount} new</span>}
                <HeaderSearch
                  open={searchOpen}
                  value={query}
                  onOpen={openSearch}
                  onChange={handleSearch}
                  onBlur={handleFieldBlur}
                  fieldRef={desktopFieldRef}
                />
              </div>
            }
          >
            {/* Mobile only: the header has no room to expand inline, so the field
                lives here as a permanent full-width row. Hidden on desktop. */}
            <div className={local.mobileSearchRow}>
              <SearchInput value={query} onChange={handleSearch} placeholder="Search by team or keyword…" />
            </div>

            {/* Constrain the tabs' underline to end at the news-card's right edge
                (reserve the rail column), instead of spanning the full width. */}
            <div className={local.tabsConstrain}>
              <TeamNewsTabs groups={groups} allItems={allItems} activeTab={activeTab} onTabChange={handleTab} />
            </div>

            <div className={local.filterBar}>
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

              {/* Single sort control (reused production dropdown) opposite the
                  event-type pills — Latest / Most popular / Following first. */}
              <div className={local.filterActions}>
                <SortDropdown
                  sortByLabel="Sort by:"
                  options={SORT_OPTIONS}
                  currentSort={sort}
                  onSortChange={handleSort}
                />
              </div>
            </div>

            {searchedItems.length === 0 ? (
              <div className={s.empty}>
                {query.trim() ? `No network news matches “${query.trim()}”.` : 'No network news in this filter.'}
              </div>
            ) : (
              <>
                <div className={local.feedLayout}>
                  <div className={local.feedList}>
                    {visibleClusters.map((cluster) => (
                      <V0FeedCard
                        key={cluster.teamUid}
                        cluster={cluster}
                        following={followedTeams.has(cluster.teamUid)}
                        onToggleFollow={() => toggleFollow(cluster.teamUid, cluster.teamName)}
                        showUpvote
                      />
                    ))}
                  </div>
                  {/* Follow-suggestions / focus-areas / popular rail in the reserved column. */}
                  <aside className={local.feedRail}>
                    <FeedRail followedTeams={followedTeams} onToggleFollow={toggleFollow} allItems={allItems} />
                  </aside>
                </div>
                {lensedClusters.length > PAGE_SIZE && (
                  <div className={s.showAll}>
                    <Button style="border" variant="secondary" type="button" onClick={() => setExpanded((v) => !v)}>
                      {expanded ? 'Show Less' : 'Show All'}
                    </Button>
                  </div>
                )}
              </>
            )}
          </NewsBase>
        )}
        </div>
      </div>

      {toast && (
        <FollowToast>
          You&apos;re now following {toast} — their updates will appear first in your feed. Manage who you follow from
          your profile.
        </FollowToast>
      )}
    </div>
  );
}

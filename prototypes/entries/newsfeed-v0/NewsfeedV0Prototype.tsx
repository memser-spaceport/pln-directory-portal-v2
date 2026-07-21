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
import { LocalNewsBase } from './LocalNewsBase';
import { TeamNewsTabs } from '@/components/page/home/TeamNews/components/TeamNewsTabs';

// Reuse the production feed layout styling 1:1.
import s from '@/components/page/home/TeamNews/TeamNews.module.scss';
// Production home-page shell (outer layout + section spacing), reused 1:1.
import styles from '@/app/home/page.module.css';

import { V0FeedCard } from './V0FeedCard';
import type { TeamCluster } from './V0NewsCard';
import { FeedRail } from './FeedRail';
import { QuickActionsMock } from './QuickActionsMock';
import { MobileQuickActions } from './MobileQuickActions';
// Reuse the production sort controls 1:1 — the "Sort by: … ▾" dropdown on
// desktop (Projects/Members toolbars) and the compact "Sort ▾" pill on mobile
// (the Teams/Members mobile filter pattern).
import { SortDropdown } from '@/components/common/filters/SortDropdown';
import { MobileFeedSort } from './MobileFeedSort';
import { HeaderSearch } from './HeaderSearch';
// Production search field, reused 1:1 for the mobile drop-down row.
import { SearchInput } from '@/components/common/filters/SearchInput';
import { FollowToast } from '../follow-shared/FollowToast';
import { NewsReader } from './NewsReader';
import { ForumPostCard } from './ForumPostCard';
import { MOCK_GROUPS, MOCK_FORUM_POSTS, UPVOTES, type ForumPost } from './mocks';
import local from './NewsfeedV0.module.scss';

const groups = MOCK_GROUPS;
const PAGE_SIZE = 6;

/** A feed row is either a team's news cluster or a standalone forum post. */
type FeedEntry =
  | { kind: 'team'; date: number; cluster: TeamCluster }
  | { kind: 'forum'; date: number; post: ForumPost };

// One personalization axis: sort order. Following is a *ranking* here, not a
// hard filter — "Following" floats followed teams to the top without
// hiding the rest, so the network-wide feed stays intact. It's the default, so
// it leads the list (like Reddit's "Best").
type Sort = 'latest' | 'popular' | 'following';

const SORT_OPTIONS = [
  { value: 'following', label: 'Following' },
  { value: 'latest', label: 'Latest' },
  { value: 'popular', label: 'Most popular' },
] as const;

// A cluster's interest score = its most-upvoted story (leads rank the card).
const clusterUpvotes = (c: TeamCluster) =>
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
 * Newsfeed redesign (V1). Single-column feed — one card per team, newest first,
 * forum threads interleaved — beside the follow-suggestions / popular rail, with
 * per-story likes. Personalization is a single Sort control (Following / Latest /
 * Most popular); Quick Actions render as the production card grid on desktop and
 * a stacked scroller on mobile.
 */
export default function NewsfeedV0Prototype() {
  // Tabs are base-ui / client-only — gate render so SSR === first client render.
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(ALL_TAB);
  const [activeCategory, setActiveCategory] = useState<TeamNewsCategoryId>(ALL_CAT);
  const [sort, setSort] = useState<Sort>('following');
  const [query, setQuery] = useState('');
  // The opened story (summary + references + share reader). null = closed.
  const [selectedStory, setSelectedStory] = useState<ITeamNewsItem | null>(null);
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
      id: c.id as TeamNewsCategoryId,
      label: c.label,
      count: c.id === ALL_CAT ? itemsForActiveTab.length : itemsForActiveTab.filter((i) => i.eventType === c.id).length,
    }));

    if (activeDiscussionsCount === 0) return base;

    // Inject the news "Active Discussions" chip right after "All categories".
    const out: Array<{ id: TeamNewsCategoryId; label: string; count: number }> = [];
    for (const c of base) {
      out.push(c);
      if (c.id === ALL_CAT) out.push({ ...ACTIVE_DISCUSSIONS_CATEGORY, count: activeDiscussionsCount });
    }
    return out;
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
  // "Following" floats followed teams to the top (stable, so recency holds
  // within each group) without dropping anyone; "Latest" leaves order untouched.
  const lensedClusters = useMemo(() => {
    if (sort === 'popular') return [...clusters].sort((a, b) => clusterUpvotes(b) - clusterUpvotes(a));
    if (sort === 'following') {
      return [...clusters].sort((a, b) => Number(followedTeams.has(b.teamUid)) - Number(followedTeams.has(a.teamUid)));
    }
    return clusters;
  }, [clusters, sort, followedTeams]);

  // Forum threads for the active tab (All → all; else matched by focus area),
  // narrowed by the same search. Only interleave under "All categories" — an
  // event-type filter (Funding, Launch, …) has no forum equivalent.
  const searchedForum = useMemo(() => {
    if (activeCategory !== ALL_CAT) return [];
    const forTab = activeTab === ALL_TAB ? MOCK_FORUM_POSTS : MOCK_FORUM_POSTS.filter((p) => p.focusArea === activeTab);
    const q = query.trim().toLowerCase();
    if (!q) return forTab;
    return forTab.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.teaser.toLowerCase().includes(q),
    );
  }, [activeCategory, activeTab, query]);

  // Interleave team clusters and forum posts. Latest sorts by date; other sorts
  // keep the lensed team order and append forum threads (newest first).
  const feedEntries = useMemo<FeedEntry[]>(() => {
    const teamEntries: FeedEntry[] = lensedClusters.map((cluster) => {
      const newest = [cluster.lead, ...cluster.rest].reduce((max, i) => Math.max(max, new Date(i.eventDate).getTime()), 0);
      return { kind: 'team', date: newest, cluster };
    });
    const forumEntries: FeedEntry[] = searchedForum.map((post) => ({
      kind: 'forum',
      date: new Date(post.timestamp).getTime(),
      post,
    }));
    if (sort === 'latest') {
      return [...teamEntries, ...forumEntries].sort((a, b) => b.date - a.date);
    }
    return [...teamEntries, ...[...forumEntries].sort((a, b) => b.date - a.date)];
  }, [lensedClusters, searchedForum, sort]);

  const visibleEntries = expanded ? feedEntries : feedEntries.slice(0, PAGE_SIZE);
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
        {/* Desktop: production Cards grid. Mobile: stacked-card scroller. */}
        <div className={local.qaDesktop}>
          <QuickActionsMock />
        </div>
        <div className={local.qaMobile}>
          <MobileQuickActions />
        </div>

        <div className={styles.home__cn__teamnews}>
          {isEmpty(allItems) ? (
            <LocalNewsBase>
              <div className={s.empty}>No network news in the last 14 days yet. Check back soon.</div>
            </LocalNewsBase>
          ) : (
            <LocalNewsBase
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

                {/* Sort control opposite the event-type pills. Desktop: the
                  "Sort by: …" dropdown. Mobile: the compact "Sort ▾" pill from
                  the Teams/Members mobile filter pattern. */}
                <div className={local.filterActions}>
                  <span className={local.sortDesktop}>
                    <SortDropdown
                      sortByLabel="Sort by:"
                      options={SORT_OPTIONS}
                      currentSort={sort}
                      onSortChange={handleSort}
                    />
                  </span>
                  <span className={local.sortMobile}>
                    <MobileFeedSort options={SORT_OPTIONS} currentSort={sort} onSortChange={handleSort} />
                  </span>
                </div>
              </div>

              {feedEntries.length === 0 ? (
                <div className={s.empty}>
                  {query.trim() ? `Nothing in the feed matches “${query.trim()}”.` : 'Nothing in this filter.'}
                </div>
              ) : (
                <>
                  <div className={local.feedLayout}>
                    <div className={local.feedList}>
                      {visibleEntries.map((entry) =>
                        entry.kind === 'team' ? (
                          <V0FeedCard
                            key={`team-${entry.cluster.teamUid}`}
                            cluster={entry.cluster}
                            following={followedTeams.has(entry.cluster.teamUid)}
                            onToggleFollow={() => toggleFollow(entry.cluster.teamUid, entry.cluster.teamName)}
                            onOpenStory={setSelectedStory}
                            showUpvote
                          />
                        ) : (
                          <ForumPostCard key={`forum-${entry.post.tid}`} post={entry.post} />
                        ),
                      )}
                    </div>
                    {/* The follow-suggestions / popular / forum / digest rail. */}
                    <aside className={local.feedRail}>
                      <FeedRail followedTeams={followedTeams} onToggleFollow={toggleFollow} allItems={allItems} />
                    </aside>
                  </div>
                  {feedEntries.length > PAGE_SIZE && (
                    <div className={s.showAll}>
                      <Button style="border" variant="secondary" type="button" onClick={() => setExpanded((v) => !v)}>
                        {expanded ? 'Show Less' : 'Show All'}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </LocalNewsBase>
          )}
        </div>
      </div>

      {toast && (
        <FollowToast>
          You&apos;re now following {toast} — their updates will appear first in your feed. Manage who you follow from
          your profile.
        </FollowToast>
      )}

      {/* The opened news reader, shown as a modal over the feed. */}
      <NewsReader story={selectedStory} onClose={() => setSelectedStory(null)} />
    </div>
  );
}

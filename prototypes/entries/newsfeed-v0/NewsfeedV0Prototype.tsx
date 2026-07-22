'use client';

import clsx from 'clsx';
import isEmpty from 'lodash/isEmpty';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { FocusEvent, PropsWithChildren, ReactNode } from 'react';

import type { ITeamNewsItem, TeamNewsEventType } from '@/types/team-news.types';

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
// Reuse the production NewsBase section shell styling 1:1, but with our own
// heading copy ("Network Updates"). NewsBase is production and hardcodes its
// title, so we mirror its structure locally instead of editing it.
import nb from '@/components/page/home/TeamNews/components/NewsBase/NewsBase.module.scss';
import { NewsTabs } from './NewsTabs';

// Reuse the production feed layout styling 1:1.
import s from '@/components/page/home/TeamNews/TeamNews.module.scss';
// Production home-page shell (outer layout + section spacing), reused 1:1.
import styles from '@/app/home/page.module.css';

import { V0FeedCard } from './V0FeedCard';
import { ForumPostCard } from './ForumPostCard';
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
import { EVENT_TYPE_LABEL } from './eventMeta';
import {
  MOCK_GROUPS,
  FORUM_POSTS,
  BASE_LIKES,
  COMMENTS_BY_UID,
  SOURCES_BY_UID,
  MODAL_EXTRA_BY_UID,
  MODAL_CITED_BODY_BY_UID,
  type ForumPost,
  type FeedComment,
} from './mocks';
import { FeedDetailModal, type FeedDetail } from './FeedDetailModal';
import { ForumPostModal } from './ForumPostModal';
import local from './NewsfeedV0.module.scss';

const groups = MOCK_GROUPS;
const PAGE_SIZE = 6;

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

// The two interaction versions the prototype demonstrates (the "2 versions").
type InteractionMode = 'discuss' | 'comments';

const MODE_OPTIONS: Array<{ value: InteractionMode; label: string }> = [
  { value: 'discuss', label: 'Discuss' },
  { value: 'comments', label: 'Comments' },
];

const MODE_NOTE: Record<InteractionMode, string> = {
  discuss: 'News cards keep a “Discuss” link to the forum. Forum posts show likes only.',
  comments: 'News and forum posts both open an inline comment thread — no “Discuss” link.',
};


// Event kicker colours for the modal, matching the meta-line event palette
// (NewsfeedV0.module.scss .kFunding/.kLaunch/…).
const EVENT_HEX: Record<TeamNewsEventType, string> = {
  FUNDING: '#027a48',
  LAUNCH: '#1849a9',
  PARTNERSHIP: '#5925dc',
  ANNOUNCEMENT: '#475467',
  MILESTONE: '#b54708',
  OTHER: '#475467',
};

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

// A unified feed entry: either a team's news cluster or a single forum post.
type FeedEntry =
  | { kind: 'news'; cluster: TeamCluster }
  | { kind: 'forum'; post: ForumPost };

/**
 * Newsfeed redesign. Single-column feed mixing team news clusters and member
 * forum posts (author on top, same card style), with a follow-suggestions /
 * popular rail and fully-functional per-item likes. Personalization is a single
 * Sort control; a prototype-level switch flips between the two interaction
 * versions (Discuss link vs. inline Comments).
 */
/**
 * Local copy of the production `NewsBase` section shell (same SCSS module) with
 * the heading changed to "Network Updates". NewsBase is production and hardcodes
 * its title, so we mirror its structure here rather than editing it.
 */
function NetworkUpdatesBase({ headerDetails, children }: PropsWithChildren<{ headerDetails?: ReactNode }>) {
  return (
    <section className={nb.section}>
      <div className={nb.header}>
        <h2 className={clsx(nb.title, local.sectionTitle)}>Network Updates</h2>
        {headerDetails}
      </div>
      <p className={nb.sub}>Recent shipping, raises, partnerships, and milestones from across the network.</p>
      {children}
    </section>
  );
}

export default function NewsfeedV0Prototype() {
  // Tabs are base-ui / client-only — gate render so SSR === first client render.
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(ALL_TAB);
  const [activeCategory, setActiveCategory] = useState<TeamNewsCategoryId>(ALL_CAT);
  const [sort, setSort] = useState<Sort>('following');
  const [mode, setMode] = useState<InteractionMode>('discuss');
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Desktop expands an inline field from the header icon; mobile shows a
  // permanent full-width field in its own row. The ref focuses the desktop field
  // when it expands.
  const desktopFieldRef = useRef<HTMLDivElement>(null);
  const [followedTeams, setFollowedTeams] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  // Fully-functional likes: the viewer's likes live here (added on top of each
  // item's seed count), shared by every card and the detail modal.
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  // Comments the viewer posts stick for the session, seeded from the mocks.
  const [commentsByUid, setCommentsByUid] = useState<Record<string, FeedComment[]>>(() => ({ ...COMMENTS_BY_UID }));
  // The news story whose detail modal is open (null = closed).
  const [detail, setDetail] = useState<FeedDetail | null>(null);
  // The forum post whose simple-forum-post modal is open (null = closed).
  const [forumDetail, setForumDetail] = useState<ForumPost | null>(null);

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

  const toggleLike = (uid: string) =>
    setLikedIds((prev) => {
      const next = new Set(prev);
      next.has(uid) ? next.delete(uid) : next.add(uid);
      return next;
    });

  const likeCount = (uid: string) => (BASE_LIKES[uid] ?? 0) + (likedIds.has(uid) ? 1 : 0);
  const isLiked = (uid: string) => likedIds.has(uid);
  const commentsFor = (uid: string) => commentsByUid[uid] ?? [];

  const addComment = (uid: string, text: string) =>
    setCommentsByUid((prev) => {
      const existing = prev[uid] ?? [];
      const comment: FeedComment = {
        uid: `c-${uid}-${existing.length + 1}`,
        author: 'You',
        role: 'Member @ Protocol Labs',
        text,
        // Fixed timestamp — the prototype has no clock; "just now" reads right.
        createdAt: new Date().toISOString(),
      };
      return { ...prev, [uid]: [...existing, comment] };
    });

  const openStoryDetail = (story: ITeamNewsItem) =>
    setDetail({
      id: story.uid,
      kind: 'news',
      title: story.title,
      name: story.teamName,
      logoUrl: story.teamLogoUrl,
      kicker: EVENT_TYPE_LABEL[story.eventType],
      kickerColor: EVENT_HEX[story.eventType],
      // Modal-only: the fuller article body (short teaser stays on the card).
      summary: story.summary
        ? story.summary + (MODAL_EXTRA_BY_UID[story.uid] ? `\n\n${MODAL_EXTRA_BY_UID[story.uid]}` : '')
        : (MODAL_EXTRA_BY_UID[story.uid] ?? null),
      time: story.eventDate,
      sources: SOURCES_BY_UID[story.uid],
      citedBody: MODAL_CITED_BODY_BY_UID[story.uid],
      // Kept for Share (copies the article link) — the modal no longer renders a
      // "Read full article" link, but a Discuss button instead.
      readUrl: story.sourceUrl ?? undefined,
    });

  // Discuss version: a forum post lives in the forum, so send the user there
  // (new tab, so the prototype stays open) rather than opening a modal.
  // Comments version: open the simple-forum-post modal (with likes + comments).
  const openForumDetail = (post: ForumPost) => {
    if (mode === 'discuss') {
      window.open('/forum', '_blank', 'noopener,noreferrer');
      return;
    }
    setForumDetail(post);
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

  // Forum posts join the feed on the "All" event-type filter only (a post has no
  // event type, so an event filter necessarily excludes it). Scoped to the active
  // focus-area tab, then narrowed by the same free-text search.
  const forumPosts = useMemo(() => {
    if (activeCategory !== ALL_CAT) return [];
    const scoped = activeTab === ALL_TAB ? FORUM_POSTS : FORUM_POSTS.filter((p) => p.focusArea === activeTab);
    const q = query.trim().toLowerCase();
    if (!q) return scoped;
    return scoped.filter(
      (p) =>
        p.author.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        p.body.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }, [activeCategory, activeTab, query]);

  // Merge news clusters + forum posts into one list, then apply the sort lens.
  // A cluster's date/likes = its strongest story; a post's = its own. "Following"
  // floats followed teams up (forum posts rank as unfollowed), "Most popular" by
  // likes, "Latest" by recency — each with recency as the tie-break.
  const entries = useMemo<FeedEntry[]>(() => {
    const clusterDate = (c: TeamCluster) =>
      Math.max(...[c.lead, ...c.rest].map((i) => new Date(i.eventDate).getTime()));
    const clusterLikes = (c: TeamCluster) => Math.max(...[c.lead, ...c.rest].map((i) => likeCount(i.uid)));

    const dateOf = (e: FeedEntry) =>
      e.kind === 'news' ? clusterDate(e.cluster) : new Date(e.post.createdAt).getTime();
    const likesOf = (e: FeedEntry) => (e.kind === 'news' ? clusterLikes(e.cluster) : likeCount(e.post.uid));
    const followedOf = (e: FeedEntry) => (e.kind === 'news' && followedTeams.has(e.cluster.teamUid) ? 1 : 0);

    const list: FeedEntry[] = [
      ...clusters.map((cluster) => ({ kind: 'news' as const, cluster })),
      ...forumPosts.map((post) => ({ kind: 'forum' as const, post })),
    ];

    const sorted = list.sort((a, b) => {
      if (sort === 'popular' && likesOf(b) !== likesOf(a)) return likesOf(b) - likesOf(a);
      if (sort === 'following' && followedOf(b) !== followedOf(a)) return followedOf(b) - followedOf(a);
      return dateOf(b) - dateOf(a);
    });

    // Surface a forum post as the second item (right after the first team-news
    // card) so the news + discussion mix reads immediately.
    const firstNews = sorted.find((e) => e.kind === 'news');
    const firstForum = sorted.find((e) => e.kind === 'forum');
    if (firstNews && firstForum) {
      return [firstNews, firstForum, ...sorted.filter((e) => e !== firstNews && e !== firstForum)];
    }
    return sorted;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clusters, forumPosts, sort, followedTeams, likedIds]);

  const visibleEntries = expanded ? entries : entries.slice(0, PAGE_SIZE);
  const newCount = allItems.length + FORUM_POSTS.length;

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
            <NetworkUpdatesBase>
              <div className={s.empty}>No network news in the last 14 days yet. Check back soon.</div>
            </NetworkUpdatesBase>
          ) : (
            <NetworkUpdatesBase
              headerDetails={
                <div className={clsx(local.headerActions, local.headerActionsBanner)}>
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
                <SearchInput value={query} onChange={handleSearch} placeholder="Search by team, member, or keyword…" />
              </div>

              {/* Prototype-only: interaction version + citation style switches. */}
              <div className={local.versionRow}>
                <div className={local.switchBar}>
                  <span className={local.switchLabel}>Interactions</span>
                  <div className={local.switch} role="tablist" aria-label="Interaction version">
                    {MODE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        role="tab"
                        aria-selected={mode === opt.value}
                        className={clsx(local.switchBtn, mode === opt.value && local.switchBtnActive)}
                        onClick={() => setMode(opt.value)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <span className={local.switchNote}>{MODE_NOTE[mode]}</span>
                </div>
              </div>

              {/* Constrain the tabs' underline to end at the news-card's right edge
                (reserve the rail column), instead of spanning the full width. */}
              <div className={clsx(local.tabsConstrain, local.tabsConstrainBanner)}>
                <NewsTabs groups={groups} allItems={allItems} activeTab={activeTab} onTabChange={handleTab} />
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

              {entries.length === 0 ? (
                <div className={s.empty}>
                  {query.trim() ? `No updates match “${query.trim()}”.` : 'No updates in this filter.'}
                </div>
              ) : (
                <>
                  <div className={clsx(local.feedLayout, local.feedLayoutBanner)}>
                    <div className={local.feedList}>
                      {visibleEntries.map((entry) =>
                        entry.kind === 'news' ? (
                          <V0FeedCard
                            key={`news-${entry.cluster.teamUid}`}
                            cluster={entry.cluster}
                            following={followedTeams.has(entry.cluster.teamUid)}
                            onToggleFollow={() => toggleFollow(entry.cluster.teamUid, entry.cluster.teamName)}
                            interactionMode={mode}
                            likeCount={likeCount}
                            isLiked={isLiked}
                            onToggleLike={toggleLike}
                            commentsFor={commentsFor}
                            onAddComment={addComment}
                            onOpenStory={openStoryDetail}
                          />
                        ) : (
                          <ForumPostCard
                            key={`forum-${entry.post.uid}`}
                            post={entry.post}
                            interactionMode={mode}
                            likeCount={likeCount(entry.post.uid)}
                            liked={isLiked(entry.post.uid)}
                            onToggleLike={() => toggleLike(entry.post.uid)}
                            comments={commentsFor(entry.post.uid)}
                            onAddComment={(text) => addComment(entry.post.uid, text)}
                            onOpenDetail={() => openForumDetail(entry.post)}
                          />
                        ),
                      )}
                    </div>
                    {/* Follow-suggestions / popular rail in the reserved column. */}
                    <aside className={local.feedRail}>
                      <FeedRail followedTeams={followedTeams} onToggleFollow={toggleFollow} allItems={allItems} />
                    </aside>
                  </div>
                  {entries.length > PAGE_SIZE && (
                    <div className={s.showAll}>
                      <Button style="border" variant="secondary" type="button" onClick={() => setExpanded((v) => !v)}>
                        {expanded ? 'Show Less' : 'Show All'}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </NetworkUpdatesBase>
          )}
        </div>
      </div>

      <FeedDetailModal
        detail={detail}
        onClose={() => setDetail(null)}
        likeCount={detail ? likeCount(detail.id) : 0}
        liked={detail ? isLiked(detail.id) : false}
        onToggleLike={() => detail && toggleLike(detail.id)}
        citationStyle="superscript"
        showComments={mode === 'comments'}
        comments={detail ? commentsFor(detail.id) : []}
        onAddComment={(text) => detail && addComment(detail.id, text)}
      />

      <ForumPostModal
        post={forumDetail}
        onClose={() => setForumDetail(null)}
        likeCount={forumDetail ? likeCount(forumDetail.uid) : 0}
        liked={forumDetail ? isLiked(forumDetail.uid) : false}
        onToggleLike={() => forumDetail && toggleLike(forumDetail.uid)}
        comments={forumDetail ? commentsFor(forumDetail.uid) : []}
        onAddComment={(text) => forumDetail && addComment(forumDetail.uid, text)}
      />

      {toast && (
        <FollowToast>
          You&apos;re now following {toast} — their updates will appear first in your feed. Manage who you follow from
          your profile.
        </FollowToast>
      )}
    </div>
  );
}

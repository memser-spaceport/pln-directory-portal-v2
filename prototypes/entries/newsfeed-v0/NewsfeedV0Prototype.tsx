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
import { hasExistingDiscussion } from '@/components/page/home/TeamNews/utils/hasExistingDiscussion';
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
  viewsFor,
  COMMENTS_BY_UID,
  SOURCES_BY_UID,
  MODAL_EXTRA_BY_UID,
  MODAL_CITED_BODY_BY_UID,
  VIDEO_BY_UID,
  PL_TEAM_UID,
  type ForumPost,
  type FeedComment,
} from './mocks';
import { FeedDetailModal, type FeedDetail } from './FeedDetailModal';
import { ForumPostModal } from './ForumPostModal';
import { SavedFilterBanner } from './SavedFilterBanner';
import { SavedFilterChip } from './SavedFilterChip';
import {
  DEFAULT_VIEW,
  loadStored,
  readViewParams,
  SAVED_FILTER_STORAGE_KEY,
  saveStored,
  VIEW_STORAGE_KEY,
  writeViewParams,
  type FeedSort,
  type FeedView,
} from './feedView';
import local from './NewsfeedV0.module.scss';

const groups = MOCK_GROUPS;
const PAGE_SIZE = 6;

// One personalization axis: sort order. Following is a *ranking* here, not a
// hard filter — "Following" floats followed teams to the top without
// hiding the rest, so the network-wide feed stays intact. It's the default, so
// it leads the list (like Reddit's "Best").
const SORT_OPTIONS = [
  { value: 'following', label: 'Following' },
  { value: 'latest', label: 'Latest' },
  { value: 'popular', label: 'Most popular' },
] as const;

// The two versions the prototype demonstrates: news + posts with an inline
// comment thread, or without any comment affordance (Like + Share only).
type CommentsMode = 'with' | 'without';

const MODE_OPTIONS: Array<{ value: CommentsMode; label: string }> = [
  { value: 'without', label: 'Without comments' },
  { value: 'with', label: 'With comments' },
];

const MODE_NOTE: Record<CommentsMode, string> = {
  with: 'News and posts open an inline comment thread (Like · Share · Comments).',
  without: 'News and posts show Like and Share only — no comment thread.',
};

// Two versions of "make a narrowed feed stick", on the same foundation: the view
// (tab · category · sort · search) is one addressable object either way, carried
// in the URL so a filtered feed is shareable.
//
// The saved-*collection* option (named views + chips) is parked in
// `SavedViewsBar.tsx` — a feed with four tabs doesn't earn a collection.
type Personalization = 'off' | 'filter';

const PERSONALIZATION_OPTIONS: Array<{ value: Personalization; label: string }> = [
  { value: 'off', label: 'Off' },
  { value: 'filter', label: 'Saved filter' },
];

const PERSONALIZATION_NOTE: Record<Personalization, string> = {
  off: 'The feed quietly reopens on your last view. Nothing is saved explicitly.',
  filter: 'A banner offers to save the filters you’re using; the feed opens on them next time.',
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
type FeedEntry = { kind: 'news'; cluster: TeamCluster } | { kind: 'forum'; post: ForumPost };

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
  // The four filter/rank axes as one value: what gets restored, shared, saved,
  // and subscribed to. Starts at the default so SSR === first client render;
  // the stored/URL view lands in the mount effect below.
  const [view, setView] = useState<FeedView>(DEFAULT_VIEW);
  const { tab: activeTab, category: activeCategory, sort, query } = view;
  const [commentsMode, setCommentsMode] = useState<CommentsMode>('without');
  const [personalization, setPersonalization] = useState<Personalization>('filter');
  /** The one saved filter (mocked; null = nothing saved). */
  const [savedFilter, setSavedFilter] = useState<FeedView | null>(null);
  /** Banner dismissed for this session — it must not nag on a daily surface. */
  const [bannerDismissed, setBannerDismissed] = useState(false);
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

  // Restore the view once, after mount, so the server render and the first
  // client render still match. Priority: a shared link → your saved filter →
  // the view you last left. The saved filter outranks the implicit last-view
  // restore deliberately: two invisible mechanisms competing over what you see
  // is worse than one explicit one, and "the feed opens where I saved it" is
  // the whole payoff of saving.
  useEffect(() => {
    const saved = loadStored<FeedView | null>(SAVED_FILTER_STORAGE_KEY, null);
    const fromUrl = readViewParams(new URLSearchParams(window.location.search));
    const restored = fromUrl ?? saved ?? loadStored<FeedView | null>(VIEW_STORAGE_KEY, null);
    if (saved) setSavedFilter({ ...DEFAULT_VIEW, ...saved });
    if (restored) setView({ ...DEFAULT_VIEW, ...restored });
    setMounted(true);
  }, []);

  // Mirror the view into the URL + storage. replaceState (not router.replace)
  // for the same reason `useNewsDeepLink` uses it: filtering must not refetch
  // the page, and it composes with the `?news=` param already living there.
  useEffect(() => {
    if (!mounted) return;
    saveStored(VIEW_STORAGE_KEY, view);
    const qs = writeViewParams(new URLSearchParams(window.location.search), view).toString();
    window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);
  }, [view, mounted]);

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

  /** `parentUid` set = the new comment is a reply nested under that comment. */
  const addComment = (uid: string, text: string, parentUid?: string) =>
    setCommentsByUid((prev) => {
      const existing = prev[uid] ?? [];
      const comment: FeedComment = {
        // `-new-` keeps posted uids from ever colliding with a seeded one —
        // nesting keys off uid, so a duplicate would swallow a comment.
        uid: `c-${uid}-new-${existing.length + 1}`,
        author: 'You',
        role: 'Member @ Protocol Labs',
        text,
        // Fixed timestamp — the prototype has no clock; "just now" reads right.
        createdAt: new Date().toISOString(),
        parentUid,
      };
      return { ...prev, [uid]: [...existing, comment] };
    });

  /** `playVideo` = the card's poster was clicked, so the modal opens playing. */
  const openStoryDetail = (story: ITeamNewsItem, playVideo = false) =>
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
      views: viewsFor(story.uid),
      sources: SOURCES_BY_UID[story.uid],
      citedBody: MODAL_CITED_BODY_BY_UID[story.uid],
      video: VIDEO_BY_UID[story.uid],
      autoplayVideo: playVideo,
      isProtocolLabs: story.teamUid === PL_TEAM_UID,
      // Kept for Share (copies the article link) — the modal no longer renders a
      // "Read full article" link, but a Discuss button instead.
      readUrl: story.sourceUrl ?? undefined,
    });

  // Discuss version: a forum post lives in the forum, so send the user there
  // (new tab, so the prototype stays open) rather than opening a modal.
  // Comments version: open the simple-forum-post modal (with likes + comments).
  const openForumDetail = (post: ForumPost) => {
    // if (mode === 'discuss') {
    //   window.open('/forum', '_blank', 'noopener,noreferrer');
    //   return;
    // }
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

  /** Every axis moves through here; it also collapses the page back to the
   *  first batch. The banner's dismissal is deliberately NOT reset — re-offering
   *  on every pill click is how a banner becomes wallpaper. */
  const updateView = (patch: Partial<FeedView>) => {
    setView((prev) => ({ ...prev, ...patch }));
    setExpanded(false);
  };

  // Switching focus area resets the event-type pill (a category count only makes
  // sense within its tab).
  const handleTab = (id: string) => updateView({ tab: id, category: ALL_CAT });

  const handleCategory = (id: TeamNewsCategoryId) => updateView({ category: id });

  const handleSort = (value: string) => updateView({ sort: value as FeedSort });

  const handleSearch = (value: string) => updateView({ query: value });

  // One saved filter, no naming step: saving overwrites, clearing removes. The
  // singleton is the point — it's what makes "your feed opens here" unambiguous.
  const saveCurrentFilter = () => {
    setSavedFilter(view);
    saveStored(SAVED_FILTER_STORAGE_KEY, view);
  };

  const clearSavedFilter = () => {
    setSavedFilter(null);
    saveStored(SAVED_FILTER_STORAGE_KEY, null);
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

              {/* Prototype-only: toggle the comments version on/off. */}
              <div className={local.versionRow}>
                <div className={local.switchBar}>
                  <span className={local.switchLabel}>Comments</span>
                  <div className={local.switch} role="tablist" aria-label="Comments version">
                    {MODE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        role="tab"
                        aria-selected={commentsMode === opt.value}
                        className={clsx(local.switchBtn, commentsMode === opt.value && local.switchBtnActive)}
                        onClick={() => setCommentsMode(opt.value)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <span className={local.switchNote}>{MODE_NOTE[commentsMode]}</span>
                </div>

                <div className={local.switchBar}>
                  <span className={local.switchLabel}>Personalization</span>
                  <div className={local.switch} role="tablist" aria-label="Personalization version">
                    {PERSONALIZATION_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        role="tab"
                        aria-selected={personalization === opt.value}
                        className={clsx(local.switchBtn, personalization === opt.value && local.switchBtnActive)}
                        onClick={() => setPersonalization(opt.value)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <span className={local.switchNote}>{PERSONALIZATION_NOTE[personalization]}</span>
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
                  {/* Standing entry point back to the saved filter — the banner
                      is a one-time offer, this is where the filter lives after. */}
                  {personalization === 'filter' && savedFilter && (
                    <SavedFilterChip
                      savedFilter={savedFilter}
                      view={view}
                      onApply={() => {
                        setView(savedFilter);
                        setExpanded(false);
                      }}
                      onClear={clearSavedFilter}
                    />
                  )}
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
                      {/* Above the results the filters just produced — the job
                          board's slot (toolbar → banner → list), and the reason
                          that affordance converts where a rail module doesn't. */}
                      {personalization === 'filter' && !bannerDismissed && (
                        <SavedFilterBanner
                          view={view}
                          savedFilter={savedFilter}
                          onSave={saveCurrentFilter}
                          onDismiss={() => setBannerDismissed(true)}
                        />
                      )}
                      {visibleEntries.map((entry) =>
                        entry.kind === 'news' ? (
                          <V0FeedCard
                            key={`news-${entry.cluster.teamUid}`}
                            cluster={entry.cluster}
                            following={followedTeams.has(entry.cluster.teamUid)}
                            onToggleFollow={() => toggleFollow(entry.cluster.teamUid, entry.cluster.teamName)}
                            showComments={commentsMode === 'with'}
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
                            showComments={commentsMode === 'with'}
                            likeCount={likeCount(entry.post.uid)}
                            liked={isLiked(entry.post.uid)}
                            onToggleLike={() => toggleLike(entry.post.uid)}
                            comments={commentsFor(entry.post.uid)}
                            onAddComment={(text, parentUid) => addComment(entry.post.uid, text, parentUid)}
                            isCommentLiked={isLiked}
                            onToggleCommentLike={toggleLike}
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
                    <div className={clsx(s.showAll, local.showAllConstrain)}>
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
        showComments={commentsMode === 'with'}
        comments={detail ? commentsFor(detail.id) : []}
        onAddComment={(text, parentUid) => detail && addComment(detail.id, text, parentUid)}
        isCommentLiked={isLiked}
        onToggleCommentLike={toggleLike}
      />

      <ForumPostModal
        post={forumDetail}
        onClose={() => setForumDetail(null)}
        likeCount={forumDetail ? likeCount(forumDetail.uid) : 0}
        liked={forumDetail ? isLiked(forumDetail.uid) : false}
        onToggleLike={() => forumDetail && toggleLike(forumDetail.uid)}
        comments={forumDetail ? commentsFor(forumDetail.uid) : []}
        onAddComment={(text, parentUid) => forumDetail && addComment(forumDetail.uid, text, parentUid)}
        isCommentLiked={isLiked}
        onToggleCommentLike={toggleLike}
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

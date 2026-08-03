'use client';

/**
 * REUSE MAP — what this entry imports rather than rebuilds.
 *
 * Production (never edited, imported 1:1):
 *   NewsCard.module.scss ............ card shell, logo, headline, teamName
 *   TeamNews.module.scss ............ .catRow/.cat/.catActive pills, .empty, .showAll
 *   NewsBase.module.scss ............ section shell (mirrored locally for our own heading)
 *   app/home/page.module.css ........ outer home layout + section spacing
 *   TeamGroupCard.module.scss ....... jobs "View all N …" expander
 *   SortDropdown, SearchInput ....... @/components/common/filters
 *   Button .......................... @/components/common/Button
 *   FollowButton .................... @/components/ui/FollowButton (rail size)
 *   getTeamLogoFallback, formatTimeAgo, dedupeByUid, sortAllTabItemsByEventDate,
 *   hasExistingDiscussion, CATEGORIES / ALL_CAT / ACTIVE_DISCUSSIONS_*
 *
 * Sibling prototypes (shared, not forked):
 *   ../newsfeed-v0 .................. V0FeedCard, ForumPostCard, FeedDetailModal,
 *                                     ForumPostModal, NewsTabs, MobileFeedSort,
 *                                     HeaderSearch, SourceList, ShareMenu,
 *                                     FeedActions, eventMeta, QuickActions, mocks
 *   ../follow-shared ................ FollowButton (xs/tertiary), FollowToast
 *
 * New here (and only here): TopStoryCard, HiringCard, CuratedRail, EmailDigest.
 */

import clsx from 'clsx';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { FocusEvent, PropsWithChildren, ReactNode } from 'react';

import type { ITeamNewsItem, TeamNewsEventType } from '@/types/team-news.types';

import { Button } from '@/components/common/Button';
import { SortDropdown } from '@/components/common/filters/SortDropdown';
import { SearchInput } from '@/components/common/filters/SearchInput';

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

import nb from '@/components/page/home/TeamNews/components/NewsBase/NewsBase.module.scss';
import s from '@/components/page/home/TeamNews/TeamNews.module.scss';
import styles from '@/app/home/page.module.css';

import { NewsTabs } from '../newsfeed-v0/NewsTabs';
import { V0FeedCard } from '../newsfeed-v0/V0FeedCard';
import { ForumPostCard } from '../newsfeed-v0/ForumPostCard';
import type { TeamCluster } from '../newsfeed-v0/V0NewsCard';
import { QuickActionsMock } from '../newsfeed-v0/QuickActionsMock';
import { MobileQuickActions } from '../newsfeed-v0/MobileQuickActions';
import { MobileFeedSort } from '../newsfeed-v0/MobileFeedSort';
import { HeaderSearch } from '../newsfeed-v0/HeaderSearch';
import { FeedDetailModal, type FeedDetail } from '../newsfeed-v0/FeedDetailModal';
import { ForumPostModal } from '../newsfeed-v0/ForumPostModal';
import { EVENT_TYPE_LABEL } from '../newsfeed-v0/eventMeta';
import { FollowToast } from '../follow-shared/FollowToast';
import {
  MOCK_GROUPS,
  FORUM_POSTS,
  BASE_LIKES,
  COMMENTS_BY_UID,
  SOURCES_BY_UID,
  MODAL_EXTRA_BY_UID,
  MODAL_CITED_BODY_BY_UID,
  VIDEO_BY_UID,
  PL_TEAM_UID,
  type ForumPost,
  type FeedComment,
} from '../newsfeed-v0/mocks';

import { TopStoryCard } from './TopStoryCard';
import { HiringCard } from './HiringCard';
import { CuratedRail } from './CuratedRail';
import { EmailDigest } from './EmailDigest';
import {
  ALL_CURATED_ITEMS,
  CURATION_ATTRIBUTION,
  FOCUS_AREAS,
  FOCUS_BY_UID,
  GROUPED_ITEMS,
  HIRING_SIGNALS,
  OFF_FOCUS_ITEMS,
  SUPERSEDED_BY_HIRING,
  TOP_STORY,
} from './mocks';

import v0 from '../newsfeed-v0/NewsfeedV0.module.scss';
import local from './NewsfeedCurated.module.scss';

const PAGE_SIZE = 6;

type Sort = 'latest' | 'popular' | 'following';

const SORT_OPTIONS = [
  { value: 'following', label: 'Following' },
  { value: 'latest', label: 'Latest' },
  { value: 'popular', label: 'Most popular' },
] as const;

/** Which surface you're looking at. The email is the one that ships first. */
type View = 'feed' | 'email';

/**
 * The sourcing comparison this prototype exists to make.
 *
 * `today` reproduces production exactly: the feed is fed by
 * grouped-by-focus-area, and TeamNews.tsx derives its All tab as
 * `groups.flatMap(g => g.items)`. An item in no focus-area group is in no tab —
 * so the three untagged stories, including the one we'd lead the week with,
 * simply do not exist here.
 *
 * `curated` makes one ranked stream the spine and demotes focus area to a
 * filter, so the untagged long tail is reachable.
 */
type Spine = 'today' | 'curated';

const SPINE_OPTIONS: Array<{ value: Spine; label: string }> = [
  { value: 'today', label: 'Focus-area tabs (today)' },
  { value: 'curated', label: 'One stream (proposed)' },
];

const SPINE_NOTE: Record<Spine, string> = {
  today: `Focus area is the container. ${OFF_FOCUS_ITEMS.length} untagged stories — including this week's top story — cannot appear in any tab, including All.`,
  curated: 'One ranked stream is the spine; focus area is a filter. The untagged long tail is reachable again.',
};

/** Who picked the top story. Start human — prove the pick before automating it. */
type Curator = 'human' | 'ai';

const CURATOR_OPTIONS: Array<{ value: Curator; label: string }> = [
  { value: 'human', label: 'Human' },
  { value: 'ai', label: 'AI' },
];

const CURATOR_NOTE: Record<Curator, string> = {
  human: 'Weeks 1–4: an editor picks and writes the why-line. No model, no risk, and the misses get logged.',
  ai: 'Once the criteria are proven, the model ranks and justifies — and discloses that it did.',
};

const HIRING_CAT = 'hiring' as const;

const EVENT_HEX: Record<TeamNewsEventType, string> = {
  FUNDING: '#027a48',
  LAUNCH: '#1849a9',
  PARTNERSHIP: '#5925dc',
  ANNOUNCEMENT: '#475467',
  MILESTONE: '#b54708',
  OTHER: '#475467',
};

// Cluster helpers mirror newsfeed-v0's (they're local there, not exported).
// Lead = most important, not most recent: event weight dominates, discussion
// adds, recency only breaks ties.
const EVENT_TYPE_WEIGHT: Record<TeamNewsEventType, number> = {
  FUNDING: 5,
  LAUNCH: 4,
  PARTNERSHIP: 3,
  MILESTONE: 2,
  ANNOUNCEMENT: 1,
  OTHER: 0,
};

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

type FeedEntry =
  | { kind: 'news'; cluster: TeamCluster }
  | { kind: 'forum'; post: ForumPost }
  | { kind: 'hiring'; signal: (typeof HIRING_SIGNALS)[number] };

/** Local copy of production `NewsBase` with our own heading. */
function NetworkUpdatesBase({ headerDetails, children }: PropsWithChildren<{ headerDetails?: ReactNode }>) {
  return (
    <section className={nb.section}>
      <div className={nb.header}>
        <h2 className={clsx(nb.title, v0.sectionTitle)}>Network Updates</h2>
        {headerDetails}
      </div>
      <p className={nb.sub}>Recent shipping, raises, partnerships, and milestones from across the network.</p>
      {children}
    </section>
  );
}

export default function NewsfeedCuratedPrototype() {
  const [mounted, setMounted] = useState(false);

  // Prototype-level switches.
  const [view, setView] = useState<View>('feed');
  const [spine, setSpine] = useState<Spine>('curated');
  const [curator, setCurator] = useState<Curator>('human');

  // Feed state.
  const [activeTab, setActiveTab] = useState<string>(ALL_TAB);
  const [activeFocus, setActiveFocus] = useState<string>(ALL_TAB);
  const [activeCategory, setActiveCategory] = useState<string>(ALL_CAT);
  const [sort, setSort] = useState<Sort>('following');
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const desktopFieldRef = useRef<HTMLDivElement>(null);
  const [followedTeams, setFollowedTeams] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [commentsByUid, setCommentsByUid] = useState<Record<string, FeedComment[]>>(() => ({ ...COMMENTS_BY_UID }));
  const [detail, setDetail] = useState<FeedDetail | null>(null);
  const [forumDetail, setForumDetail] = useState<ForumPost | null>(null);

  useEffect(() => setMounted(true), []);

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

  const addComment = (uid: string, text: string, parentUid?: string) =>
    setCommentsByUid((prev) => {
      const existing = prev[uid] ?? [];
      const comment: FeedComment = {
        uid: `c-${uid}-new-${existing.length + 1}`,
        author: 'You',
        role: 'Member @ Protocol Labs',
        text,
        createdAt: new Date().toISOString(),
        parentUid,
      };
      return { ...prev, [uid]: [...existing, comment] };
    });

  const openStoryDetail = (story: ITeamNewsItem, playVideo = false) =>
    setDetail({
      id: story.uid,
      kind: 'news',
      title: story.title,
      name: story.teamName,
      logoUrl: story.teamLogoUrl,
      kicker: EVENT_TYPE_LABEL[story.eventType],
      kickerColor: EVENT_HEX[story.eventType],
      summary: story.summary
        ? story.summary + (MODAL_EXTRA_BY_UID[story.uid] ? `\n\n${MODAL_EXTRA_BY_UID[story.uid]}` : '')
        : (MODAL_EXTRA_BY_UID[story.uid] ?? null),
      time: story.eventDate,
      sources: SOURCES_BY_UID[story.uid],
      citedBody: MODAL_CITED_BODY_BY_UID[story.uid],
      video: VIDEO_BY_UID[story.uid],
      autoplayVideo: playVideo,
      isProtocolLabs: story.teamUid === PL_TEAM_UID,
      readUrl: story.sourceUrl ?? undefined,
    });

  // ---------- The spine ----------

  /**
   * `today` = exactly what grouped-by-focus-area can return. `curated` = that,
   * plus the untagged stories no group can hold.
   */
  const sourceItems = useMemo(() => {
    if (spine === 'today') return sortAllTabItemsByEventDate(dedupeByUid(GROUPED_ITEMS));
    // On the curated spine the hiring roll-up carries the "opened N roles" fact,
    // so the one-off announcement of the same thing is dropped rather than said twice.
    return sortAllTabItemsByEventDate(dedupeByUid(ALL_CURATED_ITEMS)).filter((i) => !SUPERSEDED_BY_HIRING.has(i.uid));
  }, [spine]);

  const topStoryItem = useMemo(() => sourceItems.find((i) => i.uid === TOP_STORY.uid) ?? null, [sourceItems]);
  const showTopStory = spine === 'curated' && topStoryItem !== null;

  // The hero owns the top story, so it must not also appear as a feed card.
  const feedPool = useMemo(
    () => (showTopStory ? sourceItems.filter((i) => i.uid !== TOP_STORY.uid) : sourceItems),
    [sourceItems, showTopStory],
  );

  // `today`: focus area gates the whole feed (tabs). `curated`: it narrows it (filter).
  const scopedItems = useMemo(() => {
    if (spine === 'today') {
      if (activeTab === ALL_TAB) return feedPool;
      return feedPool.filter((i) => FOCUS_BY_UID[i.uid] === activeTab);
    }
    if (activeFocus === ALL_TAB) return feedPool;
    return feedPool.filter((i) => FOCUS_BY_UID[i.uid] === activeFocus);
  }, [spine, activeTab, activeFocus, feedPool]);

  const showHiring = spine === 'curated';

  const categoriesWithCounts = useMemo(() => {
    const activeDiscussionsCount = scopedItems.filter((i) => hasExistingDiscussion(i.discussion)).length;
    const base = CATEGORIES.map((c) => ({
      ...c,
      count: c.id === ALL_CAT ? scopedItems.length : scopedItems.filter((i) => i.eventType === c.id).length,
    }));

    const out: Array<{ id: string; label: string; count: number }> = [];
    for (const c of base) {
      out.push(c);
      if (c.id === ALL_CAT && activeDiscussionsCount > 0) {
        out.push({ ...ACTIVE_DISCUSSIONS_CATEGORY, count: activeDiscussionsCount });
      }
    }
    // Hiring joins the same pill row as a synthetic category, the way production
    // already injects "Active Discussions".
    if (showHiring) out.push({ id: HIRING_CAT, label: 'Hiring', count: HIRING_SIGNALS.length });
    return out;
  }, [scopedItems, showHiring]);

  const filteredItems = useMemo(() => {
    if (activeCategory === ALL_CAT) return scopedItems;
    if (activeCategory === HIRING_CAT) return [];
    if (activeCategory === ACTIVE_DISCUSSIONS_CAT) {
      return scopedItems.filter((i) => hasExistingDiscussion(i.discussion));
    }
    return scopedItems.filter((i) => i.eventType === activeCategory);
  }, [activeCategory, scopedItems]);

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

  const forumPosts = useMemo(() => {
    if (activeCategory !== ALL_CAT) return [];
    const scoped =
      spine === 'today'
        ? activeTab === ALL_TAB
          ? FORUM_POSTS
          : FORUM_POSTS.filter((p) => p.focusArea === activeTab)
        : activeFocus === ALL_TAB
          ? FORUM_POSTS
          : FORUM_POSTS.filter((p) => p.focusArea === activeFocus);
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
  }, [activeCategory, activeTab, activeFocus, spine, query]);

  /**
   * Hiring is supporting signal, not the story — so the mixed feed carries at
   * most two roll-ups. Without the cap they crowd out the news (they're the
   * freshest items every week) and the feed reads as a job board, which is the
   * exact failure mode this shape exists to avoid. The Hiring pill shows all of them.
   */
  const HIRING_IN_MIXED_FEED = 2;

  const hiringEntries = useMemo(() => {
    if (!showHiring) return [];
    if (activeCategory !== ALL_CAT && activeCategory !== HIRING_CAT) return [];
    const q = query.trim().toLowerCase();
    const matched = q
      ? HIRING_SIGNALS.filter(
          (h) => h.teamName.toLowerCase().includes(q) || h.roles.some((r) => r.title.toLowerCase().includes(q)),
        )
      : HIRING_SIGNALS;
    return activeCategory === HIRING_CAT ? matched : matched.slice(0, HIRING_IN_MIXED_FEED);
  }, [showHiring, activeCategory, query]);

  const entries = useMemo<FeedEntry[]>(() => {
    const clusterDate = (c: TeamCluster) =>
      Math.max(...[c.lead, ...c.rest].map((i) => new Date(i.eventDate).getTime()));
    const clusterLikes = (c: TeamCluster) => Math.max(...[c.lead, ...c.rest].map((i) => likeCount(i.uid)));

    const dateOf = (e: FeedEntry) =>
      e.kind === 'news'
        ? clusterDate(e.cluster)
        : e.kind === 'forum'
          ? new Date(e.post.createdAt).getTime()
          : new Date(e.signal.date).getTime();
    const likesOf = (e: FeedEntry) =>
      e.kind === 'news' ? clusterLikes(e.cluster) : e.kind === 'forum' ? likeCount(e.post.uid) : 0;
    const followedOf = (e: FeedEntry) => {
      const uid = e.kind === 'news' ? e.cluster.teamUid : e.kind === 'hiring' ? e.signal.teamUid : null;
      return uid && followedTeams.has(uid) ? 1 : 0;
    };

    const list: FeedEntry[] = [
      ...clusters.map((cluster) => ({ kind: 'news' as const, cluster })),
      ...forumPosts.map((post) => ({ kind: 'forum' as const, post })),
      ...hiringEntries.map((signal) => ({ kind: 'hiring' as const, signal })),
    ];

    const sorted = list.sort((a, b) => {
      if (sort === 'popular' && likesOf(b) !== likesOf(a)) return likesOf(b) - likesOf(a);
      if (sort === 'following' && followedOf(b) !== followedOf(a)) return followedOf(b) - followedOf(a);
      return dateOf(b) - dateOf(a);
    });

    // Hiring is the freshest thing most weeks, so on pure recency it takes the
    // top of the feed — and an investor opening to a wall of job roll-ups reads
    // this as a job board. News leads; hiring keeps its place below it.
    if (sorted[0]?.kind === 'hiring') {
      const firstStory = sorted.find((e) => e.kind !== 'hiring');
      if (firstStory) return [firstStory, ...sorted.filter((e) => e !== firstStory)];
    }
    return sorted;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clusters, forumPosts, hiringEntries, sort, followedTeams, likedIds]);

  const visibleEntries = expanded ? entries : entries.slice(0, PAGE_SIZE);
  const newCount = sourceItems.length + FORUM_POSTS.length;

  const resetPaging = () => setExpanded(false);

  const handleSpine = (next: Spine) => {
    setSpine(next);
    setActiveTab(ALL_TAB);
    setActiveFocus(ALL_TAB);
    setActiveCategory(ALL_CAT);
    resetPaging();
  };

  const handleFieldBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    const live = e.currentTarget.querySelector('input')?.value ?? '';
    if (!live.trim()) setSearchOpen(false);
  };

  useEffect(() => {
    if (!searchOpen) return;
    desktopFieldRef.current?.querySelector('input')?.focus();
  }, [searchOpen]);

  const focusOptions = useMemo(
    () => [{ value: ALL_TAB, label: 'All focus areas' }, ...FOCUS_AREAS.map((f) => ({ value: f, label: f }))],
    [],
  );

  const attribution = CURATION_ATTRIBUTION[curator];

  // The email leads with the top story and lists the rest — ranked, deduped by
  // team so one team can't take the whole edition.
  const digestItems = useMemo(() => {
    const seen = new Set<string>();
    return (
      sortAllTabItemsByEventDate(dedupeByUid(ALL_CURATED_ITEMS))
        .filter((i) => i.uid !== TOP_STORY.uid)
        // The email has its own hiring section, so the same fact doesn't get a
        // second line above it.
        .filter((i) => !SUPERSEDED_BY_HIRING.has(i.uid))
        .filter((i) => {
          if (seen.has(i.teamUid)) return false;
          seen.add(i.teamUid);
          return true;
        })
        .slice(0, 6)
    );
  }, []);

  if (!mounted) return <div className={v0.page} />;

  const prototypeControls = (
    <div className={local.controlBar}>
      <div className={local.controlGroup}>
        <span className={local.controlLabel}>View</span>
        <div className={v0.switch} role="tablist" aria-label="View">
          {(
            [
              { value: 'feed', label: 'Feed' },
              { value: 'email', label: 'Email digest' },
            ] as Array<{ value: View; label: string }>
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="tab"
              aria-selected={view === opt.value}
              className={clsx(v0.switchBtn, view === opt.value && v0.switchBtnActive)}
              onClick={() => setView(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <span className={v0.switchNote}>
          {view === 'email'
            ? 'Ships first: tests the editorial pick with no UI risk, and logs what the feed missed.'
            : 'Where the email lands when someone clicks through.'}
        </span>
      </div>

      {view === 'feed' && (
        <div className={local.controlGroup}>
          <span className={local.controlLabel}>Sourcing</span>
          <div className={v0.switch} role="tablist" aria-label="Sourcing spine">
            {SPINE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="tab"
                aria-selected={spine === opt.value}
                className={clsx(v0.switchBtn, spine === opt.value && v0.switchBtnActive)}
                onClick={() => handleSpine(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <span className={clsx(v0.switchNote, spine === 'today' && local.switchNoteWarn)}>{SPINE_NOTE[spine]}</span>
        </div>
      )}

      <div className={local.controlGroup}>
        <span className={local.controlLabel}>Curated by</span>
        <div className={v0.switch} role="tablist" aria-label="Curator">
          {CURATOR_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="tab"
              aria-selected={curator === opt.value}
              className={clsx(v0.switchBtn, curator === opt.value && v0.switchBtnActive)}
              onClick={() => setCurator(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <span className={v0.switchNote}>{CURATOR_NOTE[curator]}</span>
      </div>
    </div>
  );

  if (view === 'email') {
    return (
      <div className={clsx(v0.page, local.emailPage)}>
        <div className={local.emailWrap}>
          {prototypeControls}
          {topStoryItem && (
            <EmailDigest
              topStoryItem={topStoryItem}
              top={TOP_STORY}
              attribution={attribution}
              isAi={curator === 'ai'}
              items={digestItems}
              hiring={HIRING_SIGNALS}
              forumPosts={FORUM_POSTS.slice(0, 2)}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={clsx(v0.page, styles.home)}>
      <div className={styles.home__cn}>
        <div className={v0.qaDesktop}>
          <QuickActionsMock />
        </div>
        <div className={v0.qaMobile}>
          <MobileQuickActions />
        </div>

        <div className={styles.home__cn__teamnews}>
          <NetworkUpdatesBase
            headerDetails={
              <div className={clsx(v0.headerActions, v0.headerActionsBanner)}>
                {newCount > 0 && <span className={s.unreadBadge}>{newCount} new</span>}
                <HeaderSearch
                  open={searchOpen}
                  value={query}
                  onOpen={() => setSearchOpen(true)}
                  onChange={(value) => {
                    setQuery(value);
                    resetPaging();
                  }}
                  onBlur={handleFieldBlur}
                  fieldRef={desktopFieldRef}
                />
              </div>
            }
          >
            <div className={v0.mobileSearchRow}>
              <SearchInput
                value={query}
                onChange={(value) => {
                  setQuery(value);
                  resetPaging();
                }}
                placeholder="Search by team, member, or keyword…"
              />
            </div>

            <div className={v0.versionRow}>{prototypeControls}</div>

            {/* Today's spine: focus area as tabs. Proposed: no tabs at all — the
                stream is the spine and focus area moves beside Sort. */}
            {spine === 'today' && (
              <div className={clsx(v0.tabsConstrain, v0.tabsConstrainBanner)}>
                <NewsTabs
                  groups={MOCK_GROUPS}
                  allItems={sourceItems}
                  activeTab={activeTab}
                  onTabChange={(id) => {
                    setActiveTab(id);
                    setActiveCategory(ALL_CAT);
                    resetPaging();
                  }}
                />
              </div>
            )}

            {showTopStory && topStoryItem && (
              <div className={clsx(v0.tabsConstrain, v0.tabsConstrainBanner, local.topSlot)}>
                <TopStoryCard
                  story={topStoryItem}
                  top={TOP_STORY}
                  attribution={attribution}
                  isAi={curator === 'ai'}
                  following={followedTeams.has(topStoryItem.teamUid)}
                  onToggleFollow={() => toggleFollow(topStoryItem.teamUid, topStoryItem.teamName)}
                  likeCount={likeCount(topStoryItem.uid)}
                  liked={isLiked(topStoryItem.uid)}
                  onToggleLike={() => toggleLike(topStoryItem.uid)}
                  onOpen={() => openStoryDetail(topStoryItem)}
                />
              </div>
            )}

            <div className={v0.filterBar}>
              <div className={s.catRow}>
                {categoriesWithCounts.map((c) => {
                  const isActive = activeCategory === c.id;
                  const isDisabled = c.count === 0 && c.id !== ALL_CAT;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      className={clsx(s.cat, { [s.catActive]: isActive })}
                      onClick={() => {
                        setActiveCategory(c.id);
                        resetPaging();
                      }}
                      disabled={isDisabled}
                    >
                      {c.label}
                      {c.count > 0 && c.id !== ALL_CAT && <span>{c.count}</span>}
                    </button>
                  );
                })}
              </div>

              <div className={v0.filterActions}>
                {/* Focus area, demoted: one filter among several rather than the
                    container the whole feed is built out of. */}
                {spine === 'curated' && (
                  <span className={local.focusFilter}>
                    <SortDropdown
                      sortByLabel="Focus:"
                      options={focusOptions}
                      currentSort={activeFocus}
                      onSortChange={(value) => {
                        setActiveFocus(value);
                        resetPaging();
                      }}
                    />
                  </span>
                )}
                <span className={v0.sortDesktop}>
                  <SortDropdown
                    sortByLabel="Sort by:"
                    options={SORT_OPTIONS}
                    currentSort={sort}
                    onSortChange={(value) => {
                      setSort(value as Sort);
                      resetPaging();
                    }}
                  />
                </span>
                <span className={v0.sortMobile}>
                  <MobileFeedSort
                    options={SORT_OPTIONS}
                    currentSort={sort}
                    onSortChange={(value) => {
                      setSort(value as Sort);
                      resetPaging();
                    }}
                  />
                </span>
              </div>
            </div>

            {/* The gap, stated inline on the spine that has it. */}
            {spine === 'today' && (
              <div className={clsx(v0.tabsConstrain, v0.tabsConstrainBanner, local.gapNote)}>
                <strong>{OFF_FOCUS_ITEMS.length} stories are missing from this view.</strong> They carry no focus area,
                so they belong to no group — and the All tab is built as the union of the groups. Switch the sourcing
                spine above to see them.
              </div>
            )}

            {entries.length === 0 ? (
              <div className={s.empty}>
                {query.trim() ? `No updates match “${query.trim()}”.` : 'No updates in this filter.'}
              </div>
            ) : (
              <>
                <div className={clsx(v0.feedLayout, v0.feedLayoutBanner)}>
                  <div className={v0.feedList}>
                    {visibleEntries.map((entry) => {
                      if (entry.kind === 'news') {
                        return (
                          <V0FeedCard
                            key={`news-${entry.cluster.teamUid}`}
                            cluster={entry.cluster}
                            following={followedTeams.has(entry.cluster.teamUid)}
                            onToggleFollow={() => toggleFollow(entry.cluster.teamUid, entry.cluster.teamName)}
                            showComments
                            likeCount={likeCount}
                            isLiked={isLiked}
                            onToggleLike={toggleLike}
                            commentsFor={commentsFor}
                            onAddComment={addComment}
                            onOpenStory={openStoryDetail}
                          />
                        );
                      }
                      if (entry.kind === 'hiring') {
                        return (
                          <HiringCard
                            key={`hiring-${entry.signal.uid}`}
                            signal={entry.signal}
                            following={followedTeams.has(entry.signal.teamUid)}
                            onToggleFollow={() => toggleFollow(entry.signal.teamUid, entry.signal.teamName)}
                          />
                        );
                      }
                      return (
                        <ForumPostCard
                          key={`forum-${entry.post.uid}`}
                          post={entry.post}
                          showComments
                          likeCount={likeCount(entry.post.uid)}
                          liked={isLiked(entry.post.uid)}
                          onToggleLike={() => toggleLike(entry.post.uid)}
                          comments={commentsFor(entry.post.uid)}
                          onAddComment={(text, parentUid) => addComment(entry.post.uid, text, parentUid)}
                          isCommentLiked={isLiked}
                          onToggleCommentLike={toggleLike}
                          onOpenDetail={() => setForumDetail(entry.post)}
                        />
                      );
                    })}
                  </div>
                  <aside className={v0.feedRail}>
                    <CuratedRail
                      followedTeams={followedTeams}
                      onToggleFollow={toggleFollow}
                      allItems={sourceItems}
                      onPreviewDigest={() => setView('email')}
                    />
                  </aside>
                </div>
                {entries.length > PAGE_SIZE && (
                  <div className={clsx(s.showAll, v0.showAllConstrain)}>
                    <Button style="border" variant="secondary" type="button" onClick={() => setExpanded((v) => !v)}>
                      {expanded ? 'Show Less' : 'Show All'}
                    </Button>
                  </div>
                )}
              </>
            )}
          </NetworkUpdatesBase>
        </div>
      </div>

      <FeedDetailModal
        detail={detail}
        onClose={() => setDetail(null)}
        likeCount={detail ? likeCount(detail.id) : 0}
        liked={detail ? isLiked(detail.id) : false}
        onToggleLike={() => detail && toggleLike(detail.id)}
        citationStyle="superscript"
        showComments
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

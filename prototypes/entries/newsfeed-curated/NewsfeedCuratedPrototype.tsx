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
 *   DealCard.module.scss ............ vendor avatar + audience tag (perk card)
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
 * New here (and only here): TopStoryCard, HiringCard, PerkCard, CuratedRail.
 *
 * EmailDigest.tsx is still in this folder but is no longer mounted — the digest
 * view was removed from this prototype. Kept because the Monday email is the
 * thing that ships before the feed UI; it wants its own entry, not a tab here.
 */

import clsx from 'clsx';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { FocusEvent, PropsWithChildren, ReactNode } from 'react';

import type { ITeamNewsItem, TeamNewsEventType } from '@/types/team-news.types';

import { Button } from '@/components/common/Button';
import { SortDropdown } from '@/components/common/filters/SortDropdown';
import { SearchInput } from '@/components/common/filters/SearchInput';

import {
  DISCUSSIONS_CAT,
  DISCUSSIONS_CATEGORY,
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
import { isNarrowed, summarizeView, viewHashKey, type FeedView } from '../newsfeed-v0/feedView';
import { SavedFilterChip } from '../newsfeed-v0/SavedFilterChip';
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
  UPVOTES,
  type ForumPost,
  type FeedComment,
} from '../newsfeed-v0/mocks';

import { TopStoriesBlock } from './TopStoriesBlock';
import { HiringCard } from './HiringCard';
import { PerkCard } from './PerkCard';

import { FollowTeamsScroller } from './FollowTeamsScroller';
import { PopularScroller } from './PopularScroller';
import { SubscribeBanner } from './SubscribeBanner';
import { CuratedRail } from './CuratedRail';
import type { Subscription } from './subscription';
import {
  ALL_CURATED_ITEMS,
  CURATION_ATTRIBUTION,
  FOCUS_BY_UID,
  HIRING_SIGNALS,
  PERK_SIGNALS,
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

/**
 * Sourcing note, for the record.
 *
 * Production feeds the home stream from grouped-by-focus-area and derives its All
 * tab as `groups.flatMap(g => g.items)` — so an item in no focus-area group is in
 * no tab, including All. This prototype does not reproduce that: one ranked
 * stream is the spine and focus area is a filter over it, which is what makes the
 * untagged long tail (and this week's top story) reachable at all.
 *
 * The cost of that choice stays visible in the rail's Coverage card, which counts
 * the stories carrying no focus area.
 */

/**
 * The prototype's Path / Mix / Curated-by switches have been removed; the feed
 * now renders one settled configuration:
 *
 *   Path       — Read only. `MonitorView.tsx` is still in this folder but is no
 *                longer mounted: Monitor is a separate surface, not a tab here,
 *                and it wants its own entry.
 *   Mix        — hiring and deals both on, with their caps intact
 *                (`HIRING_IN_MIXED_FEED` = 2, `PERKS_IN_MIXED_FEED` = 1) and news
 *                still holding the top slot.
 *   Curated by — human. The attribution line reads "Picked by the network team";
 *                `CURATION_ATTRIBUTION.ai` stays in the mock for when a model
 *                takes the pick over.
 */

const HIRING_CAT = 'hiring' as const;
const DEALS_CAT = 'deals' as const;

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
  | { kind: 'hiring'; signal: (typeof HIRING_SIGNALS)[number] }
  | { kind: 'perk'; perk: (typeof PERK_SIGNALS)[number] };

/** News and discussion are the feed's reason to exist; everything else is supporting. */
const isStory = (e: FeedEntry) => e.kind === 'news' || e.kind === 'forum';

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

  // Feed state.
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

  // One subscription, shared by both paths — see `subscription.ts`.
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [subscribeDismissed, setSubscribeDismissed] = useState(false);
  const [subToast, setSubToast] = useState<string | null>(null);

  /**
   * Both doors go through here, so subscribing always confirms and always points
   * at where it can be changed. A notification the reader can't find the switch
   * for is the fastest way to lose the permission again.
   */
  const handleSubscribe = (next: Subscription) => {
    setSubscription(next);
    setSubToast(next.label);
  };

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!subToast) return;
    const t = setTimeout(() => setSubToast(null), 6000);
    return () => clearTimeout(t);
  }, [subToast]);

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

  // ---------- The view, as one addressable value ----------

  /**
   * The four axes collapsed into `FeedView` (`../newsfeed-v0/feedView`), which is
   * what makes "is this narrowed?" a single question instead of four scattered
   * comparisons — and what a subscription is made *of*.
   */
  const view: FeedView = useMemo(
    () => ({ tab: activeFocus, category: activeCategory as FeedView['category'], sort, query }),
    [activeFocus, activeCategory, sort, query],
  );

  const narrowed = isNarrowed(view);

  // ---------- The spine ----------

  // Both on, permanently — the caps below are what keep them from crowding news.
  const showHiring = true;
  const showPerks = true;

  /** One ranked stream: the grouped items plus the untagged stories no group holds. */
  const sourceItems = useMemo(() => {
    const items = sortAllTabItemsByEventDate(dedupeByUid(ALL_CURATED_ITEMS));
    // The hiring roll-up carries the "opened N roles" fact, so the one-off
    // announcement of the same thing is dropped rather than said twice. With
    // hiring switched off the roll-up isn't there to carry it, so it stays.
    return showHiring ? items.filter((i) => !SUPERSEDED_BY_HIRING.has(i.uid)) : items;
  }, [showHiring]);

  /**
   * Monitor reads the whole week, unfiltered by the editorial levers — a standing
   * query must not silently inherit a curator's choices, and the Mix switch isn't
   * even visible on that path.
   */
  const topStoryItem = useMemo(() => sourceItems.find((i) => i.uid === TOP_STORY.uid) ?? null, [sourceItems]);

  const alsoItems = useMemo(
    () => TOP_STORY.alsoUids.map((uid) => sourceItems.find((i) => i.uid === uid)).filter(Boolean) as ITeamNewsItem[],
    [sourceItems],
  );

  /**
   * The block is what you get when you've asked for nothing in particular.
   *
   * One predicate, two complementary outcomes: unfiltered, the curator tells you
   * what mattered; filtered, you've said what matters to you and the subscribe
   * offer takes over. Gating on `isNarrowed` rather than on the focus tab alone
   * also fixes the case where a category pill ("Funding") left a global pick
   * sitting on top of a filtered view.
   */
  const showTopStory = topStoryItem !== null && !narrowed;

  /** Every uid the block owns, so none of them can also appear as a feed card. */
  const blockUids = useMemo(() => new Set([TOP_STORY.uid, ...alsoItems.map((i) => i.uid)]), [alsoItems]);

  /**
   * The block owns its stories only where the block renders. Keyed on
   * `showTopStory` rather than on the items, so a pick that carries a focus area
   * demotes to an ordinary card inside its own tab instead of vanishing from the
   * block and the stream at once.
   */
  const feedPool = useMemo(
    () => (showTopStory ? sourceItems.filter((i) => !blockUids.has(i.uid)) : sourceItems),
    [sourceItems, showTopStory, blockUids],
  );

  /**
   * Focus area narrows the stream; it does not contain it. That distinction is
   * what keeps the untagged stories reachable — they sit under All, which is also
   * the only tab the hero appears in.
   */
  const scopedItems = useMemo(() => {
    if (activeFocus === ALL_TAB) return feedPool;
    return feedPool.filter((i) => FOCUS_BY_UID[i.uid] === activeFocus);
  }, [activeFocus, feedPool]);

  /**
   * Tab counts come from `sourceItems`, not `feedPool`. `feedPool` now varies with
   * the active tab (the hero is extracted only under All), and a badge that reads
   * 14 on one tab and 15 on the next is a defect. Counting the whole stream keeps
   * every badge stable and literally true — the hero is a story in All, just
   * rendered bigger.
   */
  const tabGroups = useMemo(
    () =>
      MOCK_GROUPS.map((g) => ({
        ...g,
        total: sourceItems.filter((i) => FOCUS_BY_UID[i.uid] === g.focusArea.title).length,
      })),
    [sourceItems],
  );

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
        out.push({ ...DISCUSSIONS_CATEGORY, count: activeDiscussionsCount });
      }
    }
    // Hiring joins the same pill row as a synthetic category, the way production
    // already injects "Active Discussions". Deals follows the same pattern — and
    // its count is deliberately the full set, so the gap between what exists and
    // what earned a feed slot is one click away.
    if (showHiring) out.push({ id: HIRING_CAT, label: 'Hiring', count: HIRING_SIGNALS.length });
    if (showPerks) out.push({ id: DEALS_CAT, label: 'Deals', count: PERK_SIGNALS.length });
    return out;
  }, [scopedItems, showHiring, showPerks]);

  /**
   * The same list the pills rendered, shaped for a dropdown.
   *
   * Counts fold into the label because `SortDropdown` options are plain strings.
   * Empty categories are dropped rather than disabled: the component has no
   * disabled state, and a menu listing choices you cannot pick is worse than a
   * pill row where they are visibly greyed. The trade is that a category with
   * nothing this week disappears instead of showing as greyed-out.
   */
  const categoryOptions = useMemo(
    () =>
      categoriesWithCounts
        .filter((c) => c.id === ALL_CAT || c.count > 0)
        .map((c) => ({ value: c.id, label: c.id === ALL_CAT ? c.label : `${c.label} (${c.count})` })),
    [categoriesWithCounts],
  );

  const filteredItems = useMemo(() => {
    if (activeCategory === ALL_CAT) return scopedItems;
    if (activeCategory === HIRING_CAT || activeCategory === DEALS_CAT) return [];
    if (activeCategory === DISCUSSIONS_CAT) {
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
    const scoped = activeFocus === ALL_TAB ? FORUM_POSTS : FORUM_POSTS.filter((p) => p.focusArea === activeFocus);
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
  }, [activeCategory, activeFocus, query]);

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

  /**
   * Deals get a tighter cap than hiring, and a shape test on top of it: a perk
   * only enters the mixed feed if something *happened* to it. A standing offer is
   * true every week, so in a dated stream it is an ad — and it's shown to an
   * audience that is mostly not eligible to redeem it.
   */
  const PERKS_IN_MIXED_FEED = 1;

  const perkEntries = useMemo(() => {
    if (!showPerks) return [];
    if (activeCategory !== ALL_CAT && activeCategory !== DEALS_CAT) return [];
    const q = query.trim().toLowerCase();
    const matched = q
      ? PERK_SIGNALS.filter(
          (p) => p.vendorName.toLowerCase().includes(q) || p.shortDescription.toLowerCase().includes(q),
        )
      : PERK_SIGNALS;
    // The pill shows everything /deals holds; the feed shows only what earned it.
    if (activeCategory === DEALS_CAT) return matched;
    return matched.filter((p) => p.shape === 'announcement').slice(0, PERKS_IN_MIXED_FEED);
  }, [showPerks, activeCategory, query]);

  const entries = useMemo<FeedEntry[]>(() => {
    const clusterDate = (c: TeamCluster) =>
      Math.max(...[c.lead, ...c.rest].map((i) => new Date(i.eventDate).getTime()));
    const clusterLikes = (c: TeamCluster) => Math.max(...[c.lead, ...c.rest].map((i) => likeCount(i.uid)));

    const dateOf = (e: FeedEntry) => {
      if (e.kind === 'news') return clusterDate(e.cluster);
      if (e.kind === 'forum') return new Date(e.post.createdAt).getTime();
      if (e.kind === 'hiring') return new Date(e.signal.date).getTime();
      return new Date(e.perk.date).getTime();
    };
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
      ...perkEntries.map((perk) => ({ kind: 'perk' as const, perk })),
    ];

    const sorted = list.sort((a, b) => {
      if (sort === 'popular' && likesOf(b) !== likesOf(a)) return likesOf(b) - likesOf(a);
      if (sort === 'following' && followedOf(b) !== followedOf(a)) return followedOf(b) - followedOf(a);
      return dateOf(b) - dateOf(a);
    });

    // Hiring and deals are the freshest things most weeks, so on pure recency
    // they take the top of the feed — and an investor opening to a wall of job
    // roll-ups and vendor perks reads this as a job board with ads. A story
    // always leads; the supporting kinds keep their place below it.
    if (sorted[0] && !isStory(sorted[0])) {
      const firstStory = sorted.find(isStory);
      if (firstStory) return [firstStory, ...sorted.filter((e) => e !== firstStory)];
    }
    return sorted;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clusters, forumPosts, hiringEntries, perkEntries, sort, followedTeams, likedIds]);

  const visibleEntries = expanded ? entries : entries.slice(0, PAGE_SIZE);
  const newCount = sourceItems.length + FORUM_POSTS.length;

  /**
   * Popular this week, ranked once and rendered twice: the rail card on desktop,
   * the in-feed strip below 960px.
   *
   * Drawn from `feedPool`, so where the block is showing it can't repeat the
   * pick — the strip sits directly under it on mobile. Stories further down the
   * feed can still appear: surfacing what you haven't scrolled to yet is the
   * point of the module.
   */
  const popularItems = [...feedPool].sort((a, b) => (UPVOTES[b.uid] ?? 0) - (UPVOTES[a.uid] ?? 0)).slice(0, 3);

  const resetPaging = () => setExpanded(false);

  // Category counts are computed within the active focus area, so changing focus
  // has to drop you back to All rather than into a pill that now holds nothing.
  const handleFocus = (next: string) => {
    setActiveFocus(next);
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

  const attribution = CURATION_ATTRIBUTION.human;

  const renderEntry = (entry: FeedEntry) => {
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
    if (entry.kind === 'perk') {
      return (
        <PerkCard key={`perk-${entry.perk.uid}`} perk={entry.perk} offFeed={entry.perk.shape !== 'announcement'} />
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
  };

  if (!mounted) return <div className={v0.page} />;

  /* Rendered on both paths — Monitor returns early, and a subscription set there
     needs the same confirmation. */
  const subscribeToast = subToast ? (
    <FollowToast>
      You&apos;ll be notified about <strong>{subToast}</strong> — new matches will appear in your notifications. Manage
      what you get from <a href="/settings/recommendations">Settings</a>.
    </FollowToast>
  ) : null;

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

            {/* Navigation first, then content: focus tabs, category pills, and only
                then the week's picks. The two filter rows read as a hierarchy —
                which part of the network, then what kind of update — and the
                editorial block leads the content rather than the page. */}
            <div className={clsx(v0.tabsConstrain, v0.tabsConstrainBanner, local.focusTabs)}>
              {/* allItems drives the All badge, so it takes the whole stream —
                  same reason as tabGroups: badges must not move as you navigate. */}
              <NewsTabs groups={tabGroups} allItems={sourceItems} activeTab={activeFocus} onTabChange={handleFocus} />
            </div>

            {/* Event type is pills on desktop, a dropdown below 640px — the same
                split `v0.sortDesktop` / `v0.sortMobile` already make for Sort.
                Desktop has the width to show every type and its count at a glance;
                on a 390px screen the same row wraps to three lines of chrome
                before any news. */}
            <div className={v0.filterBar}>
              <div className={clsx(s.catRow, local.catRowDesktop)}>
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

              <div className={clsx(v0.filterActions, local.filterActionsLeft)}>
                {/* Once subscribed, the chip is the standing way back to that
                    filter — the banner is a one-time offer and goes quiet. */}
                {subscription?.view && (
                  <SavedFilterChip
                    savedFilter={subscription.view}
                    view={view}
                    onApply={() => {
                      const saved = subscription.view!;
                      setActiveFocus(saved.tab);
                      setActiveCategory(saved.category);
                      setSort(saved.sort as Sort);
                      setQuery(saved.query);
                      resetPaging();
                    }}
                    onClear={() => setSubscription(null)}
                  />
                )}
                {/* Mobile only — the pill row above holds desktop. */}
                <span className={v0.sortMobile}>
                  <MobileFeedSort
                    label="Type:"
                    options={categoryOptions}
                    currentSort={activeCategory}
                    onSortChange={(value) => {
                      setActiveCategory(value);
                      resetPaging();
                    }}
                  />
                </span>
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

            {narrowed && !subscription && !subscribeDismissed && (
              <div className={clsx(v0.tabsConstrain, v0.tabsConstrainBanner)}>
                <SubscribeBanner
                  label={summarizeView(view)}
                  onSubscribe={() =>
                    handleSubscribe({
                      key: viewHashKey(view),
                      label: summarizeView(view),
                      source: 'feed',
                      view,
                    })
                  }
                  onDismiss={() => setSubscribeDismissed(true)}
                />
              </div>
            )}

            {/* The Deals pill is the exhibit: everything /deals holds, including
                the entries that did not earn a place in the stream. */}
            {activeCategory === DEALS_CAT && (
              <div className={clsx(v0.tabsConstrain, v0.tabsConstrainBanner, local.pillNote)}>
                All {PERK_SIGNALS.length} perks, including the{' '}
                {PERK_SIGNALS.filter((p) => p.shape !== 'announcement').length} the feed did not carry. This is what
                &ldquo;add deals to the feed&rdquo; injects if nothing filters it — standing offers with no event behind
                them, most of them gated to an audience the average reader isn&apos;t in.
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
                    {/* The block lives in the feed column of the *same* grid as the
                        rail, so the rail runs as one continuous column: Teams to
                        follow, then Popular this week, Coverage, digest — no gap
                        where the block used to sit in a grid of its own. */}
                    {showTopStory && topStoryItem && (
                      <TopStoriesBlock
                        lead={topStoryItem}
                        also={alsoItems}
                        top={TOP_STORY}
                        attribution={attribution}
                        followedTeams={followedTeams}
                        onToggleFollow={toggleFollow}
                        likeCount={likeCount}
                        isLiked={isLiked}
                        onToggleLike={toggleLike}
                        onOpenStory={openStoryDetail}
                      />
                    )}

                    {/* Below 960px the rail stacks under the whole feed, which put
                        Teams to follow ~3 screens down. This lifts it to just under
                        the block; the rail copy hides at those widths so exactly one
                        instance is ever on screen. */}
                    {showTopStory && (
                      <div className={local.followScrollSlot}>
                        <FollowTeamsScroller followedTeams={followedTeams} onToggleFollow={toggleFollow} />
                      </div>
                    )}

                    {/* Straight after Teams to follow, so the two lifted rail
                        modules stay in their rail order instead of one of them
                        turning up mid-stream. Unconditional, unlike the scroller:
                        Popular is in the rail at every filter, so the strip
                        stands in for it at every filter too. */}
                    <div className={local.popularScrollSlot}>
                      <PopularScroller items={popularItems} />
                    </div>

                    {visibleEntries.map(renderEntry)}
                  </div>
                  <aside className={v0.feedRail}>
                    <CuratedRail
                      followedTeams={followedTeams}
                      onToggleFollow={toggleFollow}
                      popularItems={popularItems}
                      /* Hidden below 960px only while the scroller is rendering.
                         When the block goes (narrowed view) the scroller goes with
                         it, and the rail takes the module back at every width. */
                      followCardClassName={showTopStory ? local.hideBelowDesktop : undefined}
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

      {subscribeToast}
    </div>
  );
}

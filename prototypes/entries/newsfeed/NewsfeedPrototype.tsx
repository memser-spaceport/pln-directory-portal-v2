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
 *   Welcome.module.scss ............. the signed-out banner (SignedOutBanner) —
 *                                     production's own `!isLoggedIn` card in
 *                                     production's own slot on this route
 *   SortDropdown, SearchInput ....... @/components/common/filters
 *   Button .......................... @/components/common/Button
 *   FollowButton .................... @/components/ui/FollowButton (rail size)
 *   JobAlertShell + JobAlertBanner.module.scss .. the aside slab (ForYouBanner)
 *   getTeamLogoFallback, formatTimeAgo, dedupeByUid, sortAllTabItemsByEventDate,
 *   hasExistingDiscussion, CATEGORIES / ALL_CAT / FOR_YOU_* / ACTIVE_DISCUSSIONS_*
 *
 * Sibling prototypes (shared, not forked):
 *   ../newsfeed-v0 .................. V0FeedCard, ForumPostCard, FeedDetailModal,
 *                                     ForumPostModal, NewsTabs, MobileFeedSort,
 *                                     HeaderSearch, SourceList, ShareMenu,
 *                                     FeedActions, eventMeta, QuickActions, mocks
 *   ../follow-shared ................ FollowButton (xs/tertiary), FollowToast
 *   ../job-board .................... SignInBanner.module.scss `.inlineDoor`,
 *                                     so the prototypes' two signed-out asks
 *                                     wear one door rather than two lookalikes
 *
 * New here (and only here): TopStoryCard, HiringCard, PerkCard, CuratedRail,
 * ForYouBanner, SignedOutBanner.
 *
 * EmailDigest.tsx is still in this folder but is no longer mounted — the digest
 * view was removed from this prototype. Kept because the Monday email is the
 * thing that ships before the feed UI; it wants its own entry, not a tab here.
 */

import clsx from 'clsx';
import { useRouter } from 'next/navigation';
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
  FOR_YOU_CAT,
  FOR_YOU_CATEGORY,
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
import { FollowToast } from '../follow-shared/FollowToast';
// Replaces the inherited production header/bottom bar, both hidden by
// nav-shared's stylesheet. This route IS Home, so it has to render the nav that
// says so — inheriting production's chrome here showed a navbar with no route
// back to the page you were standing on.
import { PrototypeNavBar } from '../nav-shared/PrototypeNavBar';
import { PrototypeMobileNav } from '../nav-shared/PrototypeMobileNav';
import { getTeamNews, teamNameFor } from '../news-shared/mockTeamNews';
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

import { ForYouBanner } from './ForYouBanner';
import { SignedOutBanner } from './SignedOutBanner';
import { FollowTeamsScroller } from './FollowTeamsScroller';
import { PopularScroller } from './PopularScroller';
import { SubscribeBanner } from './SubscribeBanner';
import { CuratedRail } from './CuratedRail';
import type { Subscription } from './subscription';
import {
  ALL_CURATED_ITEMS,
  FOCUS_BY_UID,
  FOR_YOU_TEAM_UIDS,
  HIRING_SIGNALS,
  PERK_SIGNALS,
  SUPERSEDED_BY_HIRING,
  TOP_STORY,
} from './mocks';

import v0 from '../newsfeed-v0/NewsfeedV0.module.scss';
import local from './Newsfeed.module.scss';

const PAGE_SIZE = 6;

/**
 * Set back to true to re-enable the week's editorial top-stories block.
 *
 * Same shape production uses for `SHOW_POPULAR_THIS_WEEK` / `SHOW_HIRING_NEWS`
 * in `TeamNews/constants` — a named switch rather than a deletion, because this
 * is "not right now", not "never". Everything it feeds stays wired: with the
 * flag off the three picks are not extracted from the stream, so the lead and
 * its two runners-up come back as ordinary feed cards instead of vanishing from
 * the week (`feedPool` already handles that — it only subtracts `blockUids`
 * while the block is showing).
 *
 * Note the knock-on, which is correct rather than a bug: the For You pill reads
 * one higher with the block off, because the pick it used to own is a card in
 * the feed again and every pill counts what is under it.
 */
const SHOW_TOP_STORIES = false;

/**
 * Whether the For You slice has anything at all this week — production's
 * `hasForYouNews`, computed over the whole stream rather than the active tab so
 * the landing view can't depend on which tab the reader is standing in. Static,
 * because the mock corpus is.
 */
const HAS_FOR_YOU_NEWS = ALL_CURATED_ITEMS.some((i) => FOR_YOU_TEAM_UIDS.includes(i.teamUid));

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
 *   Curated by — human, but the card no longer says so: the attribution line was
 *                cut from the eyebrow. `CURATION_ATTRIBUTION` stays in the mock
 *                for the email digest, which still states who picked.
 *
 * The one switch left is **who is reading**: a Preview as pair — Signed in /
 * Signed out — in a review band under the navbar. Signed out is the visitor with
 * no account: no Quick Actions, no For You pill, no Following ranking and no
 * inline subscribe banner, with `SignedOutBanner` in production's own
 * `!isLoggedIn` slot making the personalization offer. The rail's digest card
 * stays up in both states on purpose — its Subscribe signs you in first and then
 * lands the click, so it is an offer a stranger can take rather than one they
 * are shown and refused.
 *
 * That state used to be reachable only as `?viewer=logged-out`, on the argument
 * that a state picker parked over the feed is chrome on the one thing being
 * judged. The argument holds for a picker *inside* the page, which is why this
 * one isn't: it sits in the same band the job board's five viewer states use
 * (`../job-board/JobBoardPrototype.module.scss` `.reviewBand`) — outside the
 * content column, and not sticky, so it scrolls away and leaves the feed to be
 * read on its own. The param still works and the switch writes it back to the
 * address bar, so either state stays linkable; what it costs is that leaving the
 * signed-out view no longer needs a reload, and reaching it no longer needs
 * someone to have read this comment.
 */

const HIRING_CAT = 'hiring' as const;
const DEALS_CAT = 'deals' as const;

/**
 * The two readers this feed is drawn for.
 *
 * `logged-out` is the value the address bar already used (`?viewer=logged-out`,
 * the job board's convention), so the switch and the link name the same state.
 * The labels say "Signed" rather than "Logged": `Sign in / Sign up / Sign out`
 * is the product's settled auth vocabulary, and a review control that reads
 * "Logged out" while every door on the page says "Sign in" teaches the reader a
 * second word for one thing. (The job board's own switch still says "Logged
 * out" — same class of label, different entry, so it is named here rather than
 * swept.)
 */
const VIEWER_OPTIONS = [
  { value: 'member', label: 'Signed in' },
  { value: 'logged-out', label: 'Signed out' },
] as const;

type FeedViewer = (typeof VIEWER_OPTIONS)[number]['value'];

const VIEWER_NOTE: Record<FeedViewer, string> = {
  member: 'Quick Actions, For You as the view you land in, the Following ranking, and the email subscribe banner.',
  'logged-out':
    'No account, so no For You and no Following: the feed rests on All / Latest, and the signed-out home banner makes the personalization offer.',
};

const EVENT_HEX: Record<TeamNewsEventType, string> = {
  FUNDING: '#027a48',
  LAUNCH: '#1849a9',
  PARTNERSHIP: '#5925dc',
  ANNOUNCEMENT: '#475467',
  MILESTONE: '#b54708',
  OTHER: '#475467',
  HIRING: '#475467',
  DEALS: '#475467',
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
  HIRING: 0,
  DEALS: 0,
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

/**
 * Land `el` at the top of the reading area — the arrival for `?focus=<teamUid>`.
 *
 * `scrollIntoView` alone can't do it for a team near the end of the feed: the
 * page runs out of scroll before the card reaches the top, so it stops wherever
 * the floor is and the reader arrives on a card sitting a third of the way down
 * with a stranger's card above it. Measured: Protocol Labs' cluster settled at
 * 279px against Filecoin Foundation's 96px, purely because the feed bottoms out
 * — the scroll was already at its maximum, not drifting.
 *
 * So lay down exactly as much runway as the shortfall needs (usually none — any
 * cluster with a viewport of feed under it already reaches the top) and then
 * scroll. Precise rather than a blanket `padding-bottom: 100vh`: dead space at
 * the end of a feed is a lie about how much there is to read, and this adds the
 * minimum that makes the card reachable — often zero.
 *
 * The scroller is `document.body`, not the document element: portal-v2's layout
 * scrolls the body, which is why `window.scrollY` reads 0 here at every scroll
 * position.
 */
function landAtTop(el: Element) {
  const scroller = document.body;
  const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
  const elTop = el.getBoundingClientRect().top + scroller.scrollTop;
  const shortfall = elTop - margin - (scroller.scrollHeight - scroller.clientHeight);
  if (shortfall > 0) scroller.style.paddingBottom = `${Math.ceil(shortfall)}px`;
  el.scrollIntoView({ block: 'start' });
}

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

export default function NewsfeedPrototype() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Feed state.
  const [activeFocus, setActiveFocus] = useState<string>(ALL_TAB);
  /**
   * For You is where you land, production's rule (`TeamNews.tsx` opens on
   * `FOR_YOU_CAT` whenever that slice has anything in it). The pill was worth
   * little as an opt-in: a reader who has never pressed it cannot know the feed
   * could be about them, so the personalization only pays off for people who
   * already went looking. Falls back to All on a week with no matches, so the
   * landing view is never an empty one.
   */
  const [activeCategory, setActiveCategory] = useState<string>(HAS_FOR_YOU_NEWS ? FOR_YOU_CAT : ALL_CAT);
  const [sort, setSort] = useState<Sort>('following');
  /**
   * Whether there is an account behind the page. Two ways in, one state:
   * `?viewer=logged-out` seeds it at mount — the job board's `?viewer=`
   * convention, and the same read-once treatment `?team=` gets below — and the
   * Preview as switch in the review band flips it afterwards, writing the param
   * back so the address bar and the page never disagree.
   *
   * The switch sits outside the content column rather than above the feed, for
   * the reason the header note gives: this entry's subject is what the page
   * looks like, so scaffolding standing *in* the page is chrome on the thing
   * being judged. Signing in from either door still flips it in place, which is
   * the transition worth watching — For You appears, becomes the landing view
   * and explains itself, which is the payoff the banner is offering.
   *
   * Defaults to signed in, because that is the state every other reviewer of this
   * entry has been looking at and the one the rest of the feed is designed for.
   */
  const [signedIn, setSignedIn] = useState(true);
  const [query, setQuery] = useState('');
  /**
   * Team scope, set from `?team=<uid>` — where every "N new updates" badge in the
   * product lands (job board, teams grid, profile team rows). '' is the whole
   * network.
   */
  const [teamFilter, setTeamFilter] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const desktopFieldRef = useRef<HTMLDivElement>(null);
  const [followedTeams, setFollowedTeams] = useState<Set<string>>(new Set());

  /**
   * The teams behind the For You pill — production's `forYouTeamUids`, seeded
   * from the mock and then grown by whatever you follow while you're here.
   *
   * Production snapshots the set once at mount (`initialForYouTeamUids`) so the
   * pill's contents can't reshuffle under the reader. This keeps the no-reshuffle
   * half — the set only ever *grows*, so unfollowing never yanks a card out from
   * under the cursor — while still letting a follow show up in For You, which is
   * the one input of the three the banner claims that a reader can exercise on
   * this page. A claim you can't watch happen is a claim a prototype can't test.
   */
  const [forYouTeams, setForYouTeams] = useState<Set<string>>(() => new Set(FOR_YOU_TEAM_UIDS));
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

  /**
   * Both doors, and in this entry both of them simply sign the mock in — there
   * is no account to create here, and the sign-up *form* is the job board's
   * subject rather than this one's. They stay two callbacks so the banner and
   * the navbar can offer the pair rather than a single "Sign in".
   *
   * **Signing in lands on what was offered.** The banner's whole claim is that
   * the feed becomes about you, so returning to All — the view the stranger was
   * already reading — would make the offer look like it did nothing. For You,
   * the note that explains it, and the Following ranking are the three things
   * the sentence promised, so that is where the click ends up.
   *
   * The param is stripped on the way, for `clearTeamFilter`'s reason: a reload
   * must not sign the reader back out of a state they just left.
   */
  const handleSignIn = () => {
    setSignedIn(true);
    setActiveCategory(HAS_FOR_YOU_NEWS ? FOR_YOU_CAT : ALL_CAT);
    setSort('following');
    setExpanded(false);
    const params = new URLSearchParams(window.location.search);
    params.delete('viewer');
    const search = params.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${search ? `?${search}` : ''}`);
  };

  /**
   * The way back out, which until now was a reload.
   *
   * `handleSignIn` turned around, field for field, and deliberately the same
   * three resets the `?viewer=logged-out` effect below performs: one description
   * of the signed-out state, whether it is arrived at from a link or from the
   * switch, so the two cannot drift into showing different feeds for one word.
   * For You has no pill without an account and Following ranks by a set that is
   * necessarily empty, so both fall back to what a stranger can actually read.
   *
   * Writes the param rather than stripping it, for `handleSignIn`'s reason
   * reversed: a reload must land on the state the reader was looking at, and the
   * signed-out view stays linkable for a reviewer who wants to send it to
   * someone.
   */
  const handleSignOut = () => {
    setSignedIn(false);
    setActiveCategory(ALL_CAT);
    setSort('latest');
    setExpanded(false);
    const params = new URLSearchParams(window.location.search);
    params.set('viewer', 'logged-out');
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  };

  /* One door for the review switch, so the band itself sets no state — both
     directions go through the handlers the page's own controls already use. */
  const handleViewer = (next: FeedViewer) => (next === 'logged-out' ? handleSignOut() : handleSignIn());

  const toggleFollow = (teamUid: string, teamName: string) => {
    /* Signed out, Follow *is* the offer being taken up. Following is one of the
       three inputs the banner says a feed is built from, so a Follow button that
       quietly works without an account makes that sentence false. Sign in, then
       apply the follow — stash-and-replay, so the click the person made is the
       click that happens rather than one they have to make twice. */
    if (!signedIn) handleSignIn();

    setFollowedTeams((prev) => {
      const next = new Set(prev);
      if (next.has(teamUid)) {
        next.delete(teamUid);
        setToast(null);
      } else {
        next.add(teamUid);
        setToast(teamName);
        // Follows are one of the three things For You is made of, so a follow
        // joins it. Add-only — see `forYouTeams`.
        setForYouTeams((teams) => (teams.has(teamUid) ? teams : new Set(teams).add(teamUid)));
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

  /**
   * The two links the rest of the product can point here with, read once at mount:
   *
   *  - `?team=<uid>` scopes the feed to one team — where the "N new updates"
   *    badges land, so a badge reading 3 delivers all 3.
   *  - `?news=<uid>` opens one story — the param production's /home already
   *    understands (`useNewsDeepLink`), and what a news notification should use.
   *
   * Read-once, like production: the params seed state and are never re-read, so
   * clearing the chip or closing the modal can't be undone by a re-render.
   */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    /* Read here rather than in a `useState` initializer for the reason every
       other param on this page is: the entry server-renders, so touching
       `window` during render is a crash, not a hydration warning. Both this and
       the mount gate flush in the same pass, so the page never paints a
       signed-in frame first. */
    if (params.get('viewer') === 'logged-out') {
      setSignedIn(false);
      // For You does not exist without an account (production: no
      // `forYouTeamUids`, so no pill), and Following ranks by a set that is
      // necessarily empty. Both fall back to what a stranger can actually read.
      setActiveCategory(ALL_CAT);
      setSort('latest');
    }

    const team = params.get('team');
    const known = team && (ALL_CURATED_ITEMS.some((i) => i.teamUid === team) || getTeamNews(team).length > 0);
    // The team scope drops the For You pill (you have already said which team
    // you want), so a reader arriving on the default For You view would land in
    // a category with no control left to leave it — and, most weeks, no stories
    // either. A scope always arrives on All.
    if (known && team) {
      setTeamFilter(team);
      setActiveCategory(ALL_CAT);
    }

    const newsUid = params.get('news');
    const story = newsUid ? ALL_CURATED_ITEMS.find((i) => i.uid === newsUid) : undefined;
    if (story) {
      openStoryDetail(story);
      // Consume the param. The modal is a one-shot arrival, so leaving `news` in
      // the URL means a reload re-opens a story the reader already closed — and
      // the read-once effect above can't undo it. `replaceState` for the same
      // reason `clearTeamFilter` gives: this isn't a navigation, and Back should
      // leave the page rather than reopen a modal.
      const next = new URLSearchParams(window.location.search);
      next.delete('news');
      const nextSearch = next.toString();
      window.history.replaceState(null, '', `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}`);
    }

    /**
     * `?focus=<teamUid>` scrolls that team's card into view and leaves it there —
     * no scope chip, no modal. It's what "+N more updates" on the job board wants:
     * show me the rest of this team's news *in* the feed, without narrowing the
     * feed to it.
     *
     * Expands first, because the feed only renders its first page by default and
     * the team being asked for is usually past it — scrolling to a card that
     * hasn't rendered silently does nothing. Then polls for the anchor, since it
     * lands a frame or two after the state change.
     *
     * Top-aligned, not centred. Centring dropped the reader into the middle of a
     * feed with half a stranger's card above the one they asked for, which reads
     * as an arbitrary scroll position rather than an arrival — you can't tell
     * what you're looking at without scrolling up. Landed at the top, the card
     * they clicked is the first thing under the header and the rest of the feed
     * runs below it. `.focusAnchor` carries the offset that keeps it clear of the
     * sticky header; `landAtTop()` makes the top reachable for the last clusters
     * in the feed, which the page would otherwise run out of scroll before.
     */
    const focusTeam = params.get('focus');
    if (focusTeam) {
      // On All, not the default For You: this link asks for one team's card in
      // the middle of the feed, and For You holds the teams that match *you* —
      // which most of the teams anyone deep-links to are not. Arriving in a view
      // that doesn't contain the card would send the scroll below into its
      // scope-to-the-team fallback for a team the feed can render perfectly well.
      setActiveCategory(ALL_CAT);
      setExpanded(true);
      let tries = 0;
      const find = () => {
        const el = document.querySelector(`[data-feed-team="${focusTeam}"]`);
        if (el) {
          landAtTop(el);
          return;
        }
        if (tries++ < 120) {
          requestAnimationFrame(find);
          return;
        }
        // Out of tries: this team has no cluster in the feed at all. Landing on
        // an unfiltered feed carrying none of its stories is a silent dead end —
        // the reader asked for a team and got no sign of it. Scope to the team
        // instead, which always renders (it falls back to `getTeamNews`) and
        // shows a chip to widen back out.
        //
        // A fallback, not the behaviour: every team the grid and job board link
        // to has a cluster, so this should never fire. It's here so a future
        // fixture-only team degrades to something legible.
        setTeamFilter(focusTeam);
        setActiveCategory(ALL_CAT);
      };
      requestAnimationFrame(find);
    }
  }, []);

  // ---------- The view, as one addressable value ----------

  /**
   * The four axes collapsed into `FeedView` (`../newsfeed-v0/feedView`), which is
   * what makes "is this narrowed?" a single question instead of four scattered
   * comparisons — and what a subscription is made *of*.
   */
  const view: FeedView = useMemo(
    () => ({ tab: activeFocus, category: activeCategory as FeedView['category'], sort, query, team: teamFilter }),
    [activeFocus, activeCategory, sort, query, teamFilter],
  );

  const narrowed = isNarrowed(view);

  /** Display name for the team scope, read off the stories themselves. */
  const teamFilterName = useMemo(
    () =>
      teamFilter ? (ALL_CURATED_ITEMS.find((i) => i.teamUid === teamFilter)?.teamName ?? teamNameFor(teamFilter)) : '',
    [teamFilter],
  );

  /**
   * Clearing the scope also strips the param, so a reload doesn't reinstate a
   * filter the reader just dismissed. `replaceState` rather than router.replace —
   * the same reason production's `useNewsDeepLink` gives: this is a filter, not a
   * navigation, and Back should leave the page rather than toggle a chip.
   */
  const clearTeamFilter = () => {
    setTeamFilter('');
    const params = new URLSearchParams(window.location.search);
    params.delete('team');
    const search = params.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${search ? `?${search}` : ''}`);
  };

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
    const withHiring = showHiring ? items.filter((i) => !SUPERSEDED_BY_HIRING.has(i.uid)) : items;
    if (!teamFilter) return withHiring;

    // The team scope narrows the whole page, not just the card list — so tab and
    // category counts describe the team you asked for rather than the network
    // behind it. Anything else makes a badge reading "6" sit above three cards.
    const scoped = withHiring.filter((i) => i.teamUid === teamFilter);

    // The curated week and the badge fixtures are different team rosters (this
    // feed's mock is an editorial week; the job board's and the teams grid's are
    // their own). A badge must still land on the stories it counted, so a team
    // this week doesn't cover is served from the shared fixture instead.
    return scoped.length ? scoped : getTeamNews(teamFilter);
  }, [showHiring, teamFilter]);

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
   *
   * **For You counts as "asked for nothing".** `isNarrowed` reads it as a filter
   * — correct for the subscribe offer, which is about a cut you *chose* — but it
   * is now the view you arrive in, and a resting state cannot also be the
   * evidence that you filtered. Left as-is, making For You the default deleted
   * the week's pick from the landing page, which is the one thing this entry
   * exists to argue for. So the hero asks its own question: is anything narrowed
   * *other than* the category, and is the category one of the two resting ones.
   */
  const isRestingCategory = activeCategory === ALL_CAT || activeCategory === FOR_YOU_CAT;
  const showTopStory =
    SHOW_TOP_STORIES &&
    topStoryItem !== null &&
    isRestingCategory &&
    !isNarrowed({ ...view, category: ALL_CAT as FeedView['category'] });

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

  /**
   * The For You slice, computed inside the active focus tab the same way every
   * other pill's count is — production does the same (`forYouItemsForActiveTab`),
   * so a pill never reports a number from outside the tab you're standing in.
   *
   * One divergence from production, and it's the clustering. `selectForYouItems`
   * keeps only the *latest story per team*, because production's For You renders
   * a flat list and without that cap one busy team would fill it. This feed
   * clusters by team before it renders — a team's other stories are already
   * folded behind "+N more" on its one card — so the cap would only delete
   * stories from inside a card that was never going to fan out. Filtering by team
   * is what For You means; the one-per-team rule is how production's shape pays
   * for not having clusters.
   */
  const forYouItems = useMemo(
    // Off `scopedItems`, so the top-story block's picks are already out of it.
    // Two things ride on that. The block now renders on For You as well as All
    // (it treats both as resting views), so counting the stream would put the
    // week's pick in the band *and* in a card below it. And because the block
    // stands or falls identically on those two views, the count no longer moves
    // when you cross between them — which is the failure this used to have when
    // pressing For You was what made the block stand down.
    () => scopedItems.filter((i) => forYouTeams.has(i.teamUid)),
    [scopedItems, forYouTeams],
  );

  const categoriesWithCounts = useMemo(() => {
    const activeDiscussionsCount = scopedItems.filter((i) => hasExistingDiscussion(i.discussion)).length;
    const base = CATEGORIES.map((c) => ({
      ...c,
      count: c.id === ALL_CAT ? scopedItems.length : scopedItems.filter((i) => i.eventType === c.id).length,
    }));

    const out: Array<{ id: string; label: string; count: number }> = [];
    // First in the row, ahead of "All categories" — production's order, and the
    // right one: this is the narrowest, most personal read of the week, so it is
    // what a returning reader reaches for. Under a team scope it is dropped
    // entirely: you have already said which team you want, and "the teams that
    // match you" is not a further cut of one team.
    //
    // And dropped entirely without an account, which is production's rule too:
    // `forYouTeamUids` comes back empty without an auth token, so `hasForYouNews`
    // is false and `TeamNews` never renders the pill. A pill offering "you" to
    // someone the product has never met is a control with nothing behind it —
    // `SignedOutBanner` makes the offer instead, where it can name the doors.
    if (!teamFilter && signedIn) out.push({ ...FOR_YOU_CATEGORY, count: forYouItems.length });
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
    // Both counts obey the team scope for the same reason the pill counts above
    // do: a pill reading "Deals 3" over an empty scoped feed is a defect.
    const hiringCount = teamFilter
      ? HIRING_SIGNALS.filter((h) => h.teamUid === teamFilter).length
      : HIRING_SIGNALS.length;
    if (showHiring && hiringCount > 0) out.push({ id: HIRING_CAT, label: 'Hiring', count: hiringCount });
    if (showPerks && !teamFilter) out.push({ id: DEALS_CAT, label: 'Deals', count: PERK_SIGNALS.length });
    return out;
  }, [scopedItems, forYouItems, showHiring, showPerks, teamFilter, signedIn]);

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
        // For You survives an empty week for the same reason All does: both are
        // *views* of the feed rather than cuts of it, and a reader whose profile
        // matched nothing this week needs to be able to get there and read why.
        .filter((c) => c.id === ALL_CAT || c.id === FOR_YOU_CAT || c.count > 0)
        .map((c) => ({ value: c.id, label: c.id === ALL_CAT ? c.label : `${c.label} (${c.count})` })),
    [categoriesWithCounts],
  );

  const filteredItems = useMemo(() => {
    if (activeCategory === ALL_CAT) return scopedItems;
    if (activeCategory === FOR_YOU_CAT) return forYouItems;
    if (activeCategory === HIRING_CAT || activeCategory === DEALS_CAT) return [];
    if (activeCategory === DISCUSSIONS_CAT) {
      return scopedItems.filter((i) => hasExistingDiscussion(i.discussion));
    }
    return scopedItems.filter((i) => i.eventType === activeCategory);
  }, [activeCategory, scopedItems, forYouItems]);

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
    // A forum post is a person speaking, not a team shipping. Under a team scope
    // the reader asked for one team's updates, so posts step out — including
    // posts by that team's own members, which are still that member's opinion.
    if (teamFilter) return [];
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
  }, [activeCategory, activeFocus, query, teamFilter]);

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
    // Hiring rides beside the stories rather than in them, so the team scope has
    // to be applied to it separately — otherwise "Updates from Protocol Labs"
    // carries another team's open roles. Its own hiring is still an update.
    const scoped = teamFilter ? HIRING_SIGNALS.filter((h) => h.teamUid === teamFilter) : HIRING_SIGNALS;
    const q = query.trim().toLowerCase();
    const matched = q
      ? scoped.filter(
          (h) => h.teamName.toLowerCase().includes(q) || h.roles.some((r) => r.title.toLowerCase().includes(q)),
        )
      : scoped;
    return activeCategory === HIRING_CAT ? matched : matched.slice(0, HIRING_IN_MIXED_FEED);
  }, [showHiring, activeCategory, query, teamFilter]);

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
    // A vendor deal belongs to the network, not to a team — under a team scope
    // there is no version of it that is "an update from this team".
    if (teamFilter) return [];
    const q = query.trim().toLowerCase();
    const matched = q
      ? PERK_SIGNALS.filter(
          (p) => p.vendorName.toLowerCase().includes(q) || p.shortDescription.toLowerCase().includes(q),
        )
      : PERK_SIGNALS;
    // The pill shows everything /deals holds; the feed shows only what earned it.
    if (activeCategory === DEALS_CAT) return matched;
    return matched.filter((p) => p.shape === 'announcement').slice(0, PERKS_IN_MIXED_FEED);
  }, [showPerks, activeCategory, query, teamFilter]);

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
  // Forum posts step out under a team scope (see `forumPosts`), so the header
  // count has to drop them too — otherwise it reads 9 over a feed of 5.
  const newCount = sourceItems.length + (teamFilter ? 0 : FORUM_POSTS.length);

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

  /* Following ranks by a set that is necessarily empty without an account, so
     the option is dropped rather than shown ranking nothing — the same rule the
     For You pill follows two rows above, and the same reason: a control offering
     "you" to someone the product has never met has nothing behind it. Latest is
     what the sort lands on instead (see the mount effect). */
  const sortOptions = useMemo(
    () => (signedIn ? SORT_OPTIONS : SORT_OPTIONS.filter((o) => o.value !== 'following')),
    [signedIn],
  );

  /* The signed-out banner's team count. Counted off `sourceItems` rather than
     the whole corpus for `SignInBanner`'s reason: a banner claiming more than the
     list under it is contradicted by the list under it. Member count is a
     network-scale stand-in — the feed has no member list to count from, and
     production's `Welcome` uses the directory total. */
  const bannerTeamCount = useMemo(() => new Set(sourceItems.map((i) => i.teamUid)).size, [sourceItems]);
  const bannerMemberCount = 3000;

  const resetPaging = () => setExpanded(false);

  // Category counts are computed within the active focus area, so changing focus
  // has to drop you back to All rather than into a pill that now holds nothing.
  const handleFocus = (next: string) => {
    setActiveFocus(next);
    // For You survives the move, every event-type pill doesn't — production's
    // rule, and the distinction it draws is right: an event type is a cut of one
    // tab's contents, while For You is a *view* that every tab has a version of.
    if (activeCategory !== FOR_YOU_CAT) setActiveCategory(ALL_CAT);
    resetPaging();
  };

  /**
   * Where the two profile fields behind For You actually live: the settings
   * prototype's "Team & skills" section. Named for that destination rather than
   * for this feed — it is the page that owns the question, not a feed setting,
   * and there is no "topics" control anywhere to send someone to instead.
   */
  const openProfileSettings = () => router.push('/prototypes/profile-settings');

  const handleFieldBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    const live = e.currentTarget.querySelector('input')?.value ?? '';
    if (!live.trim()) setSearchOpen(false);
  };

  useEffect(() => {
    if (!searchOpen) return;
    desktopFieldRef.current?.querySelector('input')?.focus();
  }, [searchOpen]);

  const renderEntry = (entry: FeedEntry) => {
    if (entry.kind === 'news') {
      return (
        // Anchor for `?focus=<teamUid>` — the job board's "+N more updates" lands
        // on this card rather than scoping the whole feed to the team.
        <div key={`news-${entry.cluster.teamUid}`} data-feed-team={entry.cluster.teamUid} className={local.focusAnchor}>
          <V0FeedCard
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
        </div>
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

  /* You're standing on the feed, so there is nothing unread to point at: the dot
     is off here by definition, and `active` is what the item shows instead. */
  const nav = (
    /* `isLoggedIn` swaps the account cluster for the Sign up / Sign in pair —
       leaving an avatar over a page asking you to sign in makes the state
       incoherent. Both doors run `handleSignIn`: there is no separate sign-up
       form in this entry (see the handler), and the navbar's own note says the
       pair is decorative for every entry but the job board.

       `PrototypeMobileNav` takes no auth props, so below 640px the bottom bar
       still shows the signed-in items. Left alone deliberately — that is
       nav-shared's to fix, and fixing it here would fork the shared component. */
    <>
      <PrototypeNavBar
        hasUnreadNews={false}
        active
        isLoggedIn={signedIn}
        onSignIn={handleSignIn}
        onSignUp={handleSignIn}
      />
      <PrototypeMobileNav hasUnreadNews={false} active />
    </>
  );

  /* The switch reads one boolean rather than owning a state of its own, so it
     cannot disagree with the page it is labelling. */
  const viewer: FeedViewer = signedIn ? 'member' : 'logged-out';

  /* Review scaffolding: which reader the page is drawn for.
     Directly under the navbar and outside `.home__cn`, mirroring the job
     board's band — see the note on `local.reviewBand`. The navbar is sticky and
     this is not, so it scrolls away and the feed is left to be read on its own. */
  const reviewControls = (
    <div className={local.reviewBand}>
      <div className={local.reviewRow}>
        <div className={v0.switchBar}>
          <span className={v0.switchLabel}>Preview as</span>
          <div className={v0.switch} role="tablist" aria-label="Feed viewer state">
            {VIEWER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="tab"
                aria-selected={viewer === opt.value}
                className={clsx(v0.switchBtn, viewer === opt.value && v0.switchBtnActive)}
                onClick={() => handleViewer(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <span className={clsx(v0.switchNote, local.reviewNote)}>{VIEWER_NOTE[viewer]}</span>
        </div>
      </div>
    </div>
  );

  // Rendered outside the mount gate so the page never paints without its chrome.
  if (!mounted)
    return (
      <>
        {nav}
        {reviewControls}
        <div className={v0.page} />
      </>
    );

  /* Rendered on both paths — Monitor returns early, and a subscription set there
     needs the same confirmation. */
  const subscribeToast = subToast ? (
    <FollowToast>
      You&apos;ll get an email about <strong>{subToast}</strong> — only when there are new matches. Manage what you get
      from <a href="/settings/recommendations">Settings</a>.
    </FollowToast>
  ) : null;

  return (
    <>
      {nav}
      {reviewControls}
      <div className={clsx(v0.page, styles.home)}>
        <div className={styles.home__cn}>
          {/* Production's own arrangement, kept: `app/home/page.tsx` renders
              `Welcome` behind `!isLoggedIn` and `QuickActions` behind
              `isLoggedIn`, in this slot, as the first child of `.home__cn` —
              which is a 20/40px-gap column, so neither needs a wrapper of its
              own. They are alternatives rather than neighbours because Quick
              Actions is a row of things only a member can do. */}
          {signedIn ? (
            <>
              <div className={v0.qaDesktop}>
                <QuickActionsMock />
              </div>
              <div className={v0.qaMobile}>
                <MobileQuickActions />
              </div>
            </>
          ) : (
            <SignedOutBanner teamCount={bannerTeamCount} memberCount={bannerMemberCount} onSignIn={handleSignIn} />
          )}

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
              <div
                className={clsx(v0.tabsConstrain, v0.tabsConstrainBanner, local.railGutterConstrain, local.focusTabs)}
              >
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
                    // For You is exempt with All: an empty week is a thing to go
                    // read the explanation of, not a dead pill.
                    const isDisabled = c.count === 0 && c.id !== ALL_CAT && c.id !== FOR_YOU_CAT;
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
                  {/* Scope chip — the toolbar slot the saved-filter chip used to hold.
                    That one promised navigation the subscribe offer never made; this
                    one reports where you actually are, arrived from a "N new updates"
                    badge, and × puts the network back. Production's saved-view chip
                    styling (via newsfeed-v0), label + ×, minus the apply action. */}
                  {teamFilter && (
                    <span className={clsx(v0.savedView, v0.savedFilterChip, local.scopeChip)}>
                      <span className={clsx(v0.savedViewBody, local.scopeChipLabel)}>
                        Updates from <strong>{teamFilterName}</strong>
                      </span>
                      <button
                        type="button"
                        className={v0.savedViewDelete}
                        aria-label={`Show all network updates instead of just ${teamFilterName}`}
                        onClick={clearTeamFilter}
                      >
                        <svg viewBox="0 0 12 12" fill="none" aria-hidden>
                          <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </button>
                    </span>
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
                      options={sortOptions}
                      currentSort={sort}
                      onSortChange={(value) => {
                        setSort(value as Sort);
                        resetPaging();
                      }}
                    />
                  </span>
                  <span className={v0.sortMobile}>
                    <MobileFeedSort
                      options={sortOptions}
                      currentSort={sort}
                      onSortChange={(value) => {
                        setSort(value as Sort);
                        resetPaging();
                      }}
                    />
                  </span>
                </div>
              </div>

              {/* What the view is made of, in one line — the same note the Deals
                pill gets below, for the same reason. See `ForYouBanner`. */}
              {activeCategory === FOR_YOU_CAT && <ForYouBanner onUpdateProfile={openProfileSettings} />}

              {/* For You is narrowed, so the subscribe offer would otherwise fire
                under the note above — two asides stacked between the pills and
                the first story. It also has nothing to offer here: a weekly email
                of "whatever currently matches my profile" is a different object
                from a saved filter. */}
              {/* And not without an account: what this offer creates is an email
                subscription, and there is no address on file to send it to.
                Offering it anyway would put a second, quieter sign-in ask under
                the banner that is already making one. */}
              {signedIn && narrowed && activeCategory !== FOR_YOU_CAT && !subscription && !subscribeDismissed && (
                <div className={clsx(v0.tabsConstrain, v0.tabsConstrainBanner, local.railGutterConstrain)}>
                  <SubscribeBanner
                    label={summarizeView(view, teamFilterName)}
                    onSubscribe={() =>
                      handleSubscribe({
                        key: viewHashKey(view),
                        label: summarizeView(view, teamFilterName),
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
                <div
                  className={clsx(v0.tabsConstrain, v0.tabsConstrainBanner, local.railGutterConstrain, local.pillNote)}
                >
                  All {PERK_SIGNALS.length} perks, including the{' '}
                  {PERK_SIGNALS.filter((p) => p.shape !== 'announcement').length} the feed did not carry. This is what
                  &ldquo;add deals to the feed&rdquo; injects if nothing filters it — standing offers with no event
                  behind them, most of them gated to an audience the average reader isn&apos;t in.
                </div>
              )}

              {entries.length === 0 ? (
                <div className={s.empty}>
                  {query.trim() ? `No updates match “${query.trim()}”.` : 'No updates in this filter.'}
                </div>
              ) : (
                <>
                  <div className={clsx(v0.feedLayout, v0.feedLayoutBanner, local.feedGutter)}>
                    <div className={v0.feedList}>
                      {/* The block lives in the feed column of the *same* grid as the
                        rail, so the rail runs as one continuous column: Teams to
                        follow, then Popular this week, digest — no gap where the
                        block used to sit in a grid of its own. */}
                      {showTopStory && topStoryItem && (
                        <TopStoriesBlock
                          lead={topStoryItem}
                          also={alsoItems}
                          top={TOP_STORY}
                          followedTeams={followedTeams}
                          onToggleFollow={toggleFollow}
                          likeCount={likeCount}
                          isLiked={isLiked}
                          onToggleLike={toggleLike}
                          commentCount={(uid) => commentsFor(uid).length}
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
                        signedIn={signedIn}
                        onSignIn={handleSignIn}
                        /* Hidden below 960px only while the scroller is rendering.
                         When the block goes (narrowed view) the scroller goes with
                         it, and the rail takes the module back at every width. */
                        followCardClassName={showTopStory ? local.hideBelowDesktop : undefined}
                      />
                    </aside>
                  </div>
                  {entries.length > PAGE_SIZE && (
                    <div className={clsx(s.showAll, v0.showAllConstrain, local.railGutterConstrain)}>
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

        {/* Says what following just did, not only where to undo it.

            It used to name the *sort* alone ("their updates will appear first"),
            which is the smaller half: a follow also joins the set For You is cut
            from, so the one lever on this page that personalizes the feed was
            confirming itself as a ranking tweak. The banner above now names
            follows as an input; this is where that claim gets demonstrated,
            which is worth more than a second link explaining it. */}
        {toast && (
          <FollowToast>
            You&apos;re now following {toast} — their updates join <strong>For you</strong> and appear first in your
            feed. Manage who you follow from your profile.
          </FollowToast>
        )}

        {subscribeToast}
      </div>
    </>
  );
}

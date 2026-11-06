'use client';

/**
 * REUSE MAP — home-v2-b (Home v2, signed in, version B)
 *
 * Production (imported read-only):
 *   NewsRail PopularThisWeekCard ........... copied as PopularThisWeekRail, + team logos
 *   embla-carousel-react + usePrevNextButtons  Featured's carousel engine (ForumCarousel)
 *   app/home/page.module.css ............... signed-in page width
 *   TeamGroupCard.module.scss .............. the "See all …" expander on the cut
 *
 * Sibling prototypes (imported, not forked):
 *   home-v2 ............ TeamsToFollowRail, DealsRail, page/rail/cut styles, rail + roles mocks
 *   home-refactor-b .... this week's re-dated news + forum mocks, module title
 *   home-refactor ...... JobsRail, RepoBanner + curated repos, section head + "See all" styles, rail stack
 *   newsfeed-v0 ........ V0FeedCard, ForumPostCard, FeedDetailModal, ForumPostModal, switch chrome
 *   nav-shared ......... PrototypeNavBar / PrototypeMobileNav
 *
 * New here: "Network Updates" as the page header over two sections (forum
 * carousel, cut news), home-v2's open-source band under them, and a rail of
 * Popular this week, open roles, Teams to follow and deals.
 *
 * Signed in, the Agent (2026-11-02, Linear's agent): AgentPanel docks on the right, reads the page, and
 * proposes changes (following teams) that the member confirms.
 */

import clsx from 'clsx';
import Link from 'next/link';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import type { ITeamNewsItem } from '@/types/team-news.types';

import home from '@/app/home/page.module.css';
import jobsCss from '@/components/page/jobs/TeamGroupCard/TeamGroupCard.module.scss';

import sortCss from '@/components/common/filters/SortDropdown/SortDropdown.module.scss';
import { SortDropdown } from '@/components/common/filters/SortDropdown';
import { SORT_OPTIONS, type TeamNewsSort } from '@/components/page/home/TeamNews/utils/sortTeamNewsClusters';
// Production Home's filter bar under the news: pill row, mobile "Type:" dropdown, "Sort by:".
import tn from '@/components/page/home/TeamNews/TeamNews.module.scss';

import feed from '../newsfeed/Newsfeed.module.scss';
import { ALL_CURATED_ITEMS, TOP_STORY } from '../newsfeed/mocks';
import { FollowButton } from '../follow-shared/FollowButton';
import { ForumPostCard } from '../newsfeed-v0/ForumPostCard';
import { ForumPostModal } from '../newsfeed-v0/ForumPostModal';
import { V0FeedCard } from '../newsfeed-v0/V0FeedCard';
import { FeedDetailModal, type FeedDetail } from '../newsfeed-v0/FeedDetailModal';
import { EVENT_TYPE_HEX, EVENT_TYPE_LABEL } from '../newsfeed-v0/eventMeta';
import {
  BASE_LIKES,
  COMMENTS_BY_UID,
  MODAL_CITED_BODY_BY_UID,
  MODAL_EXTRA_BY_UID,
  PL_TEAM_UID,
  SOURCES_BY_UID,
  VIDEO_BY_UID,
  type FeedComment,
  type ForumPost,
} from '../newsfeed-v0/mocks';
import v0 from '../newsfeed-v0/NewsfeedV0.module.scss';
import hr from '../home-refactor/HomeRefactorPrototype.module.scss';
import hrb from '../home-refactor-b/HomeRefactorB.module.scss';
import { WEEK_LIKES, WEEK_ROWS, weekForumPosts, weekNewsItem } from '../home-refactor-b/mocks';
import { useHeaderSearch } from '../home-ai-ask/useHeaderSearch';
import { PrototypeNavBar } from '../nav-shared/PrototypeNavBar';
import { PrototypeMobileNav } from '../nav-shared/PrototypeMobileNav';
import { JobsRail } from '../home-refactor/JobsRail';
import { RepoBanner } from '../home-refactor/RepoBanner';
import { CURATED_REPOS, REPOS_ATTRIBUTION } from '../home-refactor/mocks';
import { FOR_YOU_UIDS, ROLES, TOTAL_OPEN_ROLES } from '../home-v2/mocks';
import { DealsRail } from '../home-v2/DealsRail';
import { TeamsToFollowRail } from '../home-v2/TeamsToFollowRail';
import v2 from '../home-v2/HomeV2Prototype.module.scss';

import { AiSearchIcon } from '@/components/icons/AiSearchIcon';

import { AgentPanel } from './AgentPanel';
import agentCss from './AgentPanel.module.scss';
import { ForumCarousel } from './ForumCarousel';
import { ForYouCaption } from './ForYouCaption';
import { SignedOutHome } from './SignedOutHome';
import { SidebarNav } from './SidebarNav';
import side from './SidebarNav.module.scss';
import { PopularThisWeekRail, type PopularRailItem } from './PopularThisWeekRail';
import {
  HOME_B_STATES,
  LATEST_DEALS,
  PROD_TAGS_BY_UID,
  SUGGESTED_TEAMS,
  TOTAL_DEALS,
  isHomeBState,
  type HomeBState,
} from './mocks';
import s from './HomeV2B.module.scss';

/** Phones/tablets (rail stacked under the news): full news cards before the cut; one more fades under "See all news". */
const NEWS_CAP = 3;
/** How much of the first hidden card shows through the fade. */
const CUT_PEEK = 140;
/** The rail sits beside the news from tablet-landscape (newsRow's breakpoint). */
const SIDE_BY_SIDE = '(min-width: 960px)';

/* News updates' pill row (2026-10-30): For You · All · Funding · Launch · Announcement. Milestone, Partnership
   and Other drew 1, 4 and 3 people in 90 days (Other is the uncategorised catch-all), so they are not pills; their
   posts stay under All and keep their label on the card. No Forum pill and no threads in the stream: "From the
   forum" above is the forum's section. */
const FOR_YOU_CAT = 'forYou';
const ALL_CAT = 'all';
/* Top stories are not pinned: the newsfeed's three editorial picks stay in the stream, labelled "Top story",
   and this pill lists just them. */
const TOP_CAT = 'top';
const TOP_STORY_UIDS = new Set([TOP_STORY.uid, ...TOP_STORY.alsoUids]);
const TYPE_PILLS = ['FUNDING', 'LAUNCH', 'ANNOUNCEMENT'] as const;

type Option<T extends string> = { value: T; label: string; note: string };

/* newsfeed-v0's switch chrome, as home-v2 uses it. */
function Switch<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className={v0.switchBar}>
      <span className={v0.switchLabel}>{label}</span>
      <div className={clsx(v0.switch, v2.reviewSwitch)} role="tablist" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={value === o.value}
            className={clsx(v0.switchBtn, value === o.value && v0.switchBtnActive)}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
      <span className={clsx(v0.switchNote, feed.reviewNote)}>{options.find((o) => o.value === value)!.note}</span>
    </div>
  );
}

function SectionHead({ id, title, href, linkLabel }: { id: string; title: string; href: string; linkLabel: string }) {
  return (
    <div className={hr.sectionHead}>
      <h2 id={id} className={hrb.moduleTitle}>
        {title}
      </h2>
      <Link href={href} className={hr.seeAll}>
        {linkLabel}
      </Link>
    </div>
  );
}

const WEEK_LABEL = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

/** Monday 00:00 of the week `d` falls in — the band's "Week of". */
function mondayOf(d: Date) {
  const m = new Date(d);
  m.setHours(0, 0, 0, 0);
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7));
  return m;
}

/** Network Updates' header: a page-level title over one line of what it holds, on Home and on its own page. */
function NewsHead({
  id,
  as: Tag = 'h2',
  link,
}: {
  id: string;
  as?: 'h1' | 'h2';
  link?: { href: string; label: string };
}) {
  return (
    <div className={hr.sectionHead}>
      <div className={hr.sectionHeadText}>
        <Tag id={id} className={s.newsTitle}>
          Network Updates
        </Tag>
        <p className={s.newsSub}>Recent shipping, raises, partnerships, and milestones from across the network.</p>
      </div>
      {link && (
        <Link href={link.href} className={hr.seeAll}>
          {link.label}
        </Link>
      )}
    </div>
  );
}

export default function HomeV2BPrototype() {
  /* Prototype routes server-render: read the URL and clock only after mount. */
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setMounted(true);
    setNow(new Date());
  }, []);
  const forumPosts = useMemo(() => weekForumPosts(now ?? new Date()), [now]);
  /* Newest first: the carousel opens on the latest thread. */
  const forumUids = useMemo(
    () =>
      Object.values(forumPosts)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((p) => p.uid),
    [forumPosts],
  );
  /* The week's stories, re-dated (home-refactor-b) and re-tagged in production's hashtag vocabulary (as home-v2). */
  const news = useMemo(
    () =>
      WEEK_ROWS.news
        .map((r) => {
          const item = weekNewsItem(r.newsUid!, now ?? new Date());
          return { ...item, tags: PROD_TAGS_BY_UID[item.uid] ?? item.tags };
        })
        .sort((a, b) => b.eventDate.localeCompare(a.eventDate)),
    [now],
  );
  /* The full feed behind "See all news": this week's stories, then the rest of the newsfeed's mocks, newest first. */
  const allNews = useMemo(() => {
    const week = new Set(news.map((n) => n.uid));
    return [...news, ...ALL_CURATED_ITEMS.filter((i) => !week.has(i.uid))].sort((a, b) =>
      b.eventDate.localeCompare(a.eventDate),
    );
  }, [news]);
  /* Popular this week (home-v2's): the week's three most-liked stories in production's ITeamNewsPopularItem
     shape, ranked from the seeded likes so a like doesn't reorder the rail. Top stories are left out, as
     production does: they have their own pill and label, so the rail names three more. */
  const popularThisWeek: PopularRailItem[] = useMemo(() => {
    return news
      .filter((n) => !TOP_STORY_UIDS.has(n.uid))
      .sort((a, b) => (WEEK_LIKES[b.uid] ?? 0) - (WEEK_LIKES[a.uid] ?? 0))
      .slice(0, 3)
      .map((n) => ({
        uid: n.uid,
        title: n.title,
        teamUid: n.teamUid,
        teamName: n.teamName,
        teamLogoUrl: n.teamLogoUrl,
        sourceUrl: n.sourceUrl ?? '',
        upvoteCount: WEEK_LIKES[n.uid] ?? 0,
      }));
  }, [news]);
  /* A hashtag click scopes the news section the newsfeed's way (exact tag, clicking it again clears). */
  const [topic, setTopic] = useState('');
  /* Production's resting view is For You; pressing the active pill again goes back to All. */
  const [cat, setCat] = useState<string>(FOR_YOU_CAT);
  const [sort, setSort] = useState<TeamNewsSort>('latest');
  const [followedTopics, setFollowedTopics] = useState<Set<string>>(new Set());
  const toggleTopic = (tag: string) => setTopic((t) => (t === tag ? '' : tag));

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const rawState = searchParams.get('state');
  const state: HomeBState = isHomeBState(rawState) ? rawState : 'signed-out';
  const setState = (v: HomeBState) => {
    const next = new URLSearchParams(searchParams.toString());
    if (v === 'signed-out') next.delete('state');
    else next.set('state', v);
    const q = next.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  };
  const signedIn = state === 'signed-in';
  /* The prototype's doors: Sign up and Sign in both land on the member page (home-v2's rule). */
  const signIn = () => setState('signed-in');
  /* ?view=news is "See all news": the same entry, showing only the feed. */
  const view: 'home' | 'news' = searchParams.get('view') === 'news' ? 'news' : 'home';
  const newsHref = (() => {
    const next = new URLSearchParams(searchParams.toString());
    next.set('view', 'news');
    return `${pathname}?${next.toString()}`;
  })();
  /* Switching view starts it unfiltered and at the top. */
  useEffect(() => {
    setTopic('');
    window.scrollTo(0, 0);
  }, [view]);
  const navExtras = useHeaderSearch(signedIn);

  /* Likes and comments: the feed's own model, seeded from its mocks (as home-v2). */
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [comments, setComments] = useState<Record<string, FeedComment[]>>(COMMENTS_BY_UID);
  const likeCount = (uid: string) => (WEEK_LIKES[uid] ?? BASE_LIKES[uid] ?? 0) + (liked.has(uid) ? 1 : 0);
  const isLiked = (uid: string) => liked.has(uid);
  const toggleLike = (uid: string) =>
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  const commentsFor = (uid: string) => comments[uid] ?? [];
  const addComment = (uid: string, text: string, parentUid?: string) =>
    setComments((prev) => {
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

  const [followed, setFollowed] = useState<Set<string>>(new Set());
  const toggleFollow = (teamUid: string) =>
    setFollowed((prev) => {
      const next = new Set(prev);
      if (next.has(teamUid)) next.delete(teamUid);
      else next.add(teamUid);
      return next;
    });
  /* The agent's proposals follow (or, undone, unfollow) a set at once; the rail's Teams to follow reflects it. */
  const followTeams = (teamUids: string[], undo?: boolean) =>
    setFollowed((prev) => {
      const next = new Set(prev);
      teamUids.forEach((uid) => (undo ? next.delete(uid) : next.add(uid)));
      return next;
    });

  /* The agent (Linear's): a docked panel for members, toggled from the sidebar, the phone's button, or Ctrl/⌘ J. */
  const [agentOpen, setAgentOpen] = useState(false);
  useEffect(() => {
    if (!signedIn) return setAgentOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setAgentOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [signedIn]);

  const [detail, setDetail] = useState<FeedDetail | null>(null);
  const [forumDetail, setForumDetail] = useState<ForumPost | null>(null);
  const openStory = (story: ITeamNewsItem) =>
    setDetail({
      id: story.uid,
      kind: 'news',
      title: story.title,
      name: story.teamName,
      logoUrl: story.teamLogoUrl,
      kicker: EVENT_TYPE_LABEL[story.eventType],
      kickerColor: EVENT_TYPE_HEX[story.eventType],
      summary: story.summary
        ? story.summary + (MODAL_EXTRA_BY_UID[story.uid] ? `\n\n${MODAL_EXTRA_BY_UID[story.uid]}` : '')
        : (MODAL_EXTRA_BY_UID[story.uid] ?? null),
      time: story.eventDate,
      sources: SOURCES_BY_UID[story.uid],
      citedBody: MODAL_CITED_BODY_BY_UID[story.uid],
      video: VIDEO_BY_UID[story.uid],
      isProtocolLabs: story.teamUid === PL_TEAM_UID,
      readUrl: story.sourceUrl ?? undefined,
    });

  /* Beside the rail the news ends where the rail ends (home-v2's WeekFeed rule), so neither column leaves a
     hole: every card that fits above the rail's bottom shows in full, and the list clips and fades there. */
  const listRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLElement>(null);
  const [fit, setFit] = useState<{ full: number; clip?: number } | null>(null);
  useLayoutEffect(() => {
    const list = listRef.current;
    const rail = railRef.current;
    if (!list || !rail) return;
    const measure = () => {
      if (!window.matchMedia(SIDE_BY_SIDE).matches) return setFit((prev) => (prev === null ? prev : null));
      const cards = Array.from(list.children) as HTMLElement[];
      const target = rail.getBoundingClientRect().bottom - list.getBoundingClientRect().top;
      // At least one full card.
      const full = Math.max(cards.filter((c) => c.offsetTop + c.offsetHeight <= target).length, 1);
      const next =
        full >= cards.length
          ? { full: cards.length }
          : { full, clip: Math.round(Math.max(target, cards[full].offsetTop + CUT_PEEK)) };
      // The list observes its own size, which the clip changes: only re-render on a real change.
      setFit((prev) => (prev && prev.full === next.full && prev.clip === next.clip ? prev : next));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(list);
    ro.observe(rail);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [mounted, view, topic, state, cat, sort]);

  if (!mounted) return <div className={v2.mountShell} />;

  const topicNews = (topic ? (view === 'news' ? allNews : news).filter((n) => n.tags.includes(topic)) : null) ?? [];
  /* Top stories: the newsfeed's editorial picks (lead + two rows), all from this week. Like production, the
     band shows on the resting view only (a hashtag scopes it away) and its stories leave the stream below. */
  /* The pill row: the week's stories, scoped by the hashtag, counted per pill; a pill at 0 is hidden. */
  const entries = topic ? news.filter((n) => n.tags.includes(topic)) : news;
  const inCat = (n: ITeamNewsItem, c: string) => {
    if (c === FOR_YOU_CAT) return FOR_YOU_UIDS.includes(n.uid);
    if (c === ALL_CAT) return true;
    if (c === TOP_CAT) return TOP_STORY_UIDS.has(n.uid);
    return n.eventType === c;
  };
  const pills = [
    { id: FOR_YOU_CAT, label: 'For You' },
    { id: ALL_CAT, label: 'All' },
    { id: TOP_CAT, label: 'Top' },
    ...TYPE_PILLS.map((id) => ({ id, label: EVENT_TYPE_LABEL[id] })),
  ]
    .map((p) => ({ ...p, count: entries.filter((n) => inCat(n, p.id)).length }))
    .filter((p) => p.id === ALL_CAT || p.count > 0);
  const activeCat = pills.some((p) => p.id === cat) ? cat : ALL_CAT;

  const homeNews = entries
    .filter((n) => inCat(n, activeCat))
    .sort((a, b) => {
      if (sort === 'popular') return likeCount(b.uid) - likeCount(a.uid);
      if (sort === 'following') {
        const f = (n: ITeamNewsItem) => (followed.has(n.teamUid) ? 0 : 1);
        const d = f(a) - f(b);
        if (d) return d;
      }
      return b.eventDate.localeCompare(a.eventDate);
    });
  const newsCap = NEWS_CAP;
  /* Beside the rail: every story, clipped at the rail's end. Stacked: the cap, plus one faded card. */
  const fullCount = fit ? fit.full : newsCap;
  const cut = homeNews.length > fullCount;
  const shownNews = fit ? homeNews : homeNews.slice(0, cut ? newsCap + 1 : newsCap);

  const renderNewsCard = (story: ITeamNewsItem) => (
    <V0FeedCard
      cluster={{
        teamUid: story.teamUid,
        teamName: story.teamName,
        teamLogoUrl: story.teamLogoUrl,
        lead: story,
        rest: [],
        isLeadNewest: true,
      }}
      following={followed.has(story.teamUid)}
      onToggleFollow={() => toggleFollow(story.teamUid)}
      showComments
      likeCount={likeCount}
      isLiked={isLiked}
      onToggleLike={toggleLike}
      commentsFor={commentsFor}
      onAddComment={addComment}
      onOpenStory={openStory}
      onSelectTopic={toggleTopic}
      activeTopic={topic || undefined}
      topStory={TOP_STORY_UIDS.has(story.uid)}
    />
  );

  /* home-v2's topic scope (the newsfeed's "Filter:" chip): the tag, its size, Follow. Only while a tag is on. */
  const topicScope = topic && (
    <div className={s.topicBar}>
      <span className={feed.topicScope}>
        <span className={sortCss.sortByLabel}>Filter:</span>
        <span className={clsx(v0.savedView, v0.savedFilterChip, feed.scopeChip)}>
          <span className={clsx(v0.savedViewBody, feed.scopeChipLabel)}>
            <strong>#{topic}</strong>
          </span>
          <button
            type="button"
            className={v0.savedViewDelete}
            aria-label={`Show all updates instead of just #${topic}`}
            onClick={() => setTopic('')}
          >
            <svg viewBox="0 0 12 12" fill="none" aria-hidden>
              <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </span>
        <span className={feed.topicCount}>
          {topicNews.length} {topicNews.length === 1 ? 'update' : 'updates'}
        </span>
        <FollowButton
          following={followedTopics.has(topic)}
          onClick={() =>
            setFollowedTopics((prev) => {
              const next = new Set(prev);
              if (next.has(topic)) next.delete(topic);
              else next.add(topic);
              return next;
            })
          }
          name={`#${topic}`}
          size="xs"
          tertiary
        />
      </span>
    </div>
  );

  const modals = (
    <>
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
    </>
  );

  /* Signed in, the navigation is a left sidebar (SidebarNav) from tablet-landscape up; the header stays below
     that width, where a phone has no room for a column. Signed out keeps the header. */
  const navBar = (
    <PrototypeNavBar
      hasUnreadNews={false}
      active
      isLoggedIn={signedIn}
      onSignIn={signIn}
      onSignUp={signIn}
      {...navExtras}
    />
  );
  const shell = (children: ReactNode) =>
    signedIn ? (
      <div className={side.appShell}>
        <SidebarNav agentOpen={agentOpen} onToggleAgent={() => setAgentOpen((o) => !o)} />
        <div className={side.appMain}>
          <div className={side.narrowOnly}>{navBar}</div>
          {children}
        </div>
        <AgentPanel
          open={agentOpen}
          onClose={() => setAgentOpen(false)}
          data={{
            news,
            forumCount: forumUids.length,
            likeCount,
            teams: SUGGESTED_TEAMS,
            followed,
            roles: ROLES,
            totalRoles: TOTAL_OPEN_ROLES,
          }}
          onOpenStory={openStory}
          onFollowTeams={followTeams}
        />
        {!agentOpen && (
          <button type="button" className={agentCss.fab} onClick={() => setAgentOpen(true)}>
            <AiSearchIcon size={18} />
            Agent
          </button>
        )}
      </div>
    ) : (
      <>
        {navBar}
        {children}
      </>
    );

  /* "See all news": the feed alone — Network Updates in 2–3 columns, nothing else. */
  if (view === 'news') {
    const list = topic ? topicNews : allNews;
    return (
      <>
        {shell(
          <div className={home.home}>
            <div className={clsx(home.home__cn, s.newsPage, side.sideCn)}>
              <section className={s.section} aria-labelledby="news-page-title">
                <NewsHead id="news-page-title" as="h1" />
                {topicScope}
                <div className={s.newsColumns}>
                  {list.map((story) => (
                    <div key={story.uid} className={s.newsColumnItem}>
                      {renderNewsCard(story)}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>,
        )}
        <PrototypeMobileNav hasUnreadNews={false} active />
        {modals}
      </>
    );
  }

  return (
    <>
      {shell(
        <>
          {/* Review scaffolding — scrolls away; not part of the design. */}
          <div className={feed.reviewBand}>
            <div className={feed.reviewRow}>
              <Switch label="State" options={HOME_B_STATES} value={state} onChange={setState} />
            </div>
          </div>

          {!signedIn ? (
            <SignedOutHome
              storyFor={(uid) => {
                const item = weekNewsItem(uid, now ?? new Date());
                return { ...item, tags: PROD_TAGS_BY_UID[uid] ?? item.tags };
              }}
              allHref={newsHref}
              likeCount={likeCount}
              commentCount={(uid) => commentsFor(uid).length}
              onOpenStory={openStory}
              onSignUp={signIn}
              onSignIn={signIn}
            />
          ) : (
            <div className={home.home}>
              <div className={clsx(home.home__cn, v2.memberPage, side.sideCn)}>
                {/* The page header: Network Updates over everything — forum and news are its two sections. */}
                <div className={s.pageHead}>
                  <NewsHead id="network-updates-title" as="h1" />
                </div>

                <div className={v2.newsRow}>
                  <div className={s.main}>
                    {/* 1. Forum threads, newest first, as a carousel. */}
                    <ForumCarousel
                      uids={forumUids}
                      renderPost={(uid) => {
                        const post = forumPosts[uid];
                        return post ? (
                          <ForumPostCard
                            post={post}
                            showComments={false}
                            authorStacked
                            onSelectTopic={toggleTopic}
                            activeTopic={topic || undefined}
                            likeCount={likeCount(uid)}
                            liked={isLiked(uid)}
                            onToggleLike={() => toggleLike(uid)}
                            comments={commentsFor(uid)}
                            onAddComment={(text, parentUid) => addComment(uid, text, parentUid)}
                            isCommentLiked={isLiked}
                            onToggleCommentLike={toggleLike}
                            onOpenDetail={() => setForumDetail(post)}
                          />
                        ) : null;
                      }}
                    />

                    {/* 2. News updates: the Top stories band, then the stream down to the rail's end, fading into "See all news". */}
                    <section className={s.section} aria-labelledby="home-news-title">
                      <SectionHead id="home-news-title" title="News updates" href={newsHref} linkLabel="All news" />
                      {/* Production Home's filter bar: pills (a "Type:" dropdown on phones), then Sort by. */}
                      <div className={clsx(tn.filterBar, s.newsFilterBar)}>
                        <div className={tn.catRow}>
                          {pills.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              className={clsx(tn.cat, p.id === ALL_CAT && s.catAll, {
                                [tn.catActive]: activeCat === p.id,
                              })}
                              aria-pressed={activeCat === p.id}
                              onClick={() => setCat(activeCat === p.id ? ALL_CAT : p.id)}
                            >
                              {p.label}
                              {p.id !== ALL_CAT && <span>{p.count}</span>}
                            </button>
                          ))}
                        </div>
                        <div className={tn.filterActions}>
                          <span className={tn.typeMobile}>
                            <SortDropdown
                              sortByLabel="Type:"
                              options={pills.map((p) => ({ value: p.id, label: p.label }))}
                              currentSort={activeCat}
                              onSortChange={setCat}
                            />
                          </span>
                          <SortDropdown
                            sortByLabel="Sort by:"
                            options={SORT_OPTIONS}
                            currentSort={sort}
                            onSortChange={(v) => setSort(v as TeamNewsSort)}
                          />
                        </div>
                      </div>
                      {/* A hashtag scope sits under the pills; the For You caption labels the For You view only (production). */}
                      {topicScope || (activeCat === FOR_YOU_CAT && <ForYouCaption />)}
                      <div
                        ref={listRef}
                        className={clsx(v0.feedList, fit && v2.cutList, fit && cut && v2.cutListFaded)}
                        style={fit && cut ? { maxHeight: fit.clip } : undefined}
                      >
                        {shownNews.map((story, i) => {
                          const isCut = cut && i >= fullCount;
                          return (
                            <div
                              key={story.uid}
                              className={clsx(isCut && !fit && v2.cutCard)}
                              aria-hidden={isCut ? true : undefined}
                              inert={isCut ? true : undefined}
                            >
                              {renderNewsCard(story)}
                            </div>
                          );
                        })}
                      </div>
                      {cut && (
                        <Link href={newsHref} className={clsx(jobsCss.expander, v2.cutSeeAll, v2.cutSeeAllOnFade)}>
                          See all news
                        </Link>
                      )}
                    </section>
                  </div>

                  {/* Rail: production's Popular this week, then roles, teams, deals. */}
                  <aside ref={railRef} className={v2.rail}>
                    <div className={hr.railStack}>
                      <PopularThisWeekRail
                        items={popularThisWeek}
                        onPopularItemClick={(item) => {
                          const story = news.find((n) => n.uid === item.uid);
                          if (story) openStory(story);
                        }}
                      />
                      <JobsRail jobs={ROLES} total={TOTAL_OPEN_ROLES} />
                      <TeamsToFollowRail
                        suggestions={SUGGESTED_TEAMS}
                        followedTeamUids={followed}
                        onFollow={toggleFollow}
                      />
                      <DealsRail deals={LATEST_DEALS} total={TOTAL_DEALS} />
                    </div>
                  </aside>
                </div>

                {/* 3. Under both sections: the network's open-source picks, as home-v2 has them. */}
                <div className={v2.reposSection}>
                  <RepoBanner
                    repos={CURATED_REPOS}
                    attribution={REPOS_ATTRIBUTION}
                    weekLabel={`Week of ${WEEK_LABEL.format(mondayOf(now ?? new Date()))}`}
                  />
                </div>
              </div>
            </div>
          )}
        </>,
      )}
      <PrototypeMobileNav hasUnreadNews={false} active />

      {modals}
    </>
  );
}

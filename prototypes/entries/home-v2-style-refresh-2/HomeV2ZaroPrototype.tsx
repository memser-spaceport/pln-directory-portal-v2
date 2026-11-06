'use client';

/**
 * REUSE MAP — home-v2-style-refresh-2 (a copy of home-v2-b, signed out redrawn after zaro.ai)
 *
 * Signed out: ZaroSignedOut + ZaroNavBar (Zaro.module.scss) — home-v2's story in zaro.ai's visual
 * language, on home-v2's mocks. Signed in: unchanged from home-v2-b, as below.
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
 */

import clsx from 'clsx';
import Link from 'next/link';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import type { ITeamNewsItem } from '@/types/team-news.types';

import home from '@/app/home/page.module.css';

import sortCss from '@/components/common/filters/SortDropdown/SortDropdown.module.scss';

import type { TeamNewsSort } from '@/components/page/home/TeamNews/utils/sortTeamNewsClusters';
import feed from '../newsfeed/Newsfeed.module.scss';
import { ALL_CURATED_ITEMS, TOP_STORY } from '../newsfeed/mocks';
import { FollowButton } from '../follow-shared/FollowButton';
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
import { WEEK_LIKES, WEEK_ROWS, weekForumPosts, weekNewsItem } from '../home-refactor-b/mocks';
import { PrototypeMobileNav } from '../nav-shared/PrototypeMobileNav';
import { CURATED_REPOS, REPOS_ATTRIBUTION } from '../home-refactor/mocks';
import { FOR_YOU_UIDS, ROLES, TOTAL_OPEN_ROLES } from '../home-v2/mocks';
import v2 from '../home-v2/HomeV2Prototype.module.scss';

import { ZaroNavBar, ZaroSignedOut } from './ZaroSignedOut';
import { ZaroMemberBar, ZaroSidebar, ZaroSignedIn } from './ZaroSignedIn';
import zs from './Zaro.module.scss';
import zm from './ZaroMember.module.scss';
import side from './SidebarNav.module.scss';
import type { PopularRailItem } from './PopularThisWeekRail';
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


/* News updates' pill row (2026-10-30): For You · All · Funding · Launch · Announcement. Milestone, Partnership
   and Other drew 1, 4 and 3 people in 90 days (Other is the uncategorised catch-all), so they are not pills; their
   posts stay under All and keep their label on the card. No Forum pill and no threads in the stream: "From the
   forum" above is the forum's section. */
const FOR_YOU_CAT = 'forYou';
const ALL_CAT = 'all';
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

export default function HomeV2ZaroPrototype() {
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
     production does, so the band and the rail never list the same story twice. */
  const popularThisWeek: PopularRailItem[] = useMemo(() => {
    const band = new Set([TOP_STORY.uid, ...TOP_STORY.alsoUids]);
    return news
      .filter((n) => !band.has(n.uid))
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


  if (!mounted) return <div className={v2.mountShell} />;

  const topicNews = (topic ? (view === 'news' ? allNews : news).filter((n) => n.tags.includes(topic)) : null) ?? [];
  /* Top stories: the newsfeed's editorial picks (lead + two rows), all from this week. Like production, the
     band shows on the resting view only (a hashtag scopes it away) and its stories leave the stream below. */
  /* The pill row: the week's stories, scoped by the hashtag, counted per pill; a pill at 0 is hidden. */
  const entries = topic ? news.filter((n) => n.tags.includes(topic)) : news;
  const inCat = (n: ITeamNewsItem, c: string) => {
    if (c === FOR_YOU_CAT) return FOR_YOU_UIDS.includes(n.uid);
    if (c === ALL_CAT) return true;
    return n.eventType === c;
  };
  const pills = [
    { id: FOR_YOU_CAT, label: 'For You' },
    { id: ALL_CAT, label: 'All' },
    ...TYPE_PILLS.map((id) => ({ id, label: EVENT_TYPE_LABEL[id] })),
  ]
    .map((p) => ({ ...p, count: entries.filter((n) => inCat(n, p.id)).length }))
    .filter((p) => p.id === ALL_CAT || p.count > 0);
  const activeCat = pills.some((p) => p.id === cat) ? cat : ALL_CAT;
  const isResting = activeCat === ALL_CAT || activeCat === FOR_YOU_CAT;

  const topLead = topic || !isResting ? undefined : news.find((n) => n.uid === TOP_STORY.uid);
  const topAlso = topLead
    ? (TOP_STORY.alsoUids.map((uid) => news.find((n) => n.uid === uid)).filter(Boolean) as ITeamNewsItem[])
    : [];
  const bandUids = new Set(topLead ? [topLead.uid, ...topAlso.map((n) => n.uid)] : []);
  const homeNews = entries
    .filter((n) => inCat(n, activeCat) && !bandUids.has(n.uid))
    .sort((a, b) => {
      if (sort === 'popular') return likeCount(b.uid) - likeCount(a.uid);
      if (sort === 'following') {
        const f = (n: ITeamNewsItem) => (followed.has(n.teamUid) ? 0 : 1);
        const d = f(a) - f(b);
        if (d) return d;
      }
      return b.eventDate.localeCompare(a.eventDate);
    });

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

  /* Signed in: the Zaro sidebar from 960 up, a framed member bar below it. Signed out: the Zaro top bar. */
  const shell = (children: ReactNode) =>
    signedIn ? (
      <div className={clsx(zs.page, zm.shell)}>
        <ZaroSidebar />
        <div className={zm.shellMain}>
          <ZaroMemberBar />
          {children}
        </div>
      </div>
    ) : (
      <>
        <ZaroNavBar onSignUp={signIn} onSignIn={signIn} />
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
            <ZaroSignedOut
              storyFor={(uid) => {
                const item = weekNewsItem(uid, now ?? new Date());
                return { ...item, tags: PROD_TAGS_BY_UID[uid] ?? item.tags };
              }}
              allHref={newsHref}
              onOpenStory={openStory}
              onSignUp={signIn}
              onSignIn={signIn}
            />
          ) : (
            <ZaroSignedIn
              weekLabel={WEEK_LABEL.format(mondayOf(now ?? new Date()))}
              forumPosts={forumUids.map((uid) => forumPosts[uid]).filter(Boolean)}
              onOpenForum={setForumDetail}
              pills={pills}
              activeCat={activeCat}
              onCat={(id) => setCat(activeCat === id ? ALL_CAT : id)}
              forYouId={FOR_YOU_CAT}
              sort={sort}
              onSort={setSort}
              topic={topic}
              topicCount={topicNews.length}
              onTopic={toggleTopic}
              topicFollowed={followedTopics.has(topic)}
              onToggleTopicFollow={() =>
                setFollowedTopics((prev) => {
                  const next = new Set(prev);
                  if (next.has(topic)) next.delete(topic);
                  else next.add(topic);
                  return next;
                })
              }
              topLead={topLead}
              topAlso={topAlso}
              stream={homeNews}
              newsHref={newsHref}
              likeCount={likeCount}
              isLiked={isLiked}
              onToggleLike={toggleLike}
              commentCount={(uid) => commentsFor(uid).length}
              followed={followed}
              onToggleFollow={toggleFollow}
              onOpenStory={openStory}
              popular={popularThisWeek}
              onOpenPopular={(uid) => {
                const story = news.find((n) => n.uid === uid);
                if (story) openStory(story);
              }}
              roles={ROLES}
              totalRoles={TOTAL_OPEN_ROLES}
              teams={SUGGESTED_TEAMS}
              deals={LATEST_DEALS}
              totalDeals={TOTAL_DEALS}
              repos={CURATED_REPOS}
              reposAttribution={REPOS_ATTRIBUTION}
            />
          )}
        </>,
      )}
      <PrototypeMobileNav hasUnreadNews={false} active />

      {modals}
    </>
  );
}

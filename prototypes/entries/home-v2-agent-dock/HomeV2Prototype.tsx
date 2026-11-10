'use client';

/**
 * REUSE MAP — home-v2-agent-dock: a copy of homepage (home-v2) where signed-in Home's floating
 * Agent pill becomes AgentCorner: Agent + history beside the Give feedback button, as Linear's bottom corner.
 * The sections below describe what was copied.
 *
 * Home: onboarding story signed out, member desk signed in.
 *
 * Production (imported read-only):
 *   explore-pl-network/EditorialIntro ...... its classes + data/content.ts, split into StoryIntro (header + Join card),
 *                                            FactsBand and EntitiesColumn per the 2026-10-30 mock
 *   explore-pl-network/PortfolioPanel ...... islands map + list (fed the static fallback JSON)
 *   explore-pl-network/ExploreLogoWall ..... VC logo wall (LinkedLogoWall: + a link per logo)
 *   explore-pl-network/aileron ............. the map's font variable (the live page sets it on its root)
 *   ExplorePlNetworkView.module.scss ....... white sheet, section titles
 *   navbar Signup / LoginBtn SCSS .......... the two auth doors, Sign up quiet + Sign in filled
 *   DEAL_ICONS (deals/dealsIcons) .......... vendor marks in DealsRail
 *   AuthInvalidUser shell (ModalBase) ...... copied as EmailNotFoundModal, new content
 *   app/home/page.module.css ............... signed-in page width
 *
 * Sibling prototypes (imported, not forked):
 *   home-refactor-b .... the week-feed grouping (title, now "Network Updates"; tab values) and its re-dated mocks
 *   home-refactor ...... JobsRail (gains an optional `note`), EventsRail, rail styles, mocks
 *   newsfeed-v0 ........ V0FeedCard + ForumPostCard (full cards in WeekFeed), ForumPostModal, FeedDetailModal, switch chrome
 *   nav-shared ......... PrototypeNavBar / PrototypeMobileNav
 *
 * New here: the page order per state, the focus-area links under the map, the
 * auth lines, the ?state= / ?events= review switches.
 */

import clsx from 'clsx';
import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import type { ITeamNewsItem, ITeamNewsPopularItem } from '@/types/team-news.types';

import home from '@/app/home/page.module.css';
import { ScrollToTopButton } from '@/components/page/forum/ScrollToTopButton';

import { ALL_CURATED_ITEMS, TOP_STORY } from '../newsfeed/mocks';
import feed from '../newsfeed/Newsfeed.module.scss';
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
import { JobsRail } from '../home-refactor/JobsRail';
import { EventsRail } from '../home-refactor/EventsRail';
import hr from '../home-refactor/HomeRefactorPrototype.module.scss';
import { RepoBanner } from '../home-refactor/RepoBanner';
import { CURATED_REPOS, REPOS_ATTRIBUTION } from '../home-refactor/mocks';
import { WEEK_LIKES, WEEK_ROWS, weekForumPosts, weekNewsItem } from '../home-refactor-b/mocks';
import { PopularThisWeekCard } from '@/components/page/home/TeamNews/components/NewsRail/components/PopularThisWeekCard/PopularThisWeekCard';
import { useHeaderSearch } from '../home-ai-ask/useHeaderSearch';
import { PrototypeNavBar } from '../nav-shared/PrototypeNavBar';
import { PrototypeMobileNav } from '../nav-shared/PrototypeMobileNav';

import { DealsRail } from './DealsRail';
import { WeekFeed } from './WeekFeed';
import { FocusAreas } from './StoryIntro';
import { NetworkOverview, SignedOutHome } from './SignedOutHome';
import { NewsGrid } from './NewsGrid';
import { SignupWizard } from '@/components/page/sign-up/components/SignupWizard';
import { TeamsToFollowRail } from './TeamsToFollowRail';
import { EmailNotFoundModal } from './EmailNotFoundModal';
import { AgentPanel } from '../home-v2-b/AgentPanel';
import type { AgentReply } from '../home-v2-b/agentScript';
import { AgentCorner, AgentGlyph } from './AgentCorner';
import {
  AGENT_VIEWERS,
  agentHistory,
  agentIntro,
  agentPlaceholder,
  agentPrompts,
  createAgentV0Script,
  type AgentChat,
  type AgentViewer,
} from './AgentV0';
import agentV0 from './AgentV0.module.scss';
import {
  EVENTS_STATES,
  HOME_STATES,
  IMAGE_BY_UID,
  LATEST_DEALS,
  PORTFOLIO_TEAMS,
  PROD_TAGS_BY_UID,
  REPOS_STATES,
  SUGGESTED_TEAMS,
  TOTAL_DEALS,
  TOTAL_OPEN_ROLES,
  TOTAL_UPCOMING_EVENTS,
  UNKNOWN_EMAIL,
  UPCOMING_EVENTS,
  isHomeState,
  rolesBesideEvents,
  type EventsState,
  type HomeState,
  type ReposState,
} from './mocks';
import s from './HomeV2Prototype.module.scss';

/** "See all news": every news story in the newsfeed corpus, once each; hiring roll-ups and deals are not news. */
const ALL_NEWS = Array.from(new Map(ALL_CURATED_ITEMS.map((i) => [i.uid, i])).values()).filter(
  (i) => i.eventType !== 'HIRING' && i.eventType !== 'DEALS',
);

/** The week's Top stories: the newsfeed's editorial picks, labelled in the stream (not pinned) and behind the Top pill. */
const TOP_STORY_UIDS = [TOP_STORY.uid, ...TOP_STORY.alsoUids];

type Option<T extends string> = { value: T; label: string; note: string };

const CUE_OPTIONS: Option<'fade' | 'jump'>[] = [
  {
    value: 'fade',
    label: 'Fade cut',
    note: 'Default. The feed runs down to the end of the rail (3 cards at least), the next one fades into "See all news", and the picks band follows.',
  },
  {
    value: 'jump',
    label: '+ Jump link',
    note: 'The same cut, plus "Open source picks ↓" in the feed header naming what is below.',
  },
];

const IMAGE_OPTIONS: Option<'side' | 'below'>[] = [
  { value: 'side', label: 'Beside headline', note: 'Default. A 16:9 image in the video poster’s column, right of the text.' },
  {
    value: 'below',
    label: 'Below description',
    note: 'The image at the card’s full width under the summary and hashtags, above the meta line.',
  },
];

/* LabOS Agent V0: who the member is decides what the agent offers. */
const VIEWER_OPTIONS: Option<AgentViewer['key']>[] = [
  {
    value: 'founder',
    label: 'Portfolio founder',
    note: 'Default. Maya Chen, Lattice Compute. The agent sends requests to the PL Venture team, updates both profiles and drafts forum posts.',
  },
  {
    value: 'member',
    label: 'Member',
    note: 'Sam Okafor, Driftwood Labs (not in the portfolio). Same agent with no PL Venture team requests: V0 has no use case for them yet.',
  },
];

/* newsfeed-v0's switch chrome, as home-refactor uses it. */
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
      <div className={clsx(v0.switch, s.reviewSwitch)} role="tablist" aria-label={label}>
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


export default function HomeV2Prototype() {
  /* Prototype routes server-render: read the URL only after mount so SSR === first client render. */
  const [mounted, setMounted] = useState(false);
  /* The week module's times are the viewer's clock (home-refactor-b re-dates its mocks to this week). */
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setMounted(true);
    setNow(new Date());
  }, []);
  const forumPosts = useMemo(() => weekForumPosts(now ?? new Date()), [now]);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const rawState = searchParams.get('state');
  const state: HomeState = isHomeState(rawState) ? rawState : 'signed-out';
  const eventsState: EventsState = searchParams.get('events') === 'none' ? 'none' : 'upcoming';
  const hasEvents = eventsState === 'upcoming';
  const reposState: ReposState = searchParams.get('repos') === 'none' ? 'none' : 'picks';
  const hasRepos = reposState === 'picks';
  const cue: 'fade' | 'jump' = searchParams.get('cue') === 'jump' ? 'jump' : 'fade';
  const imagePlacement: 'side' | 'below' = searchParams.get('image') === 'below' ? 'below' : 'side';

  const setParam = (key: string, value: string, fallback: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value === fallback) next.delete(key);
    else next.set(key, value);
    const q = next.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  };
  const setState = (v: HomeState) => setParam('state', v, 'signed-out');

  /* ?view=news is the "See all news" page; the other review params ride along. */
  const view: 'home' | 'news' = searchParams.get('view') === 'news' ? 'news' : 'home';
  const viewHref = (v: 'home' | 'news') => {
    const next = new URLSearchParams(searchParams.toString());
    if (v === 'home') next.delete('view');
    else next.set('view', v);
    const q = next.toString();
    return q ? `${pathname}?${q}` : pathname;
  };

  const signedIn = state === 'signed-in' || state === 'signed-in-no-deals';
  const hasDealsAccess = state === 'signed-in';
  /* home-refactor's header search: the field fills the free width, so the signed-out bar fits at 1200. */
  const navExtras = useHeaderSearch(signedIn);

  /* LabOS Agent V0 (members only): Agent in the bottom corner or Ctrl/⌘ J opens home-v2-b's docked panel,
     running this entry's script. ?agent=open opens it on arrival, for links straight to the agent. */
  const viewer = AGENT_VIEWERS[searchParams.get('viewer') === 'member' ? 'member' : 'founder'];
  const agentReplyFn = useMemo(() => createAgentV0Script(viewer), [viewer]);
  const [agentOpen, setAgentOpen] = useState(false);
  /* The past chat the panel is showing. Replayed here, in the click, so the script runs once and an open
     question in that chat can still be answered. */
  const [pastChat, setPastChat] = useState<{ chat: AgentChat; reply: AgentReply } | null>(null);
  const openPastChat = (chat: AgentChat) => {
    setPastChat({ chat, reply: agentReplyFn(chat.prompt) });
    setAgentOpen(true);
  };
  useEffect(() => {
    if (signedIn && searchParams.get('agent') === 'open') setAgentOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn]);
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

  /* Likes and comments: the feed's own model, seeded from its mocks (as home-refactor). */
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

  /* The rail beside the week feed: the feed's cut lands where it ends. */
  const railRef = useRef<HTMLElement>(null);
  /* A week story, re-dated (home-refactor-b) and re-tagged in production's hashtag vocabulary. */
  const storyFor = (uid: string): ITeamNewsItem => {
    const item = weekNewsItem(uid, now ?? new Date());
    return { ...item, tags: PROD_TAGS_BY_UID[uid] ?? item.tags };
  };

  /* Popular this week: the week's three most-liked stories, in production's
     ITeamNewsPopularItem shape. Ranked from the seeded likes, so a like in the
     feed doesn't reorder the rail mid-session (production snapshots on mount too).
     Top stories are left out, as production does, so the band and the rail never
     list the same story twice. */
  const popularThisWeek: ITeamNewsPopularItem[] = useMemo(
    () =>
      WEEK_ROWS.news
        .filter((r) => !TOP_STORY_UIDS.includes(r.newsUid!))
        .map((r) => weekNewsItem(r.newsUid!, now ?? new Date()))
        .sort((a, b) => (WEEK_LIKES[b.uid] ?? 0) - (WEEK_LIKES[a.uid] ?? 0))
        .slice(0, 3)
        .map((i) => ({
          uid: i.uid,
          title: i.title,
          teamUid: i.teamUid,
          teamName: i.teamName,
          sourceUrl: i.sourceUrl ?? '',
          upvoteCount: WEEK_LIKES[i.uid] ?? 0,
        })),
    [now],
  );

  const [detail, setDetail] = useState<FeedDetail | null>(null);
  const [forumDetail, setForumDetail] = useState<ForumPost | null>(null);
  /* `playVideo`: the story's video poster was the click target, so the modal opens playing. */
  const openStory = (story: ITeamNewsItem, playVideo?: boolean) =>
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
      autoplayVideo: playVideo,
      image: IMAGE_BY_UID[story.uid],
      isProtocolLabs: story.teamUid === PL_TEAM_UID,
      readUrl: story.sourceUrl ?? undefined,
    });

  /* The prototype's doors: Sign up and Sign in both land on the member page; the
     email-not-found state is reached from the review band. */
  const signUp = () => setState('signed-in');
  const signIn = () => setState('signed-in');
  /* Network news' "Personalize my news" (signed out) opens production's sign-up modal,
     SignupWizard, the one production shows for ?dialog=signup. Its submit calls the
     real API, so in the prototype it's for looking at, not completing. */
  const [signUpOpen, setSignUpOpen] = useState(false);

  if (!mounted) return <div className={s.mountShell} />;

  return (
    <>
      <PrototypeNavBar
        hasUnreadNews={false}
        active
        isLoggedIn={signedIn}
        onSignIn={signIn}
        onSignUp={signUp}
        {...navExtras}
        eventsInMore
      />
      <PrototypeMobileNav hasUnreadNews={false} active />

      {/* Review scaffolding — scrolls away; not part of the design. */}
      <div className={feed.reviewBand}>
        <div className={feed.reviewRow}>
          <Switch label="State" options={HOME_STATES} value={state} onChange={setState} />
          {signedIn && (
            <Switch
              label="Viewer"
              options={VIEWER_OPTIONS}
              value={viewer.key}
              onChange={(v) => setParam('viewer', v, 'founder')}
            />
          )}
          <Switch
            label="Events"
            options={EVENTS_STATES}
            value={eventsState}
            onChange={(v) => setParam('events', v, 'upcoming')}
          />
          {signedIn && (
            <Switch label="Repos" options={REPOS_STATES} value={reposState} onChange={(v) => setParam('repos', v, 'picks')} />
          )}
          {signedIn && hasRepos && (
            <Switch label="Below feed" options={CUE_OPTIONS} value={cue} onChange={(v) => setParam('cue', v, 'fade')} />
          )}
          {signedIn && view === 'home' && (
            <Switch
              label="Image"
              options={IMAGE_OPTIONS}
              value={imagePlacement}
              onChange={(v) => setParam('image', v, 'side')}
            />
          )}
        </div>
      </div>

      {signUpOpen && <SignupWizard onClose={() => setSignUpOpen(false)} />}

      {view === 'news' ? (
        /* "See all news": news only, 3 / 2 / 1 columns. Same page in both states;
           signed out, Follow and Like are the sign-up ask. */
        <div className={home.home}>
          <div className={clsx(home.home__cn, s.memberPage)}>
            <NewsGrid
              stories={ALL_NEWS.map((i) => storyFor(i.uid))}
              likeCount={likeCount}
              isLiked={isLiked}
              commentCount={(uid) => commentsFor(uid).length}
              followedTeams={followed}
              onOpen={openStory}
              onLike={(uid) => (signedIn ? toggleLike(uid) : signUp())}
              onFollow={(teamUid) => (signedIn ? toggleFollow(teamUid) : signUp())}
              homeHref={viewHref('home')}
              onPersonalize={signedIn ? undefined : () => setSignUpOpen(true)}
            />
          </div>
          {/* Production's forum ScrollToTopButton, unchanged (shows while scrolling down).
              Signed in, it stacks above the Agent pill instead of sitting under it. */}
          <div className={clsx(signedIn && s.scrollTopAboveAgent)}>
            <ScrollToTopButton />
          </div>
        </div>
      ) : signedIn ? (
        <div className={home.home}>
          <div className={clsx(home.home__cn, s.memberPage)}>
            {/* 1. One grouped overview: forum threads and picked news interleaved by
                recency (home-refactor-b's WeekModule, scoped to forum + news), so the
                first screen carries both. Deals and roles sit beside it in the rail;
                on phones the rail stacks after it. */}
            <div className={s.newsRow}>
              <WeekFeed
                storyFor={storyFor}
                likeCount={likeCount}
                followedTeams={followed}
                jumpTo={cue === 'jump' && hasRepos ? { href: '#home-repos', label: 'Open source picks' } : undefined}
                fillTo={railRef}
                newsHref={viewHref('news')}
                topStoryUids={TOP_STORY_UIDS}
                renderNews={(story, topic, isTop) => (
                  <V0FeedCard
                    onSelectTopic={topic.onSelectTopic}
                    activeTopic={topic.activeTopic}
                    topStory={isTop}
                    imageFor={(uid) => IMAGE_BY_UID[uid]}
                    imagePlacement={imagePlacement}
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
                  />
                )}
                forumTagsFor={(uid) => forumPosts[uid]?.tags ?? []}
                renderForum={(uid, topic) => {
                  const post = forumPosts[uid];
                  return post ? (
                    <ForumPostCard
                      onSelectTopic={topic.onSelectTopic}
                      activeTopic={topic.activeTopic}
                      post={post}
                      showComments
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

              {/* One full sidebar (the Digg reference): every rail module is a section of
                  a single card, divided by hairlines, instead of a stack of cards. */}
              <aside ref={railRef} className={s.rail}>
                <div className={s.sidebar}>
                  {/* Open roles always; upcoming events only when there are some, else roles take the room. */}
                  <JobsRail jobs={rolesBesideEvents(hasEvents)} total={TOTAL_OPEN_ROLES} />
                  {hasEvents && <EventsRail events={UPCOMING_EVENTS} total={TOTAL_UPCOMING_EVENTS} />}
                  {/* Production's news rail, in its order: Teams to follow, then Popular this week. */}
                  <TeamsToFollowRail
                    suggestions={SUGGESTED_TEAMS}
                    followedTeamUids={followed}
                    onFollow={toggleFollow}
                  />
                  {/* 3. Deals: only with deals.read. No locked teaser without it. Under Teams to
                      follow, on a filled panel so the perk reads apart from the network lists. */}
                  {hasDealsAccess && <DealsRail deals={LATEST_DEALS} total={TOTAL_DEALS} />}
                  <PopularThisWeekCard
                    items={popularThisWeek}
                    onPopularItemClick={(item) => openStory(storyFor(item.uid))}
                  />
                </div>
              </aside>
            </div>

            {/* 4. Under the cut feed: the network's open-source picks (home-refactor's band).
                Nobody curates them yet; with none, nothing takes their place. */}
            {hasRepos && (
              <div id="home-repos" className={s.reposSection}>
                <RepoBanner repos={CURATED_REPOS} attribution={REPOS_ATTRIBUTION} weekLabel="Week of Oct 26" />
              </div>
            )}

            {/* 5. The focus areas, as signed out (Explore's simpler look): production Home's
                bottom section kept, about 1% use it, until something better browses by area. */}
            <section className={s.reposSection} aria-labelledby="home-focus-title">
              <h2 id="home-focus-title" className={s.rowTitle}>
                Browse by focus area
              </h2>
              <FocusAreas teams={PORTFOLIO_TEAMS} />
            </section>
          </div>

          {/* 6. Under the focus areas (2026-11-06): the signed-out page's network overview,
              the portfolio map, PL entities and investor logos, shared so the two can't drift.
              The focus-area cards are already above, so the band leaves them out. */}
          <NetworkOverview focusAreas={false} className={s.memberOverview} />
        </div>
      ) : (
        /* The signed-out Home settled at the 2026-11-02 standup (shared with home-v2-b). */
        <SignedOutHome
          storyFor={storyFor}
          allHref={viewHref('news')}
          allCount={ALL_NEWS.length}
          likeCount={likeCount}
          commentCount={(uid) => commentsFor(uid).length}
          onOpenStory={openStory}
          onSignUp={signUp}
          onSignIn={signIn}
          hasEvents={hasEvents}
        />
      )}

      {signedIn && (
        <>
          {/* Keyed by viewer and past chat: switching either starts from that conversation. */}
          <AgentPanel
            key={`${viewer.key}-${pastChat?.chat.id ?? 'new'}`}
            initialThread={pastChat ? [{ text: pastChat.chat.prompt, reply: pastChat.reply }] : undefined}
            headIcon={<AgentGlyph />}
            open={agentOpen}
            onClose={() => setAgentOpen(false)}
            reply={agentReplyFn}
            greeting={`Hi ${viewer.firstName}, what can I do for you?`}
            intro={agentIntro(viewer)}
            prompts={agentPrompts(viewer)}
            placeholder={agentPlaceholder(viewer)}
            className={agentV0.panelOnHome}
          />
          <AgentCorner
            agentOpen={agentOpen}
            onOpenAgent={() => setAgentOpen(true)}
            chats={agentHistory(viewer)}
            onOpenChat={openPastChat}
            viewer={{ uid: `viewer-${viewer.key}`, name: viewer.name, email: viewer.email }}
          />
        </>
      )}

      <EmailNotFoundModal
        open={state === 'email-not-found'}
        email={UNKNOWN_EMAIL}
        onClose={() => setState('signed-out')}
        onSignUp={signUp}
        onTryAnother={() => setState('signed-out')}
      />

      <FeedDetailModal
        detail={detail}
        onClose={() => setDetail(null)}
        likeCount={detail ? likeCount(detail.id) : 0}
        liked={detail ? isLiked(detail.id) : false}
        onToggleLike={() => detail && toggleLike(detail.id)}
        citationStyle="superscript"
        showComments={signedIn}
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
}

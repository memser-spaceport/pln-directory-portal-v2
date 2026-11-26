'use client';

/**
 * agent (2026-11-17): the LabOS Agent as ONE right-hand drawer, feedback folded into it.
 *
 * Built on homepage-redesign-v0-agent (folder home-v2-agent-dock), whose Home pieces it imports unchanged.
 * Signed in only. What's new is in this folder:
 *   AgentDrawer ... one "Agent" door + the drawer (history, context, Ask AI hand-off)
 *   AgentChat ..... the panel (fork of home-v2-b's AgentPanel) with the context row and the @ / + picker
 *   script ........ role-aware actions (founder / lead / member), feedback as an action, answers about context
 *   items ......... what can be put in context: pages, news, teams, members, events, forum threads
 *
 * Review switches: ?page=profile, ?viewer=lead|member, ?askai=off, ?agent=open, ?pageread=off, ?handoff=fail.
 *
 * LAB-3389 (2026-11-24): "Open in AI Search" in the drawer's header, a resizable panel (drag the left edge,
 * 400 to 720px, kept in localStorage), and the page the member is on as a labelled first chip ("Context Home").
 */

import clsx from 'clsx';
import { Sparkle } from '@phosphor-icons/react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import type { ITeamNewsItem, ITeamNewsPopularItem } from '@/types/team-news.types';
import home from '@/app/page.module.css';
import { PopularThisWeekCard } from '@/components/page/home/TeamNews/components/NewsRail/components/PopularThisWeekCard/PopularThisWeekCard';

import { TOP_STORY } from '../newsfeed/mocks';
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
import { WEEK_LIKES, WEEK_ROWS, weekForumPosts, weekNewsItem } from '../home-refactor-b/mocks';
import { useHeaderSearch } from '../home-ai-ask/useHeaderSearch';
import { PrototypeNavBar } from '../nav-shared/PrototypeNavBar';
import { PrototypeMobileNav } from '../nav-shared/PrototypeMobileNav';
import { MemberProfilePage } from '../member-profile/MemberProfilePrototype';
import { MOCK_MEMBER } from '../member-profile/mocks';
import { DealsRail } from '../home-v2-agent-dock/DealsRail';
import { WeekFeed } from '../home-v2-agent-dock/WeekFeed';
import { TeamsToFollowRail } from '../home-v2-agent-dock/TeamsToFollowRail';
import {
  IMAGE_BY_UID,
  LATEST_DEALS,
  PROD_TAGS_BY_UID,
  SUGGESTED_TEAMS,
  TOTAL_DEALS,
  TOTAL_OPEN_ROLES,
  TOTAL_UPCOMING_EVENTS,
  UPCOMING_EVENTS,
  rolesBesideEvents,
} from '../home-v2-agent-dock/mocks';
import hv from '../home-v2-agent-dock/HomeV2Prototype.module.scss';
import type { AgentReply } from '../home-v2-b/agentScript';

import { AgentDrawer, type AskRequest } from './AgentDrawer';
import { buildCatalog, newsItemFor, PAGES, type AgentItem } from './items';
import { VIEWER_NOTES, VIEWERS, type Prompt, type ViewerKey } from './script';
import s from './Agent.module.scss';

const TOP_STORY_UIDS = [TOP_STORY.uid, ...TOP_STORY.alsoUids];

type Option<T extends string> = { value: T; label: string; note: string };

const PAGE_OPTIONS: Option<'home' | 'profile'>[] = [
  { value: 'home', label: 'Home', note: 'Default. The agent opens reading Home.' },
  {
    value: 'profile',
    label: 'Member profile',
    note: 'Maya Okonkwo’s profile. The agent opens reading it and offers questions about her first.',
  },
];

const VIEWER_OPTIONS: Option<ViewerKey>[] = [
  { value: 'founder', label: 'Portfolio founder', note: VIEWER_NOTES.founder },
  { value: 'lead', label: 'Team lead', note: VIEWER_NOTES.lead },
  { value: 'member', label: 'Member', note: VIEWER_NOTES.member },
];

const PAGE_READ_OPTIONS: Option<'on' | 'off'>[] = [
  {
    value: 'on',
    label: 'Readable',
    note: 'Default. The context row starts with “Context <this page>”; ✕ turns it into “Not in context <this page> +”, which puts it back in one press.',
  },
  {
    value: 'off',
    label: 'Can’t read',
    note: 'A page the agent may not read (settings, messages). The first slot says “Can’t read this page”, with nothing to press.',
  },
];

const HANDOFF_OPTIONS: Option<'ok' | 'fail'>[] = [
  { value: 'ok', label: 'Works', note: 'Default. “AI agent chat” in the header opens this chat as a new AI agent chat thread, in a new tab.' },
  {
    value: 'fail',
    label: 'Fails once',
    note: 'The first press fails: the member stays in the agent with the chat and sees the error with Retry. Retry works.',
  },
];

const ASK_OPTIONS: Option<'on' | 'off'>[] = [
  {
    value: 'on',
    label: 'On',
    note: 'Default. Ask AI at the end of each news card’s actions opens the agent on that story. Exploration, not settled.',
  },
  { value: 'off', label: 'Off', note: 'No Ask AI on cards: stories get into the agent only through @ or +.' },
];

/* newsfeed-v0's switch chrome, as the Home entries use it. */
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
      <div className={clsx(v0.switch, hv.reviewSwitch)} role="tablist" aria-label={label}>
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

export default function AgentPrototype() {
  /* Prototype routes server-render: read the URL and the clock only after mount. */
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const setParam = (key: string, value: string, fallback: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value === fallback) next.delete(key);
    else next.set(key, value);
    const q = next.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  };

  const pageKey: 'home' | 'profile' = searchParams.get('page') === 'profile' ? 'profile' : 'home';
  const rawViewer = searchParams.get('viewer');
  const viewerKey: ViewerKey = rawViewer === 'lead' || rawViewer === 'member' ? rawViewer : 'founder';
  const askAi = searchParams.get('askai') !== 'off';
  const pageRead = searchParams.get('pageread') !== 'off';
  const handoffFails = searchParams.get('handoff') === 'fail';
  const catalog = useMemo(() => (now ? buildCatalog(now) : []), [now]);

  if (!now) return <div className={hv.mountShell} />;

  const reviewBand = (
    <div className={feed.reviewBand}>
      <div className={feed.reviewRow}>
        <Switch label="Page" options={PAGE_OPTIONS} value={pageKey} onChange={(v) => setParam('page', v, 'home')} />
        <Switch label="Viewer" options={VIEWER_OPTIONS} value={viewerKey} onChange={(v) => setParam('viewer', v, 'founder')} />
        <Switch
          label="This page"
          options={PAGE_READ_OPTIONS}
          value={pageRead ? 'on' : 'off'}
          onChange={(v) => setParam('pageread', v, 'on')}
        />
        <Switch
          label="Open in AI agent chat"
          options={HANDOFF_OPTIONS}
          value={handoffFails ? 'fail' : 'ok'}
          onChange={(v) => setParam('handoff', v, 'ok')}
        />
        {pageKey === 'home' && (
          <Switch label="Ask AI" options={ASK_OPTIONS} value={askAi ? 'on' : 'off'} onChange={(v) => setParam('askai', v, 'on')} />
        )}
      </div>
    </div>
  );

  const shared = {
    viewerKey,
    catalog,
    openOnArrival: searchParams.get('agent') === 'open',
    pageRead,
    handoffFails,
  };

  return pageKey === 'profile' ? (
    <ProfilePage {...shared} reviewBand={reviewBand} />
  ) : (
    <HomePage {...shared} now={now} askAi={askAi} reviewBand={reviewBand} />
  );
}

function Chrome() {
  const navExtras = useHeaderSearch(true);
  return (
    <>
      <PrototypeNavBar hasUnreadNews={false} active isLoggedIn onSignIn={() => {}} onSignUp={() => {}} {...navExtras} eventsInMore />
      <PrototypeMobileNav hasUnreadNews={false} active />
    </>
  );
}

/* ---------- Home (signed in) ---------- */

function HomePage({
  now,
  viewerKey,
  catalog,
  askAi,
  openOnArrival,
  pageRead,
  handoffFails,
  reviewBand,
}: {
  now: Date;
  viewerKey: ViewerKey;
  catalog: AgentItem[];
  askAi: boolean;
  openOnArrival: boolean;
  pageRead: boolean;
  handoffFails: boolean;
  reviewBand: ReactNode;
}) {
  const forumPosts = useMemo(() => weekForumPosts(now), [now]);

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

  const railRef = useRef<HTMLElement>(null);
  const storyFor = (uid: string): ITeamNewsItem => {
    const item = weekNewsItem(uid, now);
    return { ...item, tags: PROD_TAGS_BY_UID[uid] ?? item.tags };
  };

  const popularThisWeek: ITeamNewsPopularItem[] = useMemo(
    () =>
      WEEK_ROWS.news
        .filter((r) => !TOP_STORY_UIDS.includes(r.newsUid!))
        .map((r) => weekNewsItem(r.newsUid!, now))
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

  /* Ask AI on a card hands the story to the drawer; seq makes asking about the same story again count. */
  const [ask, setAsk] = useState<AskRequest | null>(null);
  const askAbout = (story: ITeamNewsItem) => setAsk((cur) => ({ seq: (cur?.seq ?? 0) + 1, item: newsItemFor(story) }));

  return (
    <>
      <Chrome />
      {reviewBand}

      <div className={home.home}>
        <div className={clsx(home.home__cn, hv.memberPage)}>
          <div className={hv.newsRow}>
            <WeekFeed
              storyFor={storyFor}
              likeCount={likeCount}
              followedTeams={followed}
              fillTo={railRef}
              topStoryUids={TOP_STORY_UIDS}
              renderNews={(story, topic, isTop) => (
                <V0FeedCard
                  onSelectTopic={topic.onSelectTopic}
                  activeTopic={topic.activeTopic}
                  topStory={isTop}
                  imageFor={(uid) => IMAGE_BY_UID[uid]}
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
                  devFollow
                  showComments
                  likeCount={likeCount}
                  isLiked={isLiked}
                  onToggleLike={toggleLike}
                  commentsFor={commentsFor}
                  onAddComment={addComment}
                  onOpenStory={openStory}
                  footerExtra={
                    askAi
                      ? (st) => (
                          <button
                            type="button"
                            className={s.askAi}
                            onClick={(e) => {
                              e.stopPropagation();
                              askAbout(st);
                            }}
                            title="Ask the agent about this story"
                          >
                            <Sparkle weight="regular" />
                            Ask AI
                          </button>
                        )
                      : undefined
                  }
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

            <aside ref={railRef} className={hv.rail}>
              <div className={hv.sidebar}>
                <JobsRail jobs={rolesBesideEvents(true)} total={TOTAL_OPEN_ROLES} />
                <EventsRail events={UPCOMING_EVENTS} total={TOTAL_UPCOMING_EVENTS} />
                <TeamsToFollowRail suggestions={SUGGESTED_TEAMS} followedTeamUids={followed} onFollow={toggleFollow} />
                <DealsRail deals={LATEST_DEALS} total={TOTAL_DEALS} />
                <PopularThisWeekCard items={popularThisWeek} onPopularItemClick={(item) => openStory(storyFor(item.uid))} />
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* Keyed by viewer: switching role starts from that member's agent. */}
      <AgentDrawer
        key={`${viewerKey}-${pageRead}-${handoffFails}`}
        page={PAGES.home}
        pageReadable={pageRead}
        handoffFailsOnce={handoffFails}
        viewer={VIEWERS[viewerKey]}
        recentPages={[PAGES.maya, PAGES.lattice, PAGES.jobs]}
        catalog={catalog}
        ask={ask}
        openOnArrival={openOnArrival}
      />

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
}

/* ---------- Member profile ---------- */

const FIRST = MOCK_MEMBER.name.split(' ')[0];

const PROFILE_PROMPTS: Prompt[] = [
  { text: `What is ${FIRST} working on, and why would we talk?`, topic: 'profile' },
  { text: `Draft a message asking ${FIRST} for 15 minutes`, topic: 'intro' },
];

const ABOUT_RE = new RegExp(`\\b(${FIRST}|her|she|this (person|member|profile))\\b`, 'i');

/** Answers about the profile, from its mocks; with the profile chip removed the agent says so. */
function profileReply(text: string, reading: AgentItem[]): AgentReply | null {
  if (!ABOUT_RE.test(text)) return null;
  if (!reading.some((r) => r.id === PAGES.maya.id))
    return {
      steps: [],
      blocks: [
        { kind: 'text', text: `I'm not reading ${MOCK_MEMBER.name}'s profile right now. Add it back with + below and ask again.` },
      ],
    };
  const steps = [`Read ${MOCK_MEMBER.name}`, 'Read her teams and office hours'];
  if (/draft|message|15 minutes/i.test(text))
    return {
      steps,
      blocks: [
        { kind: 'text', text: `${FIRST} has office hours, so this goes with a booking link. Here’s a draft:` },
        {
          kind: 'text',
          text: `“Hi ${FIRST}, I saw you're building verifiable compute markets and that you're open to talking with technical operators. We're working on something close to it and I'd value 15 minutes on how you price GPU time. I've booked a slot in your office hours; happy to move it if another time suits you better.”`,
        },
      ],
    };
  return {
    steps,
    blocks: [
      {
        kind: 'text',
        text: `${FIRST} is building verifiable compute markets for AI training. Before that she led GPU scheduling at a large cloud. She offers office hours on ${MOCK_MEMBER.ohHelpWith.join(', ').toLowerCase()}.`,
      },
      { kind: 'text', text: 'Why talk: she asks to hear from infra-focused funds and technical operators. Want me to draft a message?' },
    ],
  };
}

function ProfilePage({
  viewerKey,
  catalog,
  openOnArrival,
  pageRead,
  handoffFails,
  reviewBand,
}: {
  viewerKey: ViewerKey;
  catalog: AgentItem[];
  openOnArrival: boolean;
  pageRead: boolean;
  handoffFails: boolean;
  reviewBand: ReactNode;
}) {
  return (
    <>
      <Chrome />
      <MemberProfilePage askAi="header" reviewBand={reviewBand} />
      <AgentDrawer
        key={`${viewerKey}-${pageRead}-${handoffFails}`}
        page={PAGES.maya}
        pageReadable={pageRead}
        handoffFailsOnce={handoffFails}
        aiSearchScope={{ about: 'member' }}
        viewer={VIEWERS[viewerKey]}
        recentPages={[PAGES.home, PAGES.lattice, PAGES.jobs]}
        catalog={catalog}
        pagePrompts={PROFILE_PROMPTS}
        pageReply={profileReply}
        openOnArrival={openOnArrival}
      />
    </>
  );
}

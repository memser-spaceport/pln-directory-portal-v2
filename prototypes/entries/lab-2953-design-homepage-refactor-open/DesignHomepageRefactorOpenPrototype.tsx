'use client';

/**
 * REUSE MAP — lab-2953 (Home refactor, round 2: Polina's updates of 2026-10-28)
 *
 * One Home with two views (review switch "Preview as"):
 *   Signed out ... orientation for new visitors: the field, the focus areas and
 *                  key facts, the logo islands, then open roles.
 *   Signed in .... the member's priorities: forum posts, deals, a news
 *                  selection; open roles in the rail; events only when the
 *                  review switch shows them (they wait on more event data).
 *
 * Sibling prototypes (imported, not forked):
 *   home-ai-ask ......... HomeAsk (copied here as AskField: prompts and
 *                         headline are props), useHeaderSearch, HomeAsk styles
 *   home-refactor ....... JobsRail, EventsRail, page grid + section styles, mocks
 *   newsfeed / -v0 ...... TopStoriesBlock, ForumPostCard + modals, switch chrome
 *   explore-pl-network .. FOCUS_AREAS, PL_FACTS, ISLANDS, IslandsMap
 *   nav-shared .......... PrototypeNavBar / PrototypeMobileNav (Jobs in the bar)
 *
 * New here: DealsModule (a compact copy of production's DealCard), the
 * orientation band, the personalized-prompt note and AgentPanel (concept).
 */

import clsx from 'clsx';
import Link from 'next/link';
import { useState } from 'react';

import type { ITeamNewsItem } from '@/types/team-news.types';

import styles from '@/app/home/page.module.css';
import nb from '@/components/page/home/TeamNews/components/NewsBase/NewsBase.module.scss';

import homeAsk from '../home-ai-ask/HomeAsk.module.scss';
import { useHeaderSearch } from '../home-ai-ask/useHeaderSearch';
import { EventsRail } from '../home-refactor/EventsRail';
import { JobsRail } from '../home-refactor/JobsRail';
import hr from '../home-refactor/HomeRefactorPrototype.module.scss';
import { IslandsMap } from '../explore-pl-network/IslandsMap';
import type { PortfolioLogo } from '../explore-pl-network/islands';
import { TopStoriesBlock } from '../newsfeed/TopStoriesBlock';
import { TOP_STORY } from '../newsfeed/mocks';
import feed from '../newsfeed/Newsfeed.module.scss';
import { ForumPostCard } from '../newsfeed-v0/ForumPostCard';
import { ForumPostModal } from '../newsfeed-v0/ForumPostModal';
import { FeedDetailModal, type FeedDetail } from '../newsfeed-v0/FeedDetailModal';
import { EVENT_TYPE_HEX, EVENT_TYPE_LABEL } from '../newsfeed-v0/eventMeta';
import { COMMENTS_BY_UID, PL_TEAM_UID, SOURCES_BY_UID, type ForumPost } from '../newsfeed-v0/mocks';
import v0 from '../newsfeed-v0/NewsfeedV0.module.scss';
import { PrototypeMobileNav } from '../nav-shared/PrototypeMobileNav';
import { PrototypeNavBar } from '../nav-shared/PrototypeNavBar';

import { AgentPanel } from './AgentPanel';
import { AskField } from './AskField';
import { DealsModule } from './DealsModule';
import {
  FOCUS_AREAS,
  FORUM_PICKS,
  HOME_DEALS,
  HOME_EVENTS,
  HOME_JOBS,
  ISLANDS,
  MEMBER,
  NEWS_ALSO,
  NEWS_LEAD,
  PL_FACTS,
  PROMPTS_SIGNED_IN,
  PROMPTS_SIGNED_OUT,
  TOTAL_DEALS,
  TOTAL_OPEN_ROLES,
  TOTAL_UPCOMING_EVENTS,
} from './mocks';
import s from './DesignHomepageRefactorOpenPrototype.module.scss';

type Option<T extends string> = { value: T; label: string; note: string };

const VIEWERS: Option<'out' | 'in'>[] = [
  { value: 'out', label: 'Signed out', note: 'A new visitor: what the network is, then where to start.' },
  { value: 'in', label: 'Signed in', note: 'A member: forum, deals and news first.' },
];

const EVENTS: Option<'off' | 'on'>[] = [
  { value: 'off', label: 'Hidden', note: 'Events wait on more event data.' },
  { value: 'on', label: 'Shown', note: 'The rail when there is enough event data.' },
];

const AGENT: Option<'on' | 'off'>[] = [
  { value: 'on', label: 'On', note: 'Concept: an agent that searches, books office hours and drafts posts.' },
  { value: 'off', label: 'Off', note: 'Home without the agent.' },
];

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
      <div className={v0.switch} role="tablist" aria-label={label}>
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

function SectionHead({
  id,
  title,
  sub,
  href,
  linkLabel,
}: {
  id: string;
  title: string;
  sub?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className={hr.sectionHead}>
      <div className={hr.sectionHeadText}>
        <h2 id={id} className={clsx(nb.title, homeAsk.homeNewsTitle)}>
          {title}
        </h2>
        {sub && <p className={hr.sectionSub}>{sub}</p>}
      </div>
      {href && linkLabel && (
        <a href={href} className={hr.seeAll}>
          {linkLabel}
        </a>
      )}
    </div>
  );
}

const islandColor = (id: string) => ISLANDS.find((i) => i.id === id)?.color;
const teamUrl = (logo: PortfolioLogo) => `/teams?searchBy=${encodeURIComponent(logo.name)}`;

/** Signed out: what the network is, in the explore page's own words and map. */
function Orientation() {
  const facts = PL_FACTS.filter((f) => f.value !== 'portfolio');
  return (
    <>
      <section className={s.orient} aria-labelledby="home-orient-title">
        <SectionHead
          id="home-orient-title"
          title="What the network works on"
          sub="Protocol Labs is a network of teams that build open technology."
          href="/explore-pl-network"
          linkLabel="About the network"
        />
        <ul className={s.facts}>
          {facts.map((f) => (
            <li key={f.label} className={s.fact}>
              <span className={s.factValue}>{f.value}</span>
              <span className={s.factLabel}>{f.label}</span>
            </li>
          ))}
        </ul>
        <ul className={s.areas}>
          {FOCUS_AREAS.map((a) => (
            <li key={a.name} className={s.area}>
              <span className={s.areaDot} style={{ background: islandColor(a.island) }} aria-hidden />
              <span className={s.areaName}>{a.name}</span>
              <span className={s.areaLine}>{a.line}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={s.islands} aria-labelledby="home-islands-title">
        <SectionHead
          id="home-islands-title"
          title="Teams in the network"
          sub="Each tile is a portfolio team. Click a logo to meet the team."
        />
        {/* Phones: the map is very tall there, so it is cropped with a fade and a link out. */}
        <div className={s.islandsCrop}>
          <IslandsMap onOpenProfile={teamUrl} />
        </div>
        <Link href="/explore-pl-network" className={clsx(hr.seeAll, s.islandsMore)}>
          Explore all teams
        </Link>
      </section>
    </>
  );
}

export default function DesignHomepageRefactorOpenPrototype() {
  const [viewer, setViewer] = useState<'out' | 'in'>('out');
  const [events, setEvents] = useState<'off' | 'on'>('off');
  const [agent, setAgent] = useState<'on' | 'off'>('on');
  const signedIn = viewer === 'in';
  const navExtras = useHeaderSearch(signedIn);

  const [liked, setLiked] = useState<Set<string>>(new Set());
  const isLiked = (uid: string) => liked.has(uid);
  const likeCount = (uid: string) => (isLiked(uid) ? 1 : 0);
  const toggleLike = (uid: string) =>
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  const commentsFor = (uid: string) => COMMENTS_BY_UID[uid] ?? [];

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
      summary: story.summary ?? null,
      time: story.eventDate,
      sources: SOURCES_BY_UID[story.uid],
      isProtocolLabs: story.teamUid === PL_TEAM_UID,
      readUrl: story.sourceUrl ?? undefined,
    });

  const promptsNote = signedIn ? (
    <p className={s.promptNote}>
      Suggested from what you follow ({MEMBER.follows.join(', ')}). Rough: the personalization engine does not exist
      yet.
    </p>
  ) : null;

  const rail = (
    <div className={hr.railStack}>
      <JobsRail jobs={HOME_JOBS} total={TOTAL_OPEN_ROLES} />
      {signedIn && events === 'on' && <EventsRail events={HOME_EVENTS} total={TOTAL_UPCOMING_EVENTS} />}
    </div>
  );

  return (
    <>
      <PrototypeNavBar
        hasUnreadNews={false}
        active
        jobsInBar
        isLoggedIn={signedIn}
        onSignIn={() => setViewer('in')}
        onSignUp={() => setViewer('in')}
        {...navExtras}
      />
      <PrototypeMobileNav hasUnreadNews={false} active />

      {/* Review scaffolding — scrolls away; not part of the design. */}
      <div className={feed.reviewBand}>
        <div className={feed.reviewRow}>
          <Switch label="Preview as" options={VIEWERS} value={viewer} onChange={setViewer} />
          {signedIn && <Switch label="Upcoming events" options={EVENTS} value={events} onChange={setEvents} />}
          <Switch label="Agent" options={AGENT} value={agent} onChange={setAgent} />
        </div>
      </div>

      <div className={styles.home}>
        <div className={clsx(styles.home__cn, hr.page)}>
          <div className={hr.hero}>
            <AskField
              key={viewer}
              mode="overview"
              size="composer"
              signedIn={signedIn}
              viewer="member"
              headline={signedIn ? `Good afternoon, ${MEMBER.firstName}` : 'Explore the Protocol Labs network'}
              prompts={signedIn ? PROMPTS_SIGNED_IN : PROMPTS_SIGNED_OUT}
              promptsLabel={signedIn ? 'For you' : 'Try'}
              promptsNote={promptsNote}
            />
          </div>

          {signedIn ? (
            <div className={s.memberGrid}>
              <section className={clsx(hr.section, s.areaForum)} aria-labelledby="home-forum-title">
                <SectionHead id="home-forum-title" title="From the forum" href="/forum" linkLabel="Go to forum" />
                <div className={hr.forumGrid}>
                  {FORUM_PICKS.map((post) => (
                    <ForumPostCard
                      key={post.uid}
                      post={post}
                      showComments={false}
                      likeCount={likeCount(post.uid)}
                      liked={isLiked(post.uid)}
                      onToggleLike={() => toggleLike(post.uid)}
                      comments={commentsFor(post.uid)}
                      onAddComment={() => undefined}
                      isCommentLiked={isLiked}
                      onToggleCommentLike={toggleLike}
                      onOpenDetail={() => setForumDetail(post)}
                    />
                  ))}
                </div>
              </section>

              <section className={clsx(hr.section, s.areaDeals)} aria-labelledby="home-deals-title">
                <SectionHead
                  id="home-deals-title"
                  title="Deals for your team"
                  sub="Offers from vendors for network teams."
                  href="/deals"
                  linkLabel={`See all ${TOTAL_DEALS} deals`}
                />
                <DealsModule deals={HOME_DEALS} />
              </section>

              <section className={clsx(hr.section, s.areaNews)} aria-labelledby="home-news-title">
                <SectionHead
                  id="home-news-title"
                  title="Selected news"
                  sub="All news moves under More in the navigation."
                  href="/prototypes/newsfeed"
                  linkLabel="All news"
                />
                <TopStoriesBlock
                  lead={NEWS_LEAD}
                  also={NEWS_ALSO}
                  top={TOP_STORY}
                  followedTeams={followed}
                  onToggleFollow={toggleFollow}
                  likeCount={likeCount}
                  isLiked={isLiked}
                  onToggleLike={toggleLike}
                  commentCount={(uid) => commentsFor(uid).length}
                  onOpenStory={openStory}
                />
              </section>

              <aside className={s.areaRail}>{rail}</aside>
            </div>
          ) : (
            <div className={s.visitorGrid}>
              <div className={s.areaMain}>
                <Orientation />
              </div>
              <aside className={s.areaRail}>{rail}</aside>
            </div>
          )}
        </div>
      </div>

      {agent === 'on' && <AgentPanel />}

      <FeedDetailModal
        detail={detail}
        onClose={() => setDetail(null)}
        likeCount={detail ? likeCount(detail.id) : 0}
        liked={detail ? isLiked(detail.id) : false}
        onToggleLike={() => detail && toggleLike(detail.id)}
        citationStyle="superscript"
        showComments={false}
        comments={[]}
        onAddComment={() => undefined}
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
        onAddComment={() => undefined}
        isCommentLiked={isLiked}
        onToggleCommentLike={toggleLike}
      />
    </>
  );
}

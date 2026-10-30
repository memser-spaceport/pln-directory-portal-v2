'use client';

/**
 * REUSE MAP — lab-2953 home-v2 (Polina's brief of 2026-10-29, version 2 of the
 * LAB-2953 prototype; version 1 stays at lab-2953-design-homepage-refactor-open)
 *
 * Review switch `?state=signed-out | signed-in | signed-in-no-deals |
 * email-not-found`, default signed-out.
 *
 *   Signed out ... the onboarding story: EditorialIntro + both auth doors,
 *                  focus areas + PortfolioPanel (islands map), open roles,
 *                  ExploreLogoWall, a 3-item news preview with a sign-up line.
 *   Signed in .... QuickActions band (AI Apps and Job Board first), forum,
 *                  deals (only with deals access), a 5-item news selection,
 *                  open roles, upcoming events behind a flag (off).
 *   Email not found  the signed-out page with production's AuthInvalidUser
 *                  shell, without the dead end.
 *
 * Production, imported as is: EditorialIntro, PortfolioPanel, ExploreLogoWall
 * (explore-pl-network, no tracking callbacks passed), ActionCard (QuickActions),
 * ModalBase, Button, the Signup / LoginBtn styles, the navbar icons.
 * Sibling prototypes: home-refactor JobsRail + EventsRail + section styles,
 * newsfeed-v0 ForumPostCard + modals, nav-shared PrototypeNavBar.
 * Copied from version 1: DealsModule.
 */

import clsx from 'clsx';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

import type { ITeamNewsItem } from '@/types/team-news.types';

import styles from '@/app/home/page.module.css';
import { Button } from '@/components/common/Button';
import { ModalBase } from '@/components/common/ModalBase';
import { WarningCircleIcon } from '@/components/icons';
import { DealsIcon, JobsIcon, StarFourIcon } from '@/components/core/navbar/components/icons';
import signupCss from '@/components/core/navbar/components/Signup/Signup.module.scss';
import loginCss from '@/components/core/navbar/components/LoginBtn/LoginButton.module.scss';
import invalidCss from '@/components/core/login/components/modals/AuthInvalidUser/AuthInvalidUser.module.scss';
import { ActionCard } from '@/components/page/home/QuickActions/components/ActionCard';
import qa from '@/components/page/home/QuickActions/QuickActions.module.scss';
import nb from '@/components/page/home/TeamNews/components/NewsBase/NewsBase.module.scss';
import { EditorialIntro } from '@/components/page/explore-pl-network/EditorialIntro/EditorialIntro';
import { PortfolioPanel } from '@/components/page/explore-pl-network/PortfolioPanel/PortfolioPanel';
import { ExploreLogoWall } from '@/components/page/explore-pl-network/ExploreLogoWall/ExploreLogoWall';
import { aileron } from '@/components/page/explore-pl-network/aileron';

import homeAsk from '../home-ai-ask/HomeAsk.module.scss';
import { EventsRail } from '../home-refactor/EventsRail';
import { JobsRail } from '../home-refactor/JobsRail';
import hr from '../home-refactor/HomeRefactorPrototype.module.scss';
import feed from '../newsfeed/Newsfeed.module.scss';
import { ForumPostCard } from '../newsfeed-v0/ForumPostCard';
import { ForumPostModal } from '../newsfeed-v0/ForumPostModal';
import { FeedDetailModal, type FeedDetail } from '../newsfeed-v0/FeedDetailModal';
import { EVENT_TYPE_HEX, EVENT_TYPE_LABEL } from '../newsfeed-v0/eventMeta';
import { COMMENTS_BY_UID, PL_TEAM_UID, SOURCES_BY_UID, type ForumPost } from '../newsfeed-v0/mocks';
import v0 from '../newsfeed-v0/NewsfeedV0.module.scss';
import { PrototypeMobileNav } from '../nav-shared/PrototypeMobileNav';
import { PrototypeNavBar } from '../nav-shared/PrototypeNavBar';

import { DealsModule } from './DealsModule';
import {
  FOCUS_AREA_LINKS,
  FORUM_PICKS,
  HOME_DEALS,
  HOME_EVENTS,
  HOME_JOBS,
  MEMBER,
  NEWS_PREVIEW,
  NEWS_SELECTION,
  PORTFOLIO_TEAMS,
  REVIEW_STATES,
  TOTAL_DEALS,
  TOTAL_OPEN_ROLES,
  TOTAL_UPCOMING_EVENTS,
  TYPED_EMAIL,
  type ReviewState,
} from './mocks';
import s from './HomeV2Prototype.module.scss';

type Option<T extends string> = { value: T; label: string; note: string };

const STATES: Option<ReviewState>[] = [
  { value: 'signed-out', label: 'Signed out', note: 'A new visitor: the onboarding story.' },
  { value: 'signed-in', label: 'Signed in', note: 'A member with deals access.' },
  { value: 'signed-in-no-deals', label: 'No deals access', note: 'A member without deals access: no Deals section.' },
  { value: 'email-not-found', label: 'Email not found', note: 'Sign-in with an email that is not in the directory.' },
];

const EVENTS: Option<'off' | 'on'>[] = [
  { value: 'off', label: 'Off', note: 'Default. Events wait on more event data.' },
  { value: 'on', label: 'On', note: 'The slot when there is enough event data.' },
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
        <Link href={href} className={hr.seeAll}>
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

/** Both auth doors, as the navbar shows them: Sign up quiet and first, Sign in filled. */
function AuthDoors({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div className={s.authDoors}>
      <Link href="/sign-up" className={clsx(signupCss.root, s.authBtn)}>
        Sign up
      </Link>
      <button type="button" className={clsx(loginCss.root, s.authBtn)} onClick={onSignIn}>
        Sign in
      </button>
    </div>
  );
}

/** A short news list: kicker, title, team. A click opens the story as the feed does. */
function NewsList({ items, onOpen }: { items: ITeamNewsItem[]; onOpen: (item: ITeamNewsItem) => void }) {
  return (
    <ol className={s.newsList}>
      {items.map((item) => (
        <li key={item.uid}>
          <button type="button" className={s.newsRow} onClick={() => onOpen(item)}>
            <span className={s.newsKicker} style={{ color: EVENT_TYPE_HEX[item.eventType] }}>
              {EVENT_TYPE_LABEL[item.eventType]}
            </span>
            <span className={s.newsTitle}>{item.title}</span>
            <span className={s.newsTeam}>{item.teamName}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}

function useReviewState(): [ReviewState, (next: ReviewState) => void] {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const raw = params.get('state');
  const state = (REVIEW_STATES as readonly string[]).includes(raw ?? '') ? (raw as ReviewState) : 'signed-out';
  const setState = (next: ReviewState) => {
    const q = new URLSearchParams(params.toString());
    q.set('state', next);
    router.replace(`${pathname}?${q.toString()}`, { scroll: false });
  };
  return [state, setState];
}

function HomeV2() {
  const [state, setState] = useReviewState();
  const router = useRouter();
  const [events, setEvents] = useState<'off' | 'on'>('off');
  const [modalClosed, setModalClosed] = useState(false);
  const signedIn = state === 'signed-in' || state === 'signed-in-no-deals';
  const hasDealsAccess = state === 'signed-in';
  const emailNotFound = state === 'email-not-found' && !modalClosed;

  const changeState = (next: ReviewState) => {
    setModalClosed(false);
    setState(next);
  };

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

  const signIn = () => changeState('signed-in');

  return (
    <>
      <PrototypeNavBar
        hasUnreadNews={false}
        active
        jobsInBar
        isLoggedIn={signedIn}
        onSignIn={signIn}
      />
      <PrototypeMobileNav hasUnreadNews={false} active />

      {/* Review scaffolding — scrolls away; not part of the design. */}
      <div className={clsx(feed.reviewBand, s.reviewBand)}>
        <div className={feed.reviewRow}>
          <Switch label="State" options={STATES} value={state} onChange={changeState} />
          {signedIn && <Switch label="Upcoming events" options={EVENTS} value={events} onChange={setEvents} />}
        </div>
      </div>

      <div className={styles.home}>
        <div className={clsx(styles.home__cn, hr.page, s.page)}>
          {signedIn ? (
            <>
              <h1 className={s.greeting}>Good afternoon, {MEMBER.firstName}</h1>

              {/* 1. Production QuickActions band; AI Apps and Job Board lead (AI Apps is the top destination). */}
              <section className={qa.section}>
                <h2 className={qa.title}>Quick Actions</h2>
                <div className={qa.grid} role="region" aria-label="Quick actions">
                  <ActionCard
                    icon={<StarFourIcon />}
                    title="AI Apps"
                    description="Tools built by the network"
                    href="/pl-infra/ai-apps"
                  />
                  <ActionCard icon={<JobsIcon />} title="Job Board" description="Find your next role" href="/jobs" />
                  {hasDealsAccess && (
                    <ActionCard icon={<DealsIcon />} title="Network Deals" description="Member perks" href="/deals" />
                  )}
                </div>
              </section>

              {/* 2. Forum, author on top. */}
              <section className={hr.section} aria-labelledby="home-forum-title">
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

              {/* 3. Deals: only with deals access (deals.read). No locked teaser without it. */}
              {hasDealsAccess && (
                <section className={hr.section} aria-labelledby="home-deals-title">
                  <SectionHead
                    id="home-deals-title"
                    title="Latest deals"
                    sub="Offers from vendors for network teams."
                    href="/deals"
                    linkLabel="See all deals"
                  />
                  <DealsModule deals={HOME_DEALS} />
                  <p className={s.meta}>{TOTAL_DEALS} deals are open to your team.</p>
                </section>
              )}

              {/* 4. News selection: five picked stories, not the feed. "Teams to follow" is gone. */}
              <section className={hr.section} aria-labelledby="home-news-title">
                <SectionHead
                  id="home-news-title"
                  title="Selected news"
                  sub="Five stories from the network this week."
                  href="/prototypes/newsfeed"
                  linkLabel="All news"
                />
                <NewsList items={NEWS_SELECTION} onOpen={openStory} />
              </section>

              {/* 5. Open roles (same rail as signed out). 6. Events behind a flag. */}
              <div className={s.pair}>
                <JobsRail jobs={HOME_JOBS} total={TOTAL_OPEN_ROLES} />
                {events === 'on' && <EventsRail events={HOME_EVENTS} total={TOTAL_UPCOMING_EVENTS} />}
              </div>
            </>
          ) : (
            <>
              {/* 1. Intro + both auth doors. */}
              <div className={clsx(s.story, aileron.variable)}>
                <EditorialIntro portfolioCount={PORTFOLIO_TEAMS.length} />
                <AuthDoors onSignIn={signIn} />
              </div>

              {/* 2. Focus areas into the directory, then the islands map. */}
              <section className={clsx(s.storySection, aileron.variable)} aria-labelledby="home-portfolio-title">
                <SectionHead
                  id="home-portfolio-title"
                  title="Teams by focus area"
                  sub={`${PORTFOLIO_TEAMS.length} portfolio teams. Pick an area to see its teams and projects in the directory.`}
                />
                <ul className={s.areaLinks}>
                  {FOCUS_AREA_LINKS.map((a) => (
                    <li key={a.id} className={s.areaLink}>
                      <span className={s.areaName}>{a.name}</span>
                      <span className={s.areaTargets}>
                        <Link href={a.teamsHref}>Teams</Link>
                        <Link href={a.projectsHref}>Projects</Link>
                      </span>
                    </li>
                  ))}
                </ul>
                <PortfolioPanel teams={PORTFOLIO_TEAMS} />
              </section>

              {/* 3. Open roles. */}
              <section className={s.storySection}>
                <JobsRail jobs={HOME_JOBS.slice(0, 4)} total={TOTAL_OPEN_ROLES} />
              </section>

              {/* 4. Logo wall. */}
              <section className={s.storySection}>
                <ExploreLogoWall />
              </section>

              {/* 5. A short news preview with the sign-up line. */}
              <section className={s.storySection} aria-labelledby="home-preview-title">
                <SectionHead id="home-preview-title" title="News from the network" />
                <NewsList items={NEWS_PREVIEW} onOpen={openStory} />
                <p className={s.signupLine}>
                  <Link href="/sign-up">Sign up</Link> to get updates from teams you follow.
                </p>
              </section>
            </>
          )}
        </div>
      </div>

      {/* Email not found: production's AuthInvalidUser shell, without the dead end. */}
      <ModalBase
        className={clsx(invalidCss.root, s.modal)}
        open={emailNotFound}
        title="This email isn't in the directory yet"
        titleIcon={<WarningCircleIcon />}
        description={`We could not find ${TYPED_EMAIL}. Sign up to join the directory, or sign in with another email.`}
        cancel={{ onClick: () => setModalClosed(true) }}
        submit={{ label: 'Sign up', onClick: () => router.push('/sign-up') }}
        footer={
          <div className={s.modalFooter}>
            <Button style="link" onClick={signIn}>
              Try another email
            </Button>
          </div>
        }
      />

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

/** `?state=` is read with useSearchParams, which needs a Suspense boundary for the static build. */
export default function HomeV2Prototype() {
  return (
    <Suspense fallback={null}>
      <HomeV2 />
    </Suspense>
  );
}

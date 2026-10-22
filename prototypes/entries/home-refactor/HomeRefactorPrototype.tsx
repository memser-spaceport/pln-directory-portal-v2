'use client';

/**
 * REUSE MAP — home-refactor (exploration: AI Search hero + editorial Home)
 *
 * Production (imported read-only):
 *   app/home/page.module.css ............ .home / .home__cn page width + rhythm
 *   NewsCard.module.scss ................ card shell, head, logo, team name, headline
 *   NewsBase.module.scss ................ section title
 *   TeamGroupCard.module.scss ........... "See all N jobs" expander
 *   ReferRoleRow (.titleLink, ArrowIcon, JOB_QUERY_PARAMS) .. job rows
 *   RepositoriesList repository glyph, star-outline-gray.svg path (copied, currentColor)
 *   formatTimeAgo, getTeamLogoFallback, getDefaultAvatar (via ForumPostCard)
 *
 * Sibling prototypes (imported, not forked):
 *   home-ai-ask ......... HomeAsk (the open field, Try prompts, AI Overview answer,
 *                         "Continue in AI Search" → ai-mode-results), useHeaderSearch
 *   newsfeed ............ TopStoriesBlock (lead + rows), HiringCard's role-row classes, mocks
 *   newsfeed-v0 ......... ForumPostCard (author on top), ForumPostModal, FeedDetailModal,
 *                         switch chrome, mocks
 *   nav-shared .......... PrototypeNavBar / PrototypeMobileNav (this route is Home)
 *
 * New here: RepoCard (Selected GitHub repos), JobsRail (cross-team list), the
 * page composition and section headers.
 */

import clsx from 'clsx';
import { useState } from 'react';

import type { ITeamNewsItem } from '@/types/team-news.types';

import styles from '@/app/home/page.module.css';
import nb from '@/components/page/home/TeamNews/components/NewsBase/NewsBase.module.scss';

import { HomeAsk, type AskMode } from '../home-ai-ask/HomeAsk';
import homeAsk from '../home-ai-ask/HomeAsk.module.scss';
import { useHeaderSearch } from '../home-ai-ask/useHeaderSearch';
import { TopStoriesBlock } from '../newsfeed/TopStoriesBlock';
import { TOP_STORY } from '../newsfeed/mocks';
import { ForumPostCard } from '../newsfeed-v0/ForumPostCard';
import { ForumPostModal } from '../newsfeed-v0/ForumPostModal';
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
import feed from '../newsfeed/Newsfeed.module.scss';
import { PrototypeNavBar } from '../nav-shared/PrototypeNavBar';
import { PrototypeMobileNav } from '../nav-shared/PrototypeMobileNav';

import { EventsRail } from './EventsRail';
import { JobsRail } from './JobsRail';
import { RepoBanner } from './RepoBanner';
import {
  HOME_EVENTS,
  TOTAL_UPCOMING_EVENTS,
  CURATED_REPOS,
  FORUM_PICKS,
  HOME_JOBS,
  NEWS_ALSO,
  NEWS_LEAD,
  REPOS_ATTRIBUTION,
  TOTAL_OPEN_ROLES,
} from './mocks';
import s from './HomeRefactorPrototype.module.scss';

type Option<T extends string> = { value: T; label: string; note: string };

const ASK_MODES: Option<AskMode>[] = [
  {
    value: 'overview',
    label: 'Answer here',
    note: 'Enter shows a short AI answer under the field, with "Continue in AI Search" to keep asking.',
  },
  { value: 'handoff', label: 'Open AI Search', note: 'Enter goes straight to the AI Search page, already answering.' },
];

const VIEWERS: Option<'in' | 'out'>[] = [
  { value: 'in', label: 'Member', note: 'Signed in.' },
  { value: 'out', label: 'Signed out', note: 'Same page; the navbar shows Sign up · Sign in.' },
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

function SectionHead({ id, title, sub, href, linkLabel }: { id: string; title: string; sub?: string; href?: string; linkLabel?: string }) {
  return (
    <div className={s.sectionHead}>
      <div className={s.sectionHeadText}>
        <h2 id={id} className={clsx(nb.title, homeAsk.homeNewsTitle)}>
          {title}
        </h2>
        {sub && <p className={s.sectionSub}>{sub}</p>}
      </div>
      {href && linkLabel && (
        <a href={href} className={s.seeAll}>
          {linkLabel}
        </a>
      )}
    </div>
  );
}

export default function HomeRefactorPrototype() {
  const [viewer, setViewer] = useState<'in' | 'out'>('in');
  const [askMode, setAskMode] = useState<AskMode>('overview');
  const signedIn = viewer === 'in';
  const navExtras = useHeaderSearch(signedIn);

  /* Likes and comments: the feed's own model (newsfeed), seeded from its mocks. */
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [comments, setComments] = useState<Record<string, FeedComment[]>>(COMMENTS_BY_UID);
  const likeCount = (uid: string) => (BASE_LIKES[uid] ?? 0) + (liked.has(uid) ? 1 : 0);
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
  /* Same mapping as the Home prototype's openStoryDetail. */
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

  return (
    <>
      <PrototypeNavBar
        hasUnreadNews={false}
        active
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
          <Switch label="On Enter" options={ASK_MODES} value={askMode} onChange={setAskMode} />
        </div>
      </div>

      <div className={styles.home}>
        <div className={clsx(styles.home__cn, s.page)}>
          {/* 1. The hero: the field itself, open and typeable. */}
          <div className={s.hero}>
            <HomeAsk mode={askMode} size="composer" signedIn={signedIn} viewer="member" />
          </div>

          {/* 2–3. News and Forum in the main column; Jobs as the rail beside them. */}
          <div className={s.editorial}>
            <section className={clsx(s.section, s.areaNews)} aria-labelledby="home-news-title">
              <SectionHead
                id="home-news-title"
                title="This week in the network"
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

            <aside className={s.areaJobs}>
              <div className={s.railStack}>
                <JobsRail jobs={HOME_JOBS} total={TOTAL_OPEN_ROLES} />
                <EventsRail events={HOME_EVENTS} total={TOTAL_UPCOMING_EVENTS} />
              </div>
            </aside>

            <section className={clsx(s.section, s.areaForum)} aria-labelledby="home-forum-title">
              <SectionHead id="home-forum-title" title="From the forum" href="/forum" linkLabel="Go to forum" />
              <div className={s.forumGrid}>
                {FORUM_PICKS.map((post) => (
                  <ForumPostCard
                    key={post.uid}
                    post={post}
                    showComments={false}
                    likeCount={likeCount(post.uid)}
                    liked={isLiked(post.uid)}
                    onToggleLike={() => toggleLike(post.uid)}
                    comments={commentsFor(post.uid)}
                    onAddComment={(text, parentUid) => addComment(post.uid, text, parentUid)}
                    isCommentLiked={isLiked}
                    onToggleCommentLike={toggleLike}
                    onOpenDetail={() => setForumDetail(post)}
                  />
                ))}
              </div>
            </section>
          </div>

          {/* 4. Selected GitHub repos: the weekly pick as an announcement band, last.
              (RepoCard stays in the folder: version B's Picked repos strip imports it.) */}
          <RepoBanner repos={CURATED_REPOS} attribution={REPOS_ATTRIBUTION} weekLabel="Week of Oct 19" />
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
    </>
  );
}

'use client';

/**
 * REUSE MAP — home-refactor-b (exploration: ask-first, one column)
 *
 * Version B of `home-refactor`. Same brief, same week of content, a different
 * structure: greeting → composer with scope chips → "Start with a question"
 * cards → ONE tabbed "This week in the network" row list → a small Picked
 * repos strip. No sidebar rail on desktop.
 *
 * Production (imported read-only):
 *   components/common/Tabs ............. the module's segmented tabs (underline + count badge)
 *   NewsCard.module.scss ............... module card shell; rows = `.cardFlat` + `.headline`,
 *                                        `.headlineCompact`, `.logo`, `.logoFallback`, `.meta`, `.sep`
 *   components/icons ................... DocumentIcon, CommentIcon, CalendarBlankIcon, CloseIcon
 *   public/icons/briefcase.svg, repos.svg  paths redrawn in currentColor (KindGlyph)
 *   formatTimeAgo, getTeamLogoFallback, getDefaultAvatar
 *
 * Sibling prototypes (imported, not forked):
 *   home-refactor (A) ... mocks (CURATED_REPOS, TOTAL_OPEN_ROLES), RepoCard (the Picked repos strip)
 *   home-ai-ask ......... HomeAsk.module.scss (answer card, Continue in AI Search), AskMode,
 *                         useHeaderSearch (navbar search)
 *   ai-search-page ...... Composer (the multi-line field + round send)
 *   ai-search / ai-mode-results  buildAnswer, ThinkingStatus, AnswerProse, AnswerShapes,
 *                         EntityList, SourcesButton (the same inline answer A shows)
 *   newsfeed / newsfeed-v0  stories, threads, roles; FeedDetailModal, ForumPostModal,
 *                         switch chrome for the review band
 *   nav-shared .......... PrototypeNavBar / PrototypeMobileNav
 *
 * New here: the greeting, scope chips, prompt cards, the week module's row
 * anatomy, re-dated mocks, and hiding the navbar search while the composer
 * is on screen.
 */

import clsx from 'clsx';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { AskMode } from '../home-ai-ask/HomeAsk';
import { useHeaderSearch } from '../home-ai-ask/useHeaderSearch';
import { FeedDetailModal, type FeedDetail } from '../newsfeed-v0/FeedDetailModal';
import { ForumPostModal } from '../newsfeed-v0/ForumPostModal';
import { EVENT_TYPE_HEX, EVENT_TYPE_LABEL } from '../newsfeed-v0/eventMeta';
import {
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
import { RepoCard } from '../home-refactor/RepoCard';
import { REPOS_ATTRIBUTION } from '../home-refactor/mocks';

import { AskFirst } from './AskFirst';
import { Arrow, WeekModule } from './WeekModule';
import { WEEK_LIKES, pickedRepos, weekForumPosts, weekNewsItem } from './mocks';
import s from './HomeRefactorB.module.scss';

type Option<T extends string> = { value: T; label: string; note: string };

const VIEWERS: Option<'in' | 'out'>[] = [
  { value: 'in', label: 'Member', note: 'Signed in: greeting by time of day + first name, and the date.' },
  { value: 'out', label: 'Signed out', note: 'A neutral line instead of a name; the navbar shows Sign up · Sign in.' },
];

const ASK_MODES: Option<AskMode>[] = [
  { value: 'overview', label: 'Answer here', note: 'Same as A: a short AI answer under the field, with "Continue in AI Search".' },
  { value: 'handoff', label: 'Open AI Search', note: 'Same as A: Enter goes straight to the AI Search page.' },
];

type NavSearch = 'auto' | 'always';
const NAV_SEARCH: Option<NavSearch>[] = [
  {
    value: 'auto',
    label: 'Hide while composer shows',
    note: 'One field on screen at a time: the header search fades in once the composer scrolls away.',
  },
  { value: 'always', label: 'Always show', note: 'Both fields on screen at once, as in A.' },
];

const VIEWER_FIRST_NAME = 'Polina';

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

/** The viewer's clock, read after mount so server and client HTML agree. */
function useNow(): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);
  return now;
}

function greetingFor(now: Date) {
  const h = now.getHours();
  if (h < 5) return 'Good evening';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

const longDate = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

export default function HomeRefactorBPrototype() {
  const [viewer, setViewer] = useState<'in' | 'out'>('in');
  const [askMode, setAskMode] = useState<AskMode>('overview');
  const [navSearch, setNavSearch] = useState<NavSearch>('auto');
  const signedIn = viewer === 'in';
  const navExtras = useHeaderSearch(signedIn);
  const now = useNow();

  /* The navbar search hides while the composer is on screen: two AI fields
     in one viewport ask the reader to choose between identical doors. */
  const fieldRef = useRef<HTMLDivElement>(null);
  const [composerInView, setComposerInView] = useState(true);
  useEffect(() => {
    const el = fieldRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    /* The navbar is ~80px tall and sticky; the composer counts as gone once it slides under it. */
    const io = new IntersectionObserver(([entry]) => setComposerInView(entry.isIntersecting), {
      rootMargin: '-80px 0px 0px 0px',
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const hideNavSearch = navSearch === 'auto' && composerInView;

  /* Likes and comments: the feed's model, seeded with B's own numbers. */
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [comments, setComments] = useState<Record<string, FeedComment[]>>(COMMENTS_BY_UID);
  const likeCount = (uid: string) => (WEEK_LIKES[uid] ?? 0) + (liked.has(uid) ? 1 : 0);
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

  const forumPosts = useMemo(() => weekForumPosts(now ?? new Date()), [now]);
  const repos = useMemo(() => pickedRepos(now ?? new Date()), [now]);

  const [detail, setDetail] = useState<FeedDetail | null>(null);
  const [forumDetail, setForumDetail] = useState<ForumPost | null>(null);
  /* Same mapping as A's openStory, on the re-dated story. */
  const openNews = (uid: string) => {
    const story = weekNewsItem(uid, now ?? new Date());
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
  };

  return (
    <>
      {/* Page-scoped: fades the header's search slot (field or glyph) while the
          composer is on screen. Inline because the header isn't inside this
          page's markup, and a CSS-module rule can't reach it without a bare
          global selector. */}
      {hideNavSearch && (
        <style>{`header [data-search-anchor]{opacity:0;visibility:hidden;pointer-events:none;transition:opacity .15s ease-out,visibility 0s linear .15s}`}</style>
      )}
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
          <Switch label="Navbar search" options={NAV_SEARCH} value={navSearch} onChange={setNavSearch} />
        </div>
      </div>

      <div className={s.page}>
        {/* 1. Greeting + date (Plane). The time of day and the date are the
            viewer's own, so they render after mount. */}
        <header className={s.greeting}>
          <h1 className={s.hello} suppressHydrationWarning>
            {signedIn
              ? now
                ? `${greetingFor(now)}, ${VIEWER_FIRST_NAME}`
                : `Welcome back, ${VIEWER_FIRST_NAME}`
              : 'What do you want to find in the network?'}
          </h1>
          <p className={s.date} suppressHydrationWarning>
            {now ? longDate.format(now) : ' '}
          </p>
        </header>

        {/* 2. Composer with scope chips, then "Start with a question". */}
        <AskFirst ref={fieldRef} mode={askMode} signedIn={signedIn} />

        {/* 3. One module for the week, in place of four sections. */}
        <WeekModule
          now={now}
          likeCount={likeCount}
          commentCount={(uid) => commentsFor(uid).length}
          onOpenNews={openNews}
          onOpenForum={(uid) => setForumDetail(forumPosts[uid] ?? null)}
        />

        {/* 4. Picked repos: the curated, evergreen idea, kept visible as one
            strip (Record Club's "… this week  See all >" row). */}
        <section className={s.strip} aria-labelledby="hrb-repos-title">
          <div className={s.stripHead}>
            <div>
              <h2 id="hrb-repos-title" className={s.smallHead}>
                Picked repos
              </h2>
              <p className={s.stripSub}>{REPOS_ATTRIBUTION}</p>
            </div>
            <a href="/prototypes/home-refactor#home-repos-title" className={s.seeAll}>
              See all
              <Arrow />
            </a>
          </div>
          <ul className={s.stripRow}>
            {repos.map((repo) => (
              <li key={repo.name} className={s.stripItem}>
                <RepoCard repo={repo} />
              </li>
            ))}
          </ul>
        </section>
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

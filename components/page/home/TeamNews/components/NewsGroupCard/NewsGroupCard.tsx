'use client';

import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { useToggle } from 'react-use';
import { useRouter } from 'next/navigation';

import { formatTimeAgo } from '@/utils/formatTimeAgo';
import { useCurrentUserStore } from '@/services/auth/store';
import { useCardVisibilityTracking } from '@/hooks/useCardVisibilityTracking';
import { FollowButton } from '@/components/ui/FollowButton';
import type { ITeamNewsItem, TeamCluster } from '@/types/team-news.types';
import {
  useTeamNewsAnalytics,
  type TeamNewsAnalyticsSource,
  type TeamNewsCardClickVia,
} from '@/analytics/team-news.analytics';
import { getTeamLogoFallback } from '../../utils/getTeamLogoFallback';
import { getEventTypeConfig } from '../../utils/getEventTypeConfig';
import { sortAllTabItemsByEventDate } from '../../utils/sortAllTabItemsByEventDate';
import { UpvoteButton } from '../NewsCard/components/UpvoteButton';
import { CommentButton } from '../NewsCard/components/CommentButton/CommentButton';
import { NewsShareMenu } from '../NewsShareMenu';
import { SourceList } from '../SourceList/SourceList';
import { ViewCount } from '../ViewCount/ViewCount';
import { FeedCommentsThread, feedThreadDomId } from '../FeedCommentsThread/FeedCommentsThread';
import { hasNewsSource } from '../../utils/getNewsSources';

import newsCardStyles from '../NewsCard/NewsCard.module.scss';
import s from './NewsGroupCard.module.scss';

const VISIBLE_STORIES = 1;

interface NewsGroupCardProps {
  cluster: TeamCluster;
  /** Row click/Enter opens the news detail modal — the single owner of
   *  analytics + modal state + URL sync lives in TeamNews.handleStoryOpen.
   *  (The old open-the-source-in-a-new-tab behavior moved into the modal's
   *  SOURCE links; NewsCard — team-details — still opens the source.)
   *  The comment badge no longer routes here; the only non-row caller is the
   *  inline thread's "View all", which `via` distinguishes. */
  onStoryOpen: (item: ITeamNewsItem, via?: TeamNewsCardClickVia) => void;
  analyticsSource?: TeamNewsAnalyticsSource;
  isFollowing?: boolean;
  onFollowToggle?: (teamUid: string, teamName: string, isCurrentlyFollowing: boolean) => void;
  onUpvoteToggle?: (item: ITeamNewsItem) => void;
  /** Set by TeamNews.tsx when a "Popular this week" click targets a story inside
   * this card that's beyond VISIBLE_STORIES — forces this card's own truncation
   * open. One-directional (never collapses); see the scroll-to-story plan. */
  autoExpandStoryUid?: string;
  /** Fired once a story row scrolls into the viewport (view-impression recording). */
  onStoryVisible: (uid: string) => void;
}

export function NewsGroupCard({
  cluster,
  onStoryOpen,
  analyticsSource = 'home',
  isFollowing = false,
  onFollowToggle,
  onUpvoteToggle,
  autoExpandStoryUid,
  onStoryVisible,
}: NewsGroupCardProps) {
  const [expanded, toggleExpanded] = useToggle(false);
  const router = useRouter();
  const { currentUser, isHydrated } = useCurrentUserStore();
  const analytics = useTeamNewsAnalytics();

  // Per-story inline threads. Local like the card's own `expanded`, so the
  // composite-key remount on tab/category change resets open threads (and any
  // unsent drafts — accepted, documented loss; in-flight submits still land
  // because the mutation's cache writes live in its options callbacks).
  const [openThreadUids, setOpenThreadUids] = useState<ReadonlySet<string>>(() => new Set());
  // Threads holding an unsettled comment. They refuse to collapse: the write's
  // error state dies with the unmount, so a stray badge click would drop a
  // failed comment without ever saying so.
  const [busyThreadUids, setBusyThreadUids] = useState<ReadonlySet<string>>(() => new Set());

  const setThreadBusy = (storyUid: string, busy: boolean) => {
    setBusyThreadUids((current) => {
      if (current.has(storyUid) === busy) return current;
      const next = new Set(current);
      busy ? next.add(storyUid) : next.delete(storyUid);
      return next;
    });
  };

  const handleThreadToggle = (storyUid: string) => {
    if (busyThreadUids.has(storyUid) && openThreadUids.has(storyUid)) return;
    const next = new Set(openThreadUids);
    const willOpen = !next.has(storyUid);
    willOpen ? next.add(storyUid) : next.delete(storyUid);
    setOpenThreadUids(next);
    analytics.onFeedCommentThreadToggled(storyUid, 'news', willOpen, analyticsSource);
    // Opening a thread on a card near the bottom of the viewport otherwise
    // renders the whole thing off-screen — the badge just changes colour.
    // `nearest` never scrolls the feed to the top.
    if (willOpen) {
      requestAnimationFrame(() => {
        document.getElementById(feedThreadDomId(storyUid))?.scrollIntoView({ block: 'nearest' });
      });
    }
  };

  const handleFollowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      router.push(`${window.location.pathname}${window.location.search}#login`, { scroll: false });
      return;
    }
    onFollowToggle?.(cluster.teamUid, cluster.teamName, isFollowing);
  };

  // Record which thread was open before bouncing to #login, so the round trip
  // lands back on it (the modal's Follow gate does the same with ?news=).
  const handleThreadSignIn = (storyUid: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set('news', storyUid);
    router.push(`${window.location.pathname}?${params.toString()}#login`, { scroll: false });
  };

  const handleUpvoteClick = (story: ITeamNewsItem) => {
    if (!currentUser) {
      router.push(`${window.location.pathname}${window.location.search}#login`, { scroll: false });
      return;
    }
    onUpvoteToggle?.(story);
  };

  // Memoized: reuses the same string-comparison sort as the rest of the
  // feed instead of a bespoke Date.getTime() comparator, and avoids
  // re-sorting on every unrelated render.
  const stories = useMemo(() => sortAllTabItemsByEventDate(cluster.items), [cluster.items]);
  const hiddenCount = Math.max(0, stories.length - VISIBLE_STORIES);
  const visibleStories = expanded ? stories : stories.slice(0, VISIBLE_STORIES);

  // useLayoutEffect, not useEffect: this must commit synchronously within the
  // flushSync call TeamNews.tsx's handlePopularItemClick wraps its state updates
  // in, so the parent's very next line (a synchronous querySelector, no polling)
  // can rely on this card already being expanded. Only ever force-opens, never
  // collapses — safe to re-run.
  useLayoutEffect(() => {
    if (!autoExpandStoryUid) return;
    const isBeyondVisible = stories.slice(VISIBLE_STORIES).some((story) => story.uid === autoExpandStoryUid);
    if (isBeyondVisible) toggleExpanded(true);
  }, [autoExpandStoryUid, stories, toggleExpanded]);

  const openStory = (item: ITeamNewsItem) => {
    onStoryOpen(item);
  };

  return (
    <div className={newsCardStyles.card}>
      <div className={newsCardStyles.head}>
        {cluster.teamLogoUrl ? (
          <img className={newsCardStyles.logo} src={cluster.teamLogoUrl} alt="" loading="lazy" />
        ) : (
          <div className={newsCardStyles.logoFallback}>{getTeamLogoFallback(cluster.teamName)}</div>
        )}
        <a
          href={`/teams/${cluster.teamUid}`}
          target="_blank"
          rel="noopener noreferrer"
          className={newsCardStyles.teamName}
          onClick={(e) => e.stopPropagation()}
        >
          {cluster.teamName}
        </a>
        {isHydrated && onFollowToggle && (
          <FollowButton following={isFollowing} onClick={handleFollowClick} name={cluster.teamName} size="compact" />
        )}
      </div>

      {visibleStories.map((story, storyIndex) => (
        <StoryRow
          key={story.uid}
          story={story}
          storyIndex={storyIndex}
          analyticsSource={analyticsSource}
          isThreadOpen={openThreadUids.has(story.uid)}
          onOpen={() => openStory(story)}
          onUpvoteClick={() => handleUpvoteClick(story)}
          onThreadToggle={() => handleThreadToggle(story.uid)}
          onThreadViewAll={() => onStoryOpen(story, 'view-all-comments')}
          onThreadSignIn={() => handleThreadSignIn(story.uid)}
          onThreadBusyChange={(busy) => setThreadBusy(story.uid, busy)}
          onVisible={onStoryVisible}
        />
      ))}

      {hiddenCount > 0 && (
        <button type="button" className={s.expander} aria-expanded={expanded} onClick={toggleExpanded}>
          {expanded ? 'Show less' : `View all ${stories.length} updates from ${cluster.teamName}`}
        </button>
      )}
    </div>
  );
}

interface StoryRowProps {
  story: ITeamNewsItem;
  storyIndex: number;
  analyticsSource: TeamNewsAnalyticsSource;
  isThreadOpen: boolean;
  onOpen: () => void;
  onUpvoteClick: () => void;
  onThreadToggle: () => void;
  onThreadViewAll: () => void;
  onThreadSignIn: () => void;
  onThreadBusyChange: (busy: boolean) => void;
  onVisible: (uid: string) => void;
}

// Extracted so useCardVisibilityTracking has a legal, stable hook call site —
// it can't be called directly inside the `visibleStories.map()` callback
// above (rules of hooks). Same file as NewsGroupCard, not a new one; nothing
// about this row is reused elsewhere. A row unmounts on collapse ("Show
// less") or a tab/category change (composite-key remount) without losing any
// already-queued impression — the queue lives one level up, in TeamNews.tsx's
// useTeamNewsImpressions instance.
function StoryRow({
  story,
  storyIndex,
  analyticsSource,
  isThreadOpen,
  onOpen,
  onUpvoteClick,
  onThreadToggle,
  onThreadViewAll,
  onThreadSignIn,
  onThreadBusyChange,
  onVisible,
}: StoryRowProps) {
  const { label, dotClassName } = getEventTypeConfig(story.eventType);

  // Memoized so this row's IntersectionObserver isn't torn down/rebuilt on
  // every unrelated re-render of the card (e.g. a sibling row's thread
  // toggling).
  const handleVisible = useCallback(() => onVisible(story.uid), [onVisible, story.uid]);
  const rowRef = useCardVisibilityTracking<HTMLDivElement>({
    onVisible: handleVisible,
    threshold: 0.5,
    trackOnce: true,
  });

  return (
    <div
      ref={rowRef}
      data-story-uid={story.uid}
      role="button"
      aria-haspopup="dialog"
      // Concise accessible name — without it the row's name is its entire
      // text content (title + summary + meta), which is screen-reader noise
      // and collides with other buttons in role queries.
      aria-label={story.title}
      tabIndex={0}
      className={s.storyRow}
      onClick={onOpen}
      onKeyDown={(e) => {
        // Only act on keys pressed on the row itself — Enter/Space on a
        // nested control (Like/Share/SourceList) must not also open
        // the modal. Same guard as NewsCard's handleKeyDown.
        if (e.target !== e.currentTarget) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      <h3 className={newsCardStyles.headline}>{story.title}</h3>
      {story.summary && <p className={s.summary}>{story.summary}</p>}
      <div className={newsCardStyles.metaLine}>
        <div className={newsCardStyles.meta}>
          <span className={newsCardStyles.eventType}>
            <span className={`${newsCardStyles.eventDot} ${dotClassName}`} aria-hidden="true" />
            <span className={newsCardStyles.eventLabel}>{label}</span>
          </span>
          {hasNewsSource(story) && (
            <>
              <span className={newsCardStyles.sep} aria-hidden="true" />
              <SourceList item={story} position={storyIndex} analyticsSource={analyticsSource} />
            </>
          )}
          <span className={newsCardStyles.sep} aria-hidden="true" />
          <span className={newsCardStyles.time}>{formatTimeAgo(story.eventDate)}</span>
        </div>
        <div className={newsCardStyles.actions}>
          <NewsShareMenu item={story} source={analyticsSource} />
          <ViewCount count={story.viewCount} />
          <UpvoteButton
            count={story.upvoteCount ?? 0}
            voted={Boolean(story.viewerHasUpvoted)}
            onToggle={onUpvoteClick}
          />
          <CommentButton
            itemUid={story.uid}
            open={isThreadOpen}
            onToggle={onThreadToggle}
            controls={feedThreadDomId(story.uid)}
          />
        </div>
      </div>
      {/* Mount = expanded (the lazy comments query keys off it). */}
      {isThreadOpen && (
        <FeedCommentsThread
          itemUid={story.uid}
          kind="news"
          source={analyticsSource}
          onViewAll={onThreadViewAll}
          onSignIn={onThreadSignIn}
          onBusyChange={onThreadBusyChange}
        />
      )}
    </div>
  );
}

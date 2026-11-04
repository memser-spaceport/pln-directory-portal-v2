'use client';

import clsx from 'clsx';
import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import { formatTimeAgo } from '@/utils/formatTimeAgo';
import { useCardVisibilityTracking } from '@/hooks/useCardVisibilityTracking';
import { useCurrentUserStore } from '@/services/auth/store';
import { useTeamNewsAnalytics, type TeamNewsAnalyticsSource } from '@/analytics/team-news.analytics';
import type { ITeamNewsItem, TeamNewsEventType } from '@/types/team-news.types';
import { FollowButton } from '@/components/ui/FollowButton';

import { getTeamLogoFallback } from '../../utils/getTeamLogoFallback';
import { getEventTypeConfig } from '../../utils/getEventTypeConfig';
import { hasNewsSource } from '../../utils/getNewsSources';

import { UpvoteButton } from './components/UpvoteButton/UpvoteButton';
import { CommentButton } from './components/CommentButton/CommentButton';
import { NewsShareMenu } from '../NewsShareMenu';
import { SourceList } from '../SourceList/SourceList';
import { ViewCount } from '../ViewCount/ViewCount';
import { NewsTagChips } from '../NewsTagChips';
import { FeedCommentsThread, feedThreadDomId } from '../FeedCommentsThread/FeedCommentsThread';
import { NewsImage } from '../NewsImage';

import s from './NewsCard.module.scss';
import f from './NewsCardFull.module.scss';

// The prototype's event-colour mapping (V0FeedCard KICKER_COLOR_CLASS).
const KICKER_COLOR_CLASS: Record<TeamNewsEventType, string> = {
  FUNDING: f.kFunding,
  LAUNCH: f.kLaunch,
  PARTNERSHIP: f.kPartnership,
  ANNOUNCEMENT: f.kAnnouncement,
  MILESTONE: f.kMilestone,
  OTHER: f.kAnnouncement,
  HIRING: f.kAnnouncement,
  DEALS: f.kAnnouncement,
};

export interface NewsCardFullProps {
  item: ITeamNewsItem;
  position?: number;
  className?: string;
  analyticsSource?: TeamNewsAnalyticsSource;
  isFollowing?: boolean;
  onFollowToggle?: (teamUid: string, teamName: string, isCurrentlyFollowing: boolean) => void;
  onUpvoteToggle?: (item: ITeamNewsItem) => void;
  /** The row opens the story's dialog; `comments` is the inline thread's "View all". */
  onOpenDetail?: (item: ITeamNewsItem, via: 'row' | 'comments') => void;
  onVisible?: (uid: string) => void;
  /** Makes the tags `#tag` links that add to (or, when selected, remove from) the feed's tag scope. */
  onTagSelect?: (tag: string) => void;
  /** The feed's tag scope: those tags read as selected. */
  activeTags?: readonly string[];
  /** One of the editorial top stories (rank 1–3): the card carries the "Top story" badge. */
  isTopStory?: boolean;
}

/**
 * NewsCard's `full` variant (LAB-3125): the new Home's stream card, the prototype's V0FeedCard
 * (newsfeed-v0) on production's parts. One story per card, in full: the team row with Follow, the headline, the
 * summary, the `#tag` links, then the event kicker, sources and time beside Share, Views, Like and Comments, with the
 * comments opening inline. A top story carries the "Top story" badge above the team row. A story with an image shows
 * it as a 168 × 95 thumbnail beside the text (LAB-3134).
 */
export function NewsCardFull({
  item,
  position = 0,
  className,
  analyticsSource = 'home',
  isFollowing = false,
  onFollowToggle,
  onUpvoteToggle,
  onOpenDetail,
  onVisible,
  onTagSelect,
  activeTags,
  isTopStory = false,
}: NewsCardFullProps) {
  const router = useRouter();
  const { currentUser, isHydrated } = useCurrentUserStore();
  const analytics = useTeamNewsAnalytics();
  const [threadOpen, setThreadOpen] = useState(false);
  // A thread holding an unsettled comment refuses to collapse (NewsGroupCard's rule): its error state dies with it.
  const [threadBusy, setThreadBusy] = useState(false);

  const handleVisible = useCallback(() => onVisible?.(item.uid), [onVisible, item.uid]);
  const storyRef = useCardVisibilityTracking<HTMLDivElement>({
    onVisible: handleVisible,
    threshold: 0.5,
    trackOnce: true,
    enabled: Boolean(onVisible),
  });

  const goToLogin = () => router.push(`${window.location.pathname}${window.location.search}#login`, { scroll: false });

  const handleFollowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return goToLogin();
    onFollowToggle?.(item.teamUid, item.teamName, isFollowing);
  };

  const handleUpvoteToggle = () => {
    if (!currentUser) return goToLogin();
    onUpvoteToggle?.(item);
  };

  const handleOpen = () => {
    if (onOpenDetail) {
      onOpenDetail(item, 'row');
      return;
    }
    window.open(item.sourceUrl, '_blank', 'noopener,noreferrer');
  };

  const handleThreadToggle = () => {
    if (threadBusy && threadOpen) return;
    const willOpen = !threadOpen;
    setThreadOpen(willOpen);
    analytics.onFeedCommentThreadToggled(item.uid, 'news', willOpen, analyticsSource);
  };

  const handleThreadSignIn = () => {
    const params = new URLSearchParams(window.location.search);
    params.set('news', item.uid);
    router.push(`${window.location.pathname}?${params.toString()}#login`, { scroll: false });
  };

  const { label: eventTypeLabel } = getEventTypeConfig(item.eventType);

  return (
    <div className={clsx(s.card, f.feedCard, className)}>
      {isTopStory && (
        <span className={f.topStoryBadge}>
          <span aria-hidden>🔥</span> Top story
        </span>
      )}
      <div className={s.head}>
        {item.teamLogoUrl ? (
          <img className={s.logo} src={item.teamLogoUrl} alt="" loading="lazy" />
        ) : (
          <div className={s.logoFallback}>{getTeamLogoFallback(item.teamName)}</div>
        )}
        <a
          href={`/teams/${item.teamUid}`}
          target="_blank"
          rel="noopener noreferrer"
          className={clsx(s.teamName, f.teamNameTight)}
          onClick={(e) => e.stopPropagation()}
        >
          {item.teamName}
        </a>
        {isHydrated && onFollowToggle && (
          <span className={f.headFollow}>
            <FollowButton following={isFollowing} onClick={handleFollowClick} name={item.teamName} size="compact" />
          </span>
        )}
      </div>

      {/* The story row opens its dialog; role="button" is what the dialog's focus restore looks for. */}
      <div
        ref={storyRef}
        data-story-uid={item.uid}
        role={onOpenDetail ? 'button' : 'link'}
        aria-haspopup={onOpenDetail ? 'dialog' : undefined}
        aria-label={item.title}
        tabIndex={0}
        className={f.feedStory}
        onClick={handleOpen}
        onKeyDown={(e) => {
          // Only the row itself opens the story: Enter or Space on a control inside it (or in the comment composer)
          // must not.
          if (e.target !== e.currentTarget) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleOpen();
          }
        }}
      >
        <div className={f.storyMain}>
          <div className={f.storyText}>
            <h3 className={clsx(s.headline, f.feedTitle)}>{item.title}</h3>
            {item.summary && <p className={f.summary}>{item.summary}</p>}
            {/* In the text column, so the tags stay with the summary they describe. */}
            <NewsTagChips
              tags={item.tags}
              variant="card"
              onSelect={onTagSelect}
              active={activeTags}
              ungated
              className={f.topicTags}
            />
          </div>
          {/* Beside the text from 640px, full width under it on phones. Not a control: a click opens the story with
              the row. */}
          {item.imageUrl && <NewsImage src={item.imageUrl} variant="thumb" />}
        </div>
        <div className={f.footer}>
          <span className={f.source}>
            <span className={clsx(f.metaEvent, KICKER_COLOR_CLASS[item.eventType])}>{eventTypeLabel}</span>
            {hasNewsSource(item) && (
              <>
                {' · '}
                <SourceList item={item} position={position} analyticsSource={analyticsSource} compact />
              </>
            )}
            {' · '}
            {formatTimeAgo(item.eventDate)}
          </span>
          {/* Share · Views · Likes · Comments: the feed row's order. */}
          <span className={f.footerActions}>
            {onOpenDetail && <NewsShareMenu item={item} source={analyticsSource} />}
            <ViewCount count={item.viewCount} />
            {isHydrated && onUpvoteToggle && (
              <UpvoteButton
                count={item.upvoteCount ?? 0}
                voted={Boolean(item.viewerHasUpvoted)}
                onToggle={handleUpvoteToggle}
              />
            )}
            <CommentButton
              itemUid={item.uid}
              open={threadOpen}
              onToggle={handleThreadToggle}
              controls={feedThreadDomId(item.uid)}
            />
          </span>
        </div>

        {/* Mount = expanded (the lazy comments query keys off it). */}
        {threadOpen && (
          <FeedCommentsThread
            itemUid={item.uid}
            kind="news"
            source={analyticsSource}
            onViewAll={() => onOpenDetail?.(item, 'comments')}
            onSignIn={handleThreadSignIn}
            onBusyChange={setThreadBusy}
          />
        )}
      </div>
    </div>
  );
}

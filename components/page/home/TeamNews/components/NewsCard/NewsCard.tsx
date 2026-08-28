'use client';

import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import { formatTimeAgo } from '@/utils/formatTimeAgo';
import { useCurrentUserStore } from '@/services/auth/store';
import type { TeamNewsAnalyticsSource } from '@/analytics/team-news.analytics';
import type { ITeamNewsItem } from '@/types/team-news.types';
import { FollowButton } from '@/components/ui/FollowButton';

import { getTeamLogoFallback } from '../../utils/getTeamLogoFallback';
import { getEventTypeConfig } from '../../utils/getEventTypeConfig';
import { hasNewsSource } from '../../utils/getNewsSources';

import { UpvoteButton } from './components/UpvoteButton/UpvoteButton';
import { CommentButton } from './components/CommentButton/CommentButton';
import { NewsShareMenu } from '../NewsShareMenu';
import { SourceList } from '../SourceList/SourceList';
import { TruncatedSummary } from './TruncatedSummary';
import { ViewCount } from '../ViewCount/ViewCount';

import s from './NewsCard.module.scss';

interface NewsCardProps {
  item: ITeamNewsItem;
  position?: number;
  onClick?: (item: ITeamNewsItem) => void;
  hideTeamLink?: boolean;
  hideTeam?: boolean;
  variant?: 'default' | 'flat' | 'outline';
  compact?: boolean;
  className?: string;
  analyticsSource?: TeamNewsAnalyticsSource;
  isFollowing?: boolean;
  onFollowToggle?: (teamUid: string, teamName: string, isCurrentlyFollowing: boolean) => void;
  upvoteCount?: number;
  viewerHasUpvoted?: boolean;
  onUpvoteToggle?: (item: ITeamNewsItem) => void;
  /**
   * Renders a measured two-line teaser with an inline "… Show more" button.
   * Mounts per-card layout measurement (TruncatedSummary) — rail-only by
   * design; never pass from modal-sized lists.
   */
  onShowMore?: (item: ITeamNewsItem) => void;
  /** Render the summary in full, overriding the compact two-line clamp (modal feed). */
  fullSummary?: boolean;
  /**
   * Opens the story in a dialog instead of leaving for `sourceUrl`, and lights
   * up the Share and Comments actions — the row the feed already renders
   * (NewsGroupCard). A profile rail is somewhere the reader is mid-task:
   * bouncing the whole page out to a publisher on a stray tap costs them the
   * scroll position and everything they had open, and the tap target here is a
   * whole card. The source is still one deliberate click away, from the meta
   * line or from inside the story.
   *
   * `via` is which affordance asked — the row itself or the comment count. The
   * caller owns the analytics for it: the row already reports through `onClick`,
   * so only the comment path is the caller's to record.
   */
  onOpenDetail?: (item: ITeamNewsItem, via: 'row' | 'comments') => void;
}

export const NewsCard = ({
  item,
  position = 0,
  onClick,
  hideTeamLink = false,
  hideTeam = false,
  variant = 'default',
  compact = false,
  className,
  analyticsSource = 'home',
  isFollowing = false,
  onFollowToggle,
  upvoteCount = 0,
  viewerHasUpvoted = false,
  onUpvoteToggle,
  onShowMore,
  fullSummary = false,
  onOpenDetail,
}: NewsCardProps) => {
  const router = useRouter();
  const { currentUser, isHydrated } = useCurrentUserStore();

  const handleFollowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      router.push(`${window.location.pathname}${window.location.search}#login`, { scroll: false });
      return;
    }
    onFollowToggle?.(item.teamUid, item.teamName, isFollowing);
  };

  const handleUpvoteToggle = () => {
    if (!currentUser) {
      router.push(`${window.location.pathname}${window.location.search}#login`, { scroll: false });
      return;
    }
    onUpvoteToggle?.(item);
  };

  const handleClick = () => {
    onClick?.(item);
    if (onOpenDetail) {
      onOpenDetail(item, 'row');
      return;
    }
    window.open(item.sourceUrl, '_blank', 'noopener,noreferrer');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Only act on keys pressed on the card itself — Enter on an inner button
    // (Upvote/SourceList) must not also open the article.
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const { label: eventTypeLabel, dotClassName: eventTypeDotClassName } = getEventTypeConfig(item.eventType);

  return (
    <div
      // Opens a dialog here, still leaves the page without `onOpenDetail` — the
      // role has to say which, or the announcement promises the wrong thing.
      // role="button" is also what NewsDetailModal's focus restore looks for
      // when it hands focus back to the row that opened it.
      role={onOpenDetail ? 'button' : 'link'}
      aria-haspopup={onOpenDetail ? 'dialog' : undefined}
      tabIndex={0}
      data-story-uid={item.uid}
      className={clsx(
        variant === 'flat' ? s.cardFlat : s.card,
        variant === 'outline' && s.cardOutline,
        compact && s.compact,
        className,
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {!hideTeam && (
        <div className={s.head}>
          {item.teamLogoUrl ? (
            <img className={s.logo} src={item.teamLogoUrl} alt="" loading="lazy" />
          ) : (
            <div className={s.logoFallback}>{getTeamLogoFallback(item.teamName)}</div>
          )}
          {hideTeamLink ? (
            <span className={s.teamName}>{item.teamName}</span>
          ) : (
            <a
              href={`/teams/${item.teamUid}`}
              target="_blank"
              rel="noopener noreferrer"
              className={s.teamName}
              onClick={(e) => e.stopPropagation()}
            >
              {item.teamName}
            </a>
          )}
          {isHydrated && onFollowToggle && (
            <FollowButton following={isFollowing} onClick={handleFollowClick} name={item.teamName} size="compact" />
          )}
        </div>
      )}
      <h3 className={clsx(s.headline, compact && s.headlineCompact)}>{item.title}</h3>
      {item.summary &&
        (onShowMore && !fullSummary ? (
          <TruncatedSummary summary={item.summary} title={item.title} onShowMore={() => onShowMore(item)} />
        ) : (
          <p className={clsx(s.summary, compact && !fullSummary && s.summaryCompact)}>{item.summary}</p>
        ))}

      <div className={s.metaLine}>
        <div className={clsx(s.meta, compact && s.metaCompact)}>
          <span className={s.eventType}>
            <span className={`${s.eventDot} ${eventTypeDotClassName}`} aria-hidden="true" />
            <span className={clsx(s.eventLabel, compact && s.eventLabelCompact)}>{eventTypeLabel}</span>
          </span>
          {hasNewsSource(item) && (
            <>
              <span className={s.sep} aria-hidden="true" />
              <SourceList item={item} position={position} analyticsSource={analyticsSource} compact={compact} />
            </>
          )}
          <span className={s.sep} aria-hidden="true" />
          <span className={s.time}>{formatTimeAgo(item.eventDate)}</span>
        </div>
        {/* Share · Views · Like · Comments — the feed row's order (NewsGroupCard),
            so one story carries one set of actions wherever it's read. Share and
            Comments only appear where the card can open the story: without a
            detail view a comment count would point at nothing. */}
        <span className={s.actions}>
          {onOpenDetail && <NewsShareMenu item={item} source={analyticsSource} />}
          <ViewCount count={item.viewCount} />
          {/* Gated on hydration (like FollowButton) so a pre-hydration click
              can't misread a signed-in viewer as a guest. */}
          {isHydrated && onUpvoteToggle && (
            <UpvoteButton count={upvoteCount} voted={viewerHasUpvoted} onToggle={handleUpvoteToggle} />
          )}
          {onOpenDetail && (
            // opensDetail: nothing unfolds in place — a thread inside a ~340px
            // rail would push the rest of the news off-screen, the same call the
            // top-stories band makes.
            <CommentButton
              itemUid={item.uid}
              open={false}
              onToggle={() => onOpenDetail(item, 'comments')}
              opensDetail
            />
          )}
        </span>
      </div>
    </div>
  );
};

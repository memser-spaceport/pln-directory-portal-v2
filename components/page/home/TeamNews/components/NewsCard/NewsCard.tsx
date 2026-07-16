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

import { StartConversationButton } from './components/StartConversationButton';
import { UpvoteButton } from './components/UpvoteButton/UpvoteButton';
import { TruncatedSummary } from './TruncatedSummary';

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
}: NewsCardProps) => {
  const router = useRouter();
  const { currentUser, isHydrated } = useCurrentUserStore();

  const handleFollowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      router.push(`${window.location.pathname}${window.location.search}#login`);
      return;
    }
    onFollowToggle?.(item.teamUid, item.teamName, isFollowing);
  };

  const handleUpvoteToggle = () => {
    if (!currentUser) {
      router.push(`${window.location.pathname}${window.location.search}#login`);
      return;
    }
    onUpvoteToggle?.(item);
  };

  const handleClick = () => {
    onClick?.(item);
    window.open(item.sourceUrl, '_blank', 'noopener,noreferrer');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Only act on keys pressed on the card itself — Enter on an inner button
    // (Upvote/Discuss) must not also open the article.
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const { label: eventTypeLabel, dotClassName: eventTypeDotClassName } = getEventTypeConfig(item.eventType);

  return (
    <div
      role="link"
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
          {item.sourceDomain && (
            <>
              <span className={s.sep} aria-hidden="true" />
              <span className={s.source}>{item.sourceDomain}</span>
            </>
          )}
          <span className={s.sep} aria-hidden="true" />
          <span className={s.time}>{formatTimeAgo(item.eventDate)}</span>
        </div>
        <span className={s.actions}>
          {/* Gated on hydration (like FollowButton) so a pre-hydration click
              can't misread a signed-in viewer as a guest. */}
          {isHydrated && onUpvoteToggle && (
            <UpvoteButton count={upvoteCount} voted={viewerHasUpvoted} onToggle={handleUpvoteToggle} />
          )}
          <StartConversationButton item={item} position={position} analyticsSource={analyticsSource} />
        </span>
      </div>
    </div>
  );
};

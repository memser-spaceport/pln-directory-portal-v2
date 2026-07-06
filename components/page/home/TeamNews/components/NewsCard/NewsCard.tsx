'use client';

import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import { formatTimeAgo } from '@/utils/formatTimeAgo';
import { useCurrentUserStore } from '@/services/auth/store';
import type { TeamNewsAnalyticsSource } from '@/analytics/team-news.analytics';
import type { ITeamNewsItem } from '@/types/team-news.types';
import { FollowButton } from '@/components/ui/FollowButton/FollowButton';

import { getTeamLogoFallback } from '../../utils/getTeamLogoFallback';
import { getEventTypeConfig } from '../../utils/getEventTypeConfig';

import { StartConversationButton } from './components/StartConversationButton';

import s from './NewsCard.module.scss';

interface NewsCardProps {
  item: ITeamNewsItem;
  position?: number;
  onClick?: (item: ITeamNewsItem) => void;
  hideTeamLink?: boolean;
  hideTeam?: boolean;
  variant?: 'default' | 'flat' | 'outline';
  className?: string;
  analyticsSource?: TeamNewsAnalyticsSource;
  isFollowing?: boolean;
  onFollowToggle?: (teamUid: string, teamName: string, isCurrentlyFollowing: boolean) => void;
}

export const NewsCard = ({
  item,
  position = 0,
  onClick,
  hideTeamLink = false,
  hideTeam = false,
  variant = 'default',
  className,
  analyticsSource = 'home',
  isFollowing = false,
  onFollowToggle,
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

  const handleClick = () => {
    onClick?.(item);
    window.open(item.sourceUrl, '_blank', 'noopener,noreferrer');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
      className={clsx(variant === 'flat' ? s.cardFlat : s.card, variant === 'outline' && s.cardOutline, className)}
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
          {/*{isHydrated && onFollowToggle && (*/}
          {/*  <FollowButton following={isFollowing} onClick={handleFollowClick} name={item.teamName} />*/}
          {/*)}*/}
        </div>
      )}
      <h3 className={s.headline}>{item.title}</h3>

      <div className={s.metaLine}>
        <div className={s.meta}>
          <span className={s.eventType}>
            <span className={`${s.eventDot} ${eventTypeDotClassName}`} aria-hidden="true" />
            <span className={s.eventLabel}>{eventTypeLabel}</span>
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
        <StartConversationButton item={item} position={position} analyticsSource={analyticsSource} />
      </div>
    </div>
  );
};

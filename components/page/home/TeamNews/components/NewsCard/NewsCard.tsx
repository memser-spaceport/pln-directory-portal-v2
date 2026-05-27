'use client';

import { formatTimeAgo } from '@/utils/formatTimeAgo';
import type { ITeamNewsItem, TeamNewsEventType } from '@/types/team-news.types';

import { getTeamLogoFallback } from './utils/getTeamLogoFallback';

import { StartConversationButton } from './components/StartConversationButton';

import s from './NewsCard.module.scss';

interface NewsCardProps {
  item: ITeamNewsItem;
  position?: number;
  onClick?: (item: ITeamNewsItem) => void;
}

const EVENT_TYPE_LABEL: Record<TeamNewsEventType, string> = {
  FUNDING: 'Funding',
  LAUNCH: 'Launch',
  PARTNERSHIP: 'Partnership',
  ANNOUNCEMENT: 'Announcement',
  MILESTONE: 'Milestone',
  OTHER: 'Other',
};

const EVENT_TYPE_DOT_CLASS: Record<TeamNewsEventType, string> = {
  FUNDING: s.dotFunding,
  LAUNCH: s.dotLaunch,
  PARTNERSHIP: s.dotPartnership,
  ANNOUNCEMENT: s.dotAnnouncement,
  MILESTONE: s.dotMilestone,
  OTHER: s.dotOther,
};

export const NewsCard = ({ item, position = 0, onClick }: NewsCardProps) => {
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

  return (
    <div role="link" tabIndex={0} className={s.card} onClick={handleClick} onKeyDown={handleKeyDown}>
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
          className={s.teamName}
          onClick={(e) => e.stopPropagation()}
        >
          {item.teamName}
        </a>
      </div>
      <h3 className={s.headline}>{item.title}</h3>

      <div className={s.metaLine}>
        <div className={s.meta}>
          <span className={s.eventType}>
            <span className={`${s.eventDot} ${EVENT_TYPE_DOT_CLASS[item.eventType]}`} aria-hidden="true" />
            <span className={s.eventLabel}>{EVENT_TYPE_LABEL[item.eventType]}</span>
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
        <StartConversationButton item={item} position={position} />
      </div>
    </div>
  );
};

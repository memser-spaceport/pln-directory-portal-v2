import { formatTimeAgo } from '@/utils/formatTimeAgo';
import type { ITeamNewsItem, TeamNewsEventType } from '@/types/team-news.types';

import { getTeamLogoFallback } from './utils/getTeamLogoFallback';

import s from './NewsCard.module.scss';

interface NewsCardProps {
  item: ITeamNewsItem;
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

const EVENT_TYPE_CLASS: Record<TeamNewsEventType, string> = {
  FUNDING: s.chipFunding,
  LAUNCH: s.chipLaunch,
  PARTNERSHIP: s.chipPartnership,
  ANNOUNCEMENT: s.chipAnnouncement,
  MILESTONE: s.chipMilestone,
  OTHER: s.chipOther,
};

export const NewsCard = ({ item, onClick }: NewsCardProps) => {
  const handleClick = () => onClick?.(item);

  return (
    <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className={s.card} onClick={handleClick}>
      <div className={s.head}>
        {item.teamLogoUrl ? (
          <img className={s.logo} src={item.teamLogoUrl} alt="" loading="lazy" />
        ) : (
          <div className={s.logoFallback}>{getTeamLogoFallback(item.teamName)}</div>
        )}
        <div className={s.companyInfo}>
          <div className={s.titleRow}>
            <span className={s.teamName}>{item.teamName}</span>
            <span className={`${s.chip} ${EVENT_TYPE_CLASS[item.eventType]}`}>{EVENT_TYPE_LABEL[item.eventType]}</span>
          </div>
          <div className={s.metaLine}>
            {item.sourceDomain && (
              <>
                <span>{item.sourceDomain}</span>
                <span className={s.dot} aria-hidden="true" />
              </>
            )}
            <span>{formatTimeAgo(item.eventDate)}</span>
          </div>
        </div>
      </div>
      <div className={s.news}>
        <h3 className={s.headline}>{item.title}</h3>
        {item.summary && <p className={s.summary}>{item.summary}</p>}
      </div>
    </a>
  );
};

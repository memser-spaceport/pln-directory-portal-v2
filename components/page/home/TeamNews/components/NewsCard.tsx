import { formatTimeAgo } from '@/utils/formatTimeAgo';
import type { ITeamNewsItem, TeamNewsEventType } from '@/types/team-news.types';
import styles from './NewsCard.module.scss';

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
  FUNDING: styles.chipFunding,
  LAUNCH: styles.chipLaunch,
  PARTNERSHIP: styles.chipPartnership,
  ANNOUNCEMENT: styles.chipAnnouncement,
  MILESTONE: styles.chipMilestone,
  OTHER: styles.chipOther,
};

const teamLogoFallback = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
    .toUpperCase() || '?';

export const NewsCard = ({ item, onClick }: NewsCardProps) => {
  const handleClick = () => onClick?.(item);

  return (
    <a
      href={item.sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.card}
      onClick={handleClick}
    >
      <div className={styles.head}>
        {item.teamLogoUrl ? (
          <img className={styles.logo} src={item.teamLogoUrl} alt="" loading="lazy" />
        ) : (
          <div className={styles.logoFallback}>{teamLogoFallback(item.teamName)}</div>
        )}
        <div className={styles.headText}>
          <div className={styles.teamName}>{item.teamName}</div>
          <div className={styles.metaLine}>
            {item.sourceDomain && (
              <>
                <span>{item.sourceDomain}</span>
                <span className={styles.dot} aria-hidden="true" />
              </>
            )}
            <span>{formatTimeAgo(item.eventDate)}</span>
          </div>
        </div>
      </div>
      <h3 className={styles.headline}>{item.title}</h3>
      {item.summary && <p className={styles.summary}>{item.summary}</p>}
      <div className={styles.foot}>
        <span className={`${styles.chip} ${EVENT_TYPE_CLASS[item.eventType]}`}>
          {EVENT_TYPE_LABEL[item.eventType]}
        </span>
      </div>
    </a>
  );
};

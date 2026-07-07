import type { TeamNewsEventType } from '@/types/team-news.types';

// Reuse the production news-card styling 1:1.
import s from '@/components/page/home/TeamNews/components/NewsCard/NewsCard.module.scss';

export const EVENT_TYPE_LABEL: Record<TeamNewsEventType, string> = {
  FUNDING: 'Funding',
  LAUNCH: 'Launch',
  PARTNERSHIP: 'Partnership',
  ANNOUNCEMENT: 'Announcement',
  MILESTONE: 'Milestone',
  OTHER: 'Other',
};

export const EVENT_TYPE_DOT_CLASS: Record<TeamNewsEventType, string> = {
  FUNDING: s.dotFunding,
  LAUNCH: s.dotLaunch,
  PARTNERSHIP: s.dotPartnership,
  ANNOUNCEMENT: s.dotAnnouncement,
  MILESTONE: s.dotMilestone,
  OTHER: s.dotOther,
};

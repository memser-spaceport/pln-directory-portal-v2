import type { TeamNewsEventType } from '@/types/team-news.types';

import s from '../components/NewsCard/NewsCard.module.scss';

const LABEL: Record<TeamNewsEventType, string> = {
  FUNDING: 'Funding',
  LAUNCH: 'Launch',
  PARTNERSHIP: 'Partnership',
  ANNOUNCEMENT: 'Announcement',
  MILESTONE: 'Milestone',
  OTHER: 'Other',
};

const DOT_CLASS: Record<TeamNewsEventType, string> = {
  FUNDING: s.dotFunding,
  LAUNCH: s.dotLaunch,
  PARTNERSHIP: s.dotPartnership,
  ANNOUNCEMENT: s.dotAnnouncement,
  MILESTONE: s.dotMilestone,
  OTHER: s.dotOther,
};

export function getEventTypeConfig(eventType: TeamNewsEventType) {
  return { label: LABEL[eventType], dotClassName: DOT_CLASS[eventType] };
}

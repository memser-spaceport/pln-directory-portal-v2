import type { TeamNewsEventType } from '@/types/team-news.types';

import s from '../components/NewsCard/NewsCard.module.scss';

export const EVENT_TYPE_LABEL: Record<TeamNewsEventType, string> = {
  FUNDING: 'Funding',
  LAUNCH: 'Launch',
  PARTNERSHIP: 'Partnership',
  ANNOUNCEMENT: 'Announcement',
  MILESTONE: 'Milestone',
  HIRING: 'Hiring',
  DEALS: 'Deals',
  OTHER: 'Other',
};

const DOT_CLASS: Record<TeamNewsEventType, string> = {
  FUNDING: s.dotFunding,
  LAUNCH: s.dotLaunch,
  PARTNERSHIP: s.dotPartnership,
  ANNOUNCEMENT: s.dotAnnouncement,
  MILESTONE: s.dotMilestone,
  HIRING: s.dotOther,
  DEALS: s.dotOther,
  OTHER: s.dotOther,
};

export function getEventTypeConfig(eventType: TeamNewsEventType) {
  return { label: EVENT_TYPE_LABEL[eventType], dotClassName: DOT_CLASS[eventType] };
}

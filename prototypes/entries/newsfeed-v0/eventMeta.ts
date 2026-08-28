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
  HIRING: 'Hiring',
  DEALS: 'Deals',
};

/**
 * Kicker colours for the detail modal, matching the meta-line event palette
 * (NewsfeedV0.module.scss .kFunding/.kLaunch/…). Lives here so a surface that
 * opens the modal doesn't need its own copy of the palette.
 */
export const EVENT_TYPE_HEX: Record<TeamNewsEventType, string> = {
  FUNDING: '#027a48',
  LAUNCH: '#1849a9',
  PARTNERSHIP: '#5925dc',
  ANNOUNCEMENT: '#475467',
  MILESTONE: '#b54708',
  OTHER: '#475467',
  // No palette entry of their own, so they take the neutral — the same call
  // EVENT_TYPE_DOT_CLASS below makes by pointing both at `dotOther`. Consumers
  // index this map directly by `item.eventType`, so omitting them yields an
  // undefined kickerColor rather than a fallback.
  HIRING: '#475467',
  DEALS: '#475467',
};

export const EVENT_TYPE_DOT_CLASS: Record<TeamNewsEventType, string> = {
  FUNDING: s.dotFunding,
  LAUNCH: s.dotLaunch,
  PARTNERSHIP: s.dotPartnership,
  ANNOUNCEMENT: s.dotAnnouncement,
  MILESTONE: s.dotMilestone,
  OTHER: s.dotOther,
  HIRING: s.dotOther,
  DEALS: s.dotOther,
};

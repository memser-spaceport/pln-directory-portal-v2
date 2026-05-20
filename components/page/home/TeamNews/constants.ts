import type { TeamNewsEventType } from '@/types/team-news.types';

export const ALL_TAB = 'All';
export const ALL_CAT = 'all';

export const CATEGORIES: Array<{ id: TeamNewsEventType | typeof ALL_CAT; label: string }> = [
  { id: ALL_CAT, label: 'All categories' },
  { id: 'FUNDING', label: 'Funding' },
  { id: 'LAUNCH', label: 'Launch' },
  { id: 'PARTNERSHIP', label: 'Partnership' },
  { id: 'MILESTONE', label: 'Milestone' },
  { id: 'ANNOUNCEMENT', label: 'Announcement' },
];

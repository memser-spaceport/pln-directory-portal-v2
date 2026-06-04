import type { TeamNewsEventType } from '@/types/team-news.types';

export const ALL_TAB = 'All';
export const ALL_CAT = 'all';
export const ACTIVE_DISCUSSIONS_CAT = 'active-discussions';

export type TeamNewsCategoryId = typeof ALL_CAT | typeof ACTIVE_DISCUSSIONS_CAT | TeamNewsEventType;

export const ACTIVE_DISCUSSIONS_CATEGORY = {
  id: ACTIVE_DISCUSSIONS_CAT,
  label: 'Active Discussions',
} as const;

export const CATEGORIES: Array<{ id: TeamNewsEventType | typeof ALL_CAT; label: string }> = [
  { id: ALL_CAT, label: 'All categories' },
  { id: 'FUNDING', label: 'Funding' },
  { id: 'LAUNCH', label: 'Launch' },
  { id: 'PARTNERSHIP', label: 'Partnership' },
  { id: 'ANNOUNCEMENT', label: 'Announcement' },
  { id: 'MILESTONE', label: 'Milestone' },
];

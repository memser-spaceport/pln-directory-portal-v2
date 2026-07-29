import type { TeamNewsEventType } from '@/types/team-news.types';

import { EVENT_TYPE_LABEL } from './utils/getEventTypeConfig';

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
  // Safe: EVENT_TYPE_LABEL is declared as an exact Record<TeamNewsEventType, string>,
  // so its keys are exactly TeamNewsEventType (Object.keys itself only returns string[]).
  ...(Object.keys(EVENT_TYPE_LABEL) as TeamNewsEventType[]).map((id) => ({ id, label: EVENT_TYPE_LABEL[id] })),
];

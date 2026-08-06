import type { TeamNewsEventType } from '@/types/team-news.types';
import { TEAM_NEWS_DEFAULT_WINDOW_DAYS } from '@/services/team-news/constants';

import { EVENT_TYPE_LABEL } from './utils/getEventTypeConfig';

export const ALL_TAB = 'All';
export const ALL_CAT = 'all';

/**
 * Everything in the feed that is a conversation rather than a story: member
 * forum posts (the cards badged "Discussion"), plus news items that have a
 * linked forum thread.
 *
 * It used to be `active-discussions`, meaning only the second of those. That
 * left the forum-post cards with no pill at all while a similarly-named one sat
 * next to them doing something else — and because a non-`all` category dropped
 * forum posts entirely, clicking it actively hid the cards a member was after.
 * The id changed with the meaning so analytics can't silently average the two
 * definitions together.
 */
export const DISCUSSIONS_CAT = 'discussions';

export type TeamNewsCategoryId = typeof ALL_CAT | typeof DISCUSSIONS_CAT | TeamNewsEventType;

export const DISCUSSIONS_CATEGORY = {
  id: DISCUSSIONS_CAT,
  label: 'Discussions',
} as const;

export const CATEGORIES: Array<{ id: TeamNewsEventType | typeof ALL_CAT; label: string }> = [
  { id: ALL_CAT, label: 'All categories' },
  // Safe: EVENT_TYPE_LABEL is declared as an exact Record<TeamNewsEventType, string>,
  // so its keys are exactly TeamNewsEventType (Object.keys itself only returns string[]).
  ...(Object.keys(EVENT_TYPE_LABEL) as TeamNewsEventType[]).map((id) => ({ id, label: EVENT_TYPE_LABEL[id] })),
];

/**
 * The window the top-stories band ranks over, stated on the band itself so the
 * claim "top" is bounded by something the reader can see. Derived from the same
 * constant the grouped-by-focus-area fetch sends as `?windowDays=`, so the label
 * can't drift from the data behind it.
 */
export const TOP_STORIES_WINDOW_LABEL = `Last ${TEAM_NEWS_DEFAULT_WINDOW_DAYS} days`;

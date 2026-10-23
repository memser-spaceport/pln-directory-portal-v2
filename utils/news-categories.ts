import type { TeamNewsEventType } from '@/types/team-news.types';

/**
 * News preferences (LAB-2939/2941) stay hidden until the flag is on: the page
 * answers 404, and the settings menu, the For You hint and Email preferences
 * don't link to it. For You then applies no categories, so nobody is narrowed
 * by a choice they can no longer see.
 *
 * NEXT_PUBLIC_ and so build-time: changing it needs a redeploy.
 */
export const SHOW_NEWS_PREFERENCES: boolean = process.env.NEXT_PUBLIC_SHOW_NEWS_PREFERENCES === 'true';

/**
 * The news categories a member can choose on News preferences (LAB-2939):
 * the backend's NewsEventType values, in its order. Deals and Hiring are
 * feed-only types; the backend rejects them in `newsCategories`.
 */
export const NEWS_PREFERENCE_CATEGORIES: TeamNewsEventType[] = [
  'FUNDING',
  'LAUNCH',
  'PARTNERSHIP',
  'ANNOUNCEMENT',
  'MILESTONE',
  'OTHER',
];

/**
 * A member's categories from a raw preferences response. Missing or unknown
 * values mean every category, which is the default and the behaviour before
 * News preferences existed.
 */
export function readNewsCategories(raw: unknown): TeamNewsEventType[] {
  const stored = (raw as { newsCategories?: unknown } | null | undefined)?.newsCategories;
  if (!Array.isArray(stored)) return [...NEWS_PREFERENCE_CATEGORIES];
  const valid = NEWS_PREFERENCE_CATEGORIES.filter((category) => stored.includes(category));
  return valid.length > 0 ? valid : [...NEWS_PREFERENCE_CATEGORIES];
}

/** True when the list leaves at least one category out. */
export function narrowsNewsCategories(categories: readonly TeamNewsEventType[]): boolean {
  return NEWS_PREFERENCE_CATEGORIES.some((category) => !categories.includes(category));
}

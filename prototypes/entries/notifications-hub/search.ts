import { getCategoryTone } from './categories';
import type { HubNotification } from './mocks';

/**
 * Free-text match across the fields a reader would actually recall: the
 * headline, the body, and the category label ("demo day", "forum").
 *
 * Production has no search anywhere in the hub — not in the panel, not on the
 * full page — so a notification more than a screen old can only be found by
 * scrolling.
 */
export function matchesQuery(notification: HubNotification, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const haystack = [
    notification.title,
    notification.description ?? '',
    getCategoryTone(notification.category).label,
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(q);
}

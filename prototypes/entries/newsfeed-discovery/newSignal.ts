import type { ITeamNewsItem } from '@/types/team-news.types';

/**
 * The one primitive behind both signals: a per-user "last time you looked at
 * the feed" timestamp. The nav dot and the card tags are two readings of the
 * same comparison — `eventDate > newsLastSeenAt` — which is why neither needs
 * per-item read state, viewport tracking, or a "mark all as read" control.
 */
export type NewsLastSeenAt = number;

export function isNew(item: ITeamNewsItem, lastSeenAt: NewsLastSeenAt): boolean {
  return new Date(item.eventDate).getTime() > lastSeenAt;
}

export function countNew(items: ITeamNewsItem[], lastSeenAt: NewsLastSeenAt): number {
  return items.reduce((n, item) => (isNew(item, lastSeenAt) ? n + 1 : n), 0);
}

/**
 * Above this share of the visible list, the per-card tags are dropped entirely.
 *
 * A tag that sits on nearly every card labels nothing — it reads as decoration,
 * or worse, as the card's own styling. That happens on a first visit and after
 * a long absence, which are exactly the moments the feed looks most alive, so
 * the tags have to yield rather than carpet the page. The nav dot still shows:
 * "there is news" stays true even when pointing at *which* news would be
 * useless.
 */
export const TAG_SUPPRESSION_RATIO = 1 / 3;

export function shouldShowTags(newCount: number, totalCount: number): boolean {
  if (newCount === 0 || totalCount === 0) return false;
  return newCount / totalCount <= TAG_SUPPRESSION_RATIO;
}

import type { ITeamNewsItem } from '@/types/team-news.types';

export type UpvoteOverlay = ReadonlyMap<string, { viewerHasUpvoted: boolean; upvoteCount: number }>;

/** Merges the optimistic upvote overlay into a list of items. Shared by
 *  TeamNews's allItems and itemsForActiveTab memos so the two views can't
 *  drift — a Like must read identically on the All tab, a focus-area tab,
 *  and the detail modal. Returns the input array untouched (referentially)
 *  when the overlay is empty, so memo consumers keep identity semantics. */
export function applyUpvoteOverlay(items: ITeamNewsItem[], overlay: UpvoteOverlay): ITeamNewsItem[] {
  if (overlay.size === 0) return items;
  return items.map((item) => (overlay.has(item.uid) ? { ...item, ...overlay.get(item.uid) } : item));
}

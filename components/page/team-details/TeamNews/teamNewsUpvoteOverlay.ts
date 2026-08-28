import type { ITeamNewsItem } from '@/types/team-news.types';

/**
 * A vote cast in one view, held over every other view of the same story.
 *
 * Owned by TeamNewsRail (the profile's rail and its archive share one), but it
 * lives here rather than there because TeamNewsModal needs it too — and the
 * modal importing from the rail while the rail imports the modal is a genuine
 * cycle. It survived only because bundlers tolerate it; a reordered import
 * would have turned it into an undefined-at-call-time failure.
 */
export type TeamNewsUpvoteOverlay = Map<string, { viewerHasUpvoted: boolean; upvoteCount: number }>;

export function mergeUpvoteOverlay(items: ITeamNewsItem[], overlay: TeamNewsUpvoteOverlay): ITeamNewsItem[] {
  if (overlay.size === 0) return items;
  return items.map((item) => (overlay.has(item.uid) ? { ...item, ...overlay.get(item.uid) } : item));
}

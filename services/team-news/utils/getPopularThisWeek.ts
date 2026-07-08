import type { ITeamNewsItem } from '@/types/team-news.types';

const POPULAR_WINDOW_DAYS = 7;
const POPULAR_MIN_UPVOTES = 2;
const POPULAR_MAX_ITEMS = 3;

// Pure derivation over the same overlay-applied item list the feed renders — not a
// separate fetch — so a viewer's own upvote crossing the threshold is reflected
// immediately, with no risk of drifting out of sync with the feed's upvote state.
// `now` is passed in rather than read internally so this stays pure and testable.
export function getPopularThisWeek(items: ITeamNewsItem[], now: Date): ITeamNewsItem[] {
  const cutoff = now.getTime() - POPULAR_WINDOW_DAYS * 24 * 60 * 60 * 1000;

  const eligible = items
    .filter((item) => new Date(item.eventDate).getTime() >= cutoff)
    .sort((a, b) => {
      const upvoteDiff = (b.upvoteCount ?? 0) - (a.upvoteCount ?? 0);
      if (upvoteDiff !== 0) return upvoteDiff;
      return new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime();
    });

  if ((eligible[0]?.upvoteCount ?? 0) < POPULAR_MIN_UPVOTES) return [];

  return eligible.slice(0, POPULAR_MAX_ITEMS);
}

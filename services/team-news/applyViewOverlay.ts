import type { ITeamNewsItem } from '@/types/team-news.types';

/**
 * The views this page load recorded, shown on the cards that caused them.
 *
 * A card reaching 50% visibility POSTs an impression and the server count goes
 * up immediately — but the items came with the page, so the reader kept seeing
 * the pre-increment number until they reloaded. This adds the increment the
 * client already knows about.
 *
 * Lives beside `useTeamNewsImpressions`, whose recorded set is the only thing
 * that may be passed in: a delta derived from anything else could disagree with
 * what was actually sent. There are already two copies of the overlay-merge idea
 * in this repo (`applyUpvoteOverlay` on /home, `mergeUpvoteOverlay` on the team
 * profile); this is deliberately not a third — both surfaces call this one.
 *
 * Safe to apply once per render because it is a pure function of the set, not
 * an accumulator: re-running it on the same items yields the same numbers.
 */
export function applyViewOverlay(items: ITeamNewsItem[], viewedUids: ReadonlySet<string>): ITeamNewsItem[] {
  // Identity preserved before the first impression, so nothing downstream
  // recomputes for an overlay that has nothing to say.
  if (viewedUids.size === 0) return items;

  return items.map((item) =>
    // ABSENT STAYS ABSENT. `viewCount` is optional and `ViewCount` renders
    // `count ?? 0`, so "we were never told" and "nobody has read it" already
    // look identical on screen. Turning an unknown into 1 would assert a total
    // the server never sent — and would read as wrong the moment the real one
    // arrives on the next load.
    viewedUids.has(item.uid) && typeof item.viewCount === 'number' ? { ...item, viewCount: item.viewCount + 1 } : item,
  );
}

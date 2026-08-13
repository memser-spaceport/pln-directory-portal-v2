import type { ITeamNewsItem } from '@/types/team-news.types';

/** The lead card. */
export const TOP_STORIES_LEAD_COUNT = 1;
/** The secondary rows under the lead. Two, not three: the band sits above the
 *  whole feed, and a third row pushes the stream under the fold. */
export const TOP_STORIES_ROW_COUNT = 2;

/** How many stories the band consumes when it renders. */
export const TOP_STORIES_TOTAL = TOP_STORIES_LEAD_COUNT + TOP_STORIES_ROW_COUNT;

/** The feed's default first page — see TeamNews' `pageSize` default. */
const DEFAULT_FEED_PAGE = 6;

/**
 * The corpus the band needs to exist: its own three plus a full first page
 * beneath it.
 *
 * Absolute rather than derived from the caller's `pageSize`: whether a window
 * is rich enough to warrant an editorial band is a property of the window, not
 * of a paging knob, and tying the two would let a `pageSize` override silently
 * decide whether the band appears.
 */
export const TOP_STORIES_MIN_CORPUS = TOP_STORIES_TOTAL + DEFAULT_FEED_PAGE;

export interface TopStoriesSelection {
  /** null when the window is below `minItems` or fewer than TOP_STORIES_TOTAL
   *  editorial picks exist — the caller renders nothing. */
  lead: ITeamNewsItem | null;
  /** The runners-up. Always two when `lead` is set, since we require exactly
   *  TOP_STORIES_TOTAL editorial ranks — but typed as a list so the band's own
   *  render still guards on length rather than trusting the caller. */
  also: ITeamNewsItem[];
  /** Every uid in the block. The one exclusion set — used for the stream below
   *  and for the rail's "Popular this week", so the two can't drift. */
  uids: Set<string>;
}

const EMPTY: TopStoriesSelection = { lead: null, also: [], uids: new Set() };

function isEditorialRank(rank: number | null | undefined): rank is number {
  return typeof rank === 'number' && rank >= 1 && rank <= TOP_STORIES_TOTAL;
}

/**
 * Picks the block's stories from LLM-assigned `editorialRank` (1 = lead, 2–3 =
 * runners-up). Independent of upvote counts so Top Stories and Popular this
 * week stay visually distinct.
 *
 * Requires exactly TOP_STORIES_TOTAL (3) editorial picks in the window — no
 * upvote/recency fallback. A quiet window or a seed run that has not yet run
 * simply hides the band.
 *
 * `minItems` is the corpus the band needs to exist at all — normally
 * `TOP_STORIES_MIN_CORPUS`. The band's whole premise is that it sits ABOVE a
 * feed: on a quiet window it would swallow most of the stories and leave one or
 * two below, at which point it isn't a pick over a stream, it's the stream with
 * different styling. Parameterised rather than hardcoded so the gate is
 * directly testable.
 */
export function selectTopStories(items: ITeamNewsItem[], minItems: number): TopStoriesSelection {
  if (items.length < Math.max(minItems, TOP_STORIES_TOTAL)) return EMPTY;

  const editorial = items
    .filter((item) => isEditorialRank(item.editorialRank))
    .sort((a, b) => (a.editorialRank as number) - (b.editorialRank as number));

  if (editorial.length < TOP_STORIES_TOTAL) return EMPTY;

  const picked = editorial.slice(0, TOP_STORIES_TOTAL);
  return {
    lead: picked[0] ?? null,
    also: picked.slice(1),
    uids: new Set(picked.map((i) => i.uid)),
  };
}

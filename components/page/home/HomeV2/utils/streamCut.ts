/** Stacked (no rail beside the stream), the fewest full cards before the cut. */
export const STREAM_CUT_MIN_STACKED = 3;
/** Beside the rail, the fewest full cards. A short rail still shows this many. */
export const STREAM_CUT_MIN_BESIDE = 4;
/** Stacked, how much of the first card past the cut shows under the fade. */
export const STREAM_CUT_PEEK = 140;
/** The rail sits beside the stream from tablet-landscape (`.newsRow`'s breakpoint); below that it stacks under it. */
export const STREAM_SIDE_BY_SIDE_QUERY = '(min-width: 960px)';

export interface StreamCut {
  /** Cards shown whole; the rest are faded and inert. */
  full: number;
  /** The list's max-height, when it is cut. */
  clip?: number;
}

/**
 * Where the signed-in Home's stream is cut (LAB-3125, prototype `WeekFeed`'s measure). Beside the rail: every card
 * that ends above the rail's bottom stays whole, and at least four stay whole when the rail is shorter than that.
 * The list ends at the rail, or just past the fourth card when the rail is shorter. Stacked: three whole cards,
 * then 140px of the fourth.
 *
 * `cards` are the list's children (offsetTop / offsetHeight, relative to the list); `railBottom` is the rail's bottom
 * measured from the list's top, or null when the rail is not beside the stream.
 */
export function computeStreamCut(
  cards: ReadonlyArray<{ offsetTop: number; offsetHeight: number }>,
  railBottom: number | null,
): StreamCut {
  const besideRail = railBottom !== null;
  const target = railBottom ?? 0;
  let full = cards.filter((c) => c.offsetTop + c.offsetHeight <= target).length;
  full = Math.max(full, besideRail ? STREAM_CUT_MIN_BESIDE : STREAM_CUT_MIN_STACKED);
  if (full >= cards.length) return { full: cards.length };
  return {
    full,
    clip: Math.round(
      besideRail ? Math.max(target, cards[full].offsetTop + 24) : cards[full].offsetTop + STREAM_CUT_PEEK,
    ),
  };
}

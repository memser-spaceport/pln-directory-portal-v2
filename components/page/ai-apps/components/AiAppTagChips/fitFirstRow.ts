/**
 * How many tags fit on the first row, given where each one landed.
 *
 * A pure function over measurements rather than a hook that reads the DOM,
 * because the DOM is the part jsdom cannot give us: every `offsetTop` there is
 * `0`, so a test driven through the rendered list would report "they all fit"
 * whatever the logic did — green, and blind. The component measures; this
 * decides; the test calls this directly.
 *
 * `tops` is each tag's `offsetTop` in source order. The first row is every tag
 * sharing the first one's top, within a pixel of slack for the sub-pixel
 * rounding a flex row produces at some zoom levels.
 */
export function fitFirstRow(tops: number[]): number {
  if (tops.length === 0) return 0;

  const first = tops[0];
  let fitted = 0;
  for (const top of tops) {
    if (Math.abs(top - first) > 1) break;
    fitted += 1;
  }
  return fitted;
}

/**
 * The count to actually render, once the `+n` chip's own width is accounted for.
 *
 * **The counter takes room from the row it describes.** With five tags of which
 * four fit, showing four leaves no space for "+1", so it lands on a second row —
 * which is the bug this whole thing exists to remove. One tag gives way to it.
 *
 * Not applied when everything fits: there is no counter then, so nothing has to
 * make room for one. That asymmetry is the whole rule.
 */
export function visibleTagCount(tops: number[], total: number): number {
  const fitted = fitFirstRow(tops);
  if (fitted >= total) return total;

  /* At least one tag survives. A row of nothing but "+5" tells the reader the
     card has tags and refuses to name any of them, which is worse than one tag
     and a counter — and it is reachable whenever the first tag is wider than the
     card, which long category names are. */
  return Math.max(1, fitted - 1);
}

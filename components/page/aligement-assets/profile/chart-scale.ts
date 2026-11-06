/** Scale helpers shared by the profile charts. */

/** The next round number at or above `value`, so axis ticks land on readable figures. */
export function niceMax(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  return Math.ceil(value / magnitude) * magnitude;
}

/** Evenly spaced label positions, so long histories never crowd the x axis. */
export function pickLabelIndices(length: number, maxLabels: number): Set<number> {
  if (length <= maxLabels) return new Set(Array.from({ length }, (_, i) => i));
  const indices = new Set<number>();
  for (let i = 0; i < maxLabels; i++) {
    indices.add(Math.round((i * (length - 1)) / (maxLabels - 1)));
  }
  return indices;
}

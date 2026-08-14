/** e.g. remaining=70, min=10, max=100, step=10 → [10, 20, ... 70], capped at max. */
export function communityGiftOptions(remaining: number, min: number, max: number, step: number): number[] {
  const opts: number[] = [];
  const cap = Math.min(remaining, max);
  for (let v = min; v <= cap; v += step) {
    opts.push(v);
  }
  return opts;
}

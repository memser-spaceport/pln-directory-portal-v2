/** Community-track rules. The limits mirror plaa-service. */
export const COMMUNITY_TRACK = {
  perRoundBudget: 100,
  increment: 10,
  minGift: 10,
  maxGift: 100,
  messageMin: 25,
  messageMax: 500,
} as const;

/** Valid gift options for the dropdown, e.g. remaining=70 → [10..70]. */
export function communityGiftOptions(remaining: number): number[] {
  const opts: number[] = [];
  const cap = Math.min(remaining, COMMUNITY_TRACK.maxGift);
  for (let v = COMMUNITY_TRACK.minGift; v <= cap; v += COMMUNITY_TRACK.increment) {
    opts.push(v);
  }
  return opts;
}

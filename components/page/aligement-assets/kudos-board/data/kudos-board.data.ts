/**
 * Community Kudos (Lite) — static config
 *
 * Community-track rules only. No tier ladder, no size ladder — those belong to
 * the nomination tracks, which are out of scope for the Lite build.
 *
 * IMPORTANT: this file contains NO member data. The recipient list and the feed
 * are fetched from authenticated backend endpoints at runtime (see
 * @/services/kudos.service and @/hooks/use-kudos). Do not add a hardcoded member
 * list here or anywhere else in the frontend.
 */

export const COMMUNITY_TRACK = {
  /** Points granted to each participant at the start of every round. */
  perRoundBudget: 100,
  /** Single-gift increment. */
  increment: 10,
  /** Minimum points per single gift. */
  minGift: 10,
  /** Maximum points per single gift. */
  maxGift: 100,
} as const;

/**
 * Produces the valid gift options for the dropdown given the user's current
 * pool. e.g. remaining=70 → [10, 20, 30, 40, 50, 60, 70].
 */
export function communityGiftOptions(remaining: number): number[] {
  const opts: number[] = [];
  const cap = Math.min(remaining, COMMUNITY_TRACK.maxGift);
  for (let v = COMMUNITY_TRACK.minGift; v <= cap; v += COMMUNITY_TRACK.increment) {
    opts.push(v);
  }
  return opts;
}

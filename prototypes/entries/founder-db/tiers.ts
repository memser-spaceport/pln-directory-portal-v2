// Single source of truth for the alignment tier boundaries + traffic-light scale,
// shared by the alignment meter, the "Strong fit · top N" group, and the KPI
// distribution so they never drift apart.

export const STRONG_FIT_THRESHOLD = 0.85;
export const PROMISING_THRESHOLD = 0.7;

export type AlignmentTier = 'strong' | 'promising' | 'marginal';

/** Map a 0–1 alignment value to its tier. */
export function alignmentTier(value: number): AlignmentTier {
  if (value >= STRONG_FIT_THRESHOLD) return 'strong';
  if (value >= PROMISING_THRESHOLD) return 'promising';
  return 'marginal';
}

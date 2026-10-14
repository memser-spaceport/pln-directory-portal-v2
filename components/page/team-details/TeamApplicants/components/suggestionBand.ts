import type { SuggestedCandidate, SuggestedCriterion } from '@/schema/suggested-candidates';

/** How many of the role's criteria the profile meets — the band's working. */
export const metCount = (criteria: SuggestedCriterion[]) => criteria.filter((c) => c.matched).length;

/**
 * The note to show for a suggestion (LAB-2789): only an interested member's,
 * and only when it has text. A blank note is no note, so the pane draws no
 * empty note area. The list row shows no note at all (LAB-2853).
 */
export const interestNote = (suggestion: Pick<SuggestedCandidate, 'interested' | 'note'>): string | null =>
  (suggestion.interested && suggestion.note?.trim()) || null;

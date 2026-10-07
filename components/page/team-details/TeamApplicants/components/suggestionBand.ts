import type { SuggestedCriterion, SuggestionLabel } from '@/schema/suggested-candidates';

/**
 * The band's DS `Badge` tone, as the design has it (LAB-2687): Strong in
 * success green, Good in brand blue. Both bands are recommendations, so neither
 * takes amber or red. One map so the row and the pane never disagree.
 */
export const SUGGESTION_BAND_VARIANT: Record<SuggestionLabel, 'success' | 'brand'> = {
  'Strong match': 'success',
  'Good match': 'brand',
};

export const metCount = (criteria: SuggestedCriterion[]) => criteria.filter((c) => c.matched).length;

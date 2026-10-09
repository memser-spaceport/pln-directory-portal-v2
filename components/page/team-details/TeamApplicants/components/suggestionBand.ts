import type { SuggestedCriterion } from '@/schema/suggested-candidates';

/** How many of the role's criteria the profile meets — the band's working. */
export const metCount = (criteria: SuggestedCriterion[]) => criteria.filter((c) => c.matched).length;

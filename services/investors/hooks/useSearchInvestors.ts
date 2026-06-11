'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchInvestors } from '../investors.service';
import { InvestorsQueryKeys } from '../constants';

/**
 * Lightweight typeahead search over the investor DB (name / fund). Enabled only
 * once the term is ≥2 chars; capped to a short list for the dropdown.
 */
export function useSearchInvestors(q: string, enabled: boolean) {
  const term = q.trim();
  return useQuery({
    queryKey: [InvestorsQueryKeys.INVESTORS_LIST, 'typeahead', term],
    queryFn: () => fetchInvestors({ q: term, limit: 8 }),
    enabled: enabled && term.length >= 2,
    staleTime: 60 * 1000,
  });
}

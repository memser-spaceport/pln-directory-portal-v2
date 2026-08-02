'use client';

import { useQuery } from '@tanstack/react-query';
import { InvestorsQueryKeys } from '../constants';
import { getWarmIntrosV2Facets } from '../warm-intros-v2.service';

export function useWarmIntrosV2Facets(targetSet?: string, enabled = true) {
  return useQuery({
    queryKey: [InvestorsQueryKeys.WARM_INTROS_V2_FACETS, targetSet ?? null],
    queryFn: () => getWarmIntrosV2Facets({ targetSet }),
    enabled,
    staleTime: 60 * 1000,
  });
}

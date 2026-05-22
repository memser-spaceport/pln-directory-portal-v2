'use client';

import { useQuery } from '@tanstack/react-query';
import { findWarmIntros } from '../investors.service';
import { InvestorsQueryKeys } from '../constants';
import type { WarmIntrosParams } from '../types';

/**
 * Warm-intros search. Enabled only when the user has set criteria —
 * either a team_id or at least a sector + stage.
 */
export function useFindWarmIntros(params: WarmIntrosParams, enabled: boolean) {
  return useQuery({
    queryKey: [InvestorsQueryKeys.WARM_INTROS, params],
    queryFn: () => findWarmIntros(params),
    enabled,
    staleTime: 60 * 1000,
  });
}

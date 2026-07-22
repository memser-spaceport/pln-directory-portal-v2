'use client';

import { useQuery } from '@tanstack/react-query';
import { InvestorsQueryKeys } from '../constants';
import { listWarmIntrosV2Paths } from '../warm-intros-v2.service';
import type { WarmIntrosV2ListParams } from '../warm-intros-v2.types';

export function useWarmIntrosV2Paths(params: WarmIntrosV2ListParams, enabled = true) {
  return useQuery({
    queryKey: [InvestorsQueryKeys.WARM_INTROS_V2_PATHS, params],
    queryFn: () => listWarmIntrosV2Paths(params),
    enabled,
    staleTime: 60 * 1000,
  });
}

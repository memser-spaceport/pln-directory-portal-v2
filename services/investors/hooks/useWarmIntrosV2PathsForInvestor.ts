'use client';

import { useQuery } from '@tanstack/react-query';
import { InvestorsQueryKeys } from '../constants';
import { getWarmIntrosV2PathsForInvestor } from '../warm-intros-v2.service';

export function useWarmIntrosV2PathsForInvestor(
  profileUid: string | null | undefined,
  opts: { targetSet?: string; enabled?: boolean } = {},
) {
  const enabled = (opts.enabled ?? true) && !!profileUid;
  return useQuery({
    queryKey: [InvestorsQueryKeys.WARM_INTROS_V2_PATHS_FOR_INVESTOR, profileUid, opts.targetSet ?? null],
    queryFn: () => getWarmIntrosV2PathsForInvestor(profileUid!, { targetSet: opts.targetSet }),
    enabled,
    staleTime: 60 * 1000,
  });
}

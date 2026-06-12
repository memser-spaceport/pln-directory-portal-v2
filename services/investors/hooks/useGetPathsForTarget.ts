'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchPathsForTarget } from '../pathfinder.service';
import { InvestorsQueryKeys } from '../constants';

/**
 * All ranked warm paths for a single target investor (best first). Lazily
 * enabled — the warm-intros workspace only fetches a target's full path list
 * when the user expands the row. The at-a-glance proximity code comes from the
 * denormalized `best_proximity_code` on the investor record, so this hook is
 * not needed to render the collapsed row.
 */
export function useGetPathsForTarget(investorId: string, enabled: boolean) {
  return useQuery({
    queryKey: [InvestorsQueryKeys.PATHS_FOR_TARGET, investorId],
    queryFn: () => fetchPathsForTarget(investorId),
    enabled: enabled && !!investorId,
    staleTime: 60 * 1000,
  });
}

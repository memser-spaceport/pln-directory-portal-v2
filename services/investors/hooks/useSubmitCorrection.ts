'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submitCorrection } from '../pathfinder.service';
import { InvestorsQueryKeys } from '../constants';
import type { CorrectionInput } from '../types';

/**
 * Persist an investment-team override (caliber / connector / path validity).
 * Feeds the next pathfinder recompute and seeds the future Affinity write-back.
 * On success, invalidate ONLY the affected target's path list so its pending
 * corrections refetch — invalidating the bare PATHS_FOR_TARGET prefix would
 * refetch every mounted per-investor query at once and trip the rate limit.
 */
export function useSubmitCorrection(investorId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CorrectionInput) => submitCorrection(input),
    onSuccess: (ok) => {
      if (ok) {
        queryClient.invalidateQueries({ queryKey: [InvestorsQueryKeys.PATHS_FOR_TARGET, investorId] });
      }
    },
  });
}

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submitCorrection } from '../pathfinder.service';
import { InvestorsQueryKeys } from '../constants';
import type { CorrectionInput } from '../types';

/**
 * Persist an investment-team override (caliber / connector / path validity).
 * Feeds the next pathfinder recompute and seeds the future Affinity write-back.
 * On success, invalidate the affected target's path list so the drawer reflects
 * any server-side re-derivation.
 */
export function useSubmitCorrection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CorrectionInput) => submitCorrection(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [InvestorsQueryKeys.PATHS_FOR_TARGET] });
    },
  });
}

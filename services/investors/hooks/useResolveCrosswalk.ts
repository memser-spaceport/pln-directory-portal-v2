'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { resolveCrosswalk } from '../lists.service';
import { InvestorsQueryKeys } from '../constants';

/**
 * Confirm (link) or reject (keep separate) a crosswalk candidate. Logs a
 * PathfinderCorrection server-side and removes the item from the queue. On
 * success, invalidate the review queue. Gated on investor_db.edit.
 */
export function useResolveCrosswalk() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, confirmed, note }: { id: string; confirmed: boolean; note?: string }) =>
      resolveCrosswalk(id, confirmed, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [InvestorsQueryKeys.CROSSWALK_REVIEW] });
    },
  });
}

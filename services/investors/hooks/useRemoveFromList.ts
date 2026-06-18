'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeFromList } from '../lists.service';
import { InvestorsQueryKeys } from '../constants';

/**
 * Remove an investor from a target list. On success, invalidate the lists
 * (member counts) and that list's members. Gated server-side on investor_db.edit.
 */
export function useRemoveFromList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, investorId }: { listId: string; investorId: string }) => removeFromList(listId, investorId),
    onSuccess: (_ok, { listId, investorId }) => {
      queryClient.invalidateQueries({ queryKey: [InvestorsQueryKeys.INVESTOR_LISTS] });
      queryClient.invalidateQueries({ queryKey: [InvestorsQueryKeys.INVESTOR_LISTS, investorId] });
      queryClient.invalidateQueries({ queryKey: [InvestorsQueryKeys.LIST_MEMBERS, listId] });
    },
  });
}

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addToList } from '../lists.service';
import { InvestorsQueryKeys } from '../constants';

/**
 * Add an investor to a target list (from the All Investors row / drawer). On
 * success, invalidate the lists (member counts) and that list's members.
 * Gated server-side on investor_db.edit.
 */
export function useAddToList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, investorId }: { listId: string; investorId: string }) => addToList(listId, investorId),
    onSuccess: (result, { listId, investorId }) => {
      queryClient.invalidateQueries({ queryKey: [InvestorsQueryKeys.INVESTOR_LISTS] });
      queryClient.invalidateQueries({ queryKey: [InvestorsQueryKeys.INVESTOR_LISTS, investorId] });
      queryClient.invalidateQueries({ queryKey: [InvestorsQueryKeys.LIST_MEMBERS, listId] });
    },
  });
}

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addToList } from '../lists.service';
import { InvestorsQueryKeys } from '../constants';
import type { InvestorList } from '../types';

export function useAddToList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, investorId }: { listId: string; investorId: string }) => addToList(listId, investorId),
    onMutate: async ({ listId, investorId }) => {
      await queryClient.cancelQueries({ queryKey: [InvestorsQueryKeys.INVESTOR_LISTS, investorId] });
      const previous = queryClient.getQueryData<InvestorList[]>([InvestorsQueryKeys.INVESTOR_LISTS, investorId]);
      queryClient.setQueryData<InvestorList[]>([InvestorsQueryKeys.INVESTOR_LISTS, investorId], (old) =>
        old?.map((l) => (l.id === listId ? { ...l, is_member: true } : l)),
      );
      return { previous, investorId };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData([InvestorsQueryKeys.INVESTOR_LISTS, context.investorId], context.previous);
      }
    },
    onSuccess: (_result, { listId, investorId }) => {
      queryClient.invalidateQueries({ queryKey: [InvestorsQueryKeys.INVESTOR_LISTS] });
      queryClient.invalidateQueries({ queryKey: [InvestorsQueryKeys.INVESTOR_LISTS, investorId] });
      queryClient.invalidateQueries({ queryKey: [InvestorsQueryKeys.LIST_MEMBERS, listId] });
    },
  });
}

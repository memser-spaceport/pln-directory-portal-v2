import { useMutation, useQueryClient } from '@tanstack/react-query';
import { markDealAsUsing, unmarkDealAsUsing } from '../deals.service';
import { DealsQueryKeys } from '../constants';
import { IDeal } from '@/types/deals.types';
import { toast } from '@/components/core/ToastContainer';

export function useToggleDealUsing(dealUid: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (isCurrentlyUsing: boolean) => {
      if (isCurrentlyUsing) {
        return unmarkDealAsUsing(dealUid);
      }
      return markDealAsUsing(dealUid);
    },
    onMutate: async (isCurrentlyUsing: boolean) => {
      await queryClient.cancelQueries({ queryKey: [DealsQueryKeys.DEAL_BY_ID, dealUid] });

      const previousDeal = queryClient.getQueryData<IDeal>([DealsQueryKeys.DEAL_BY_ID, dealUid]);

      if (previousDeal) {
        queryClient.setQueryData<IDeal>([DealsQueryKeys.DEAL_BY_ID, dealUid], {
          ...previousDeal,
          isUsing: !isCurrentlyUsing,
          teamsUsingCount: previousDeal.teamsUsingCount + (isCurrentlyUsing ? -1 : 1),
        });
      }

      return { previousDeal };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousDeal) {
        queryClient.setQueryData([DealsQueryKeys.DEAL_BY_ID, dealUid], context.previousDeal);
      }
      toast.error('Failed to update deal status. Please try again.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [DealsQueryKeys.DEAL_BY_ID, dealUid] });
    },
  });
}

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { redeemDeal } from '../deals.service';
import { DealsQueryKeys } from '../constants';

export function useRedeemDeal(dealUid: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => redeemDeal(dealUid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DealsQueryKeys.DEAL_BY_ID, dealUid] });
    },
  });
}

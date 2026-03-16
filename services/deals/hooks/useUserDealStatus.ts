import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserDealStatus, toggleDealUsing } from '../deals.service';
import { DealsQueryKeys } from '../constants';
import { IUserDealStatus } from '@/types/deals.types';

export function useUserDealStatus(dealId: string) {
  return useQuery({
    queryKey: [DealsQueryKeys.USER_DEAL_STATUS, dealId],
    queryFn: () => getUserDealStatus(dealId),
    enabled: !!dealId,
    staleTime: 30000,
  });
}

export function useToggleDealUsing(dealId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => toggleDealUsing(dealId),
    onSuccess: (data: IUserDealStatus) => {
      queryClient.setQueryData([DealsQueryKeys.USER_DEAL_STATUS, dealId], data);
    },
  });
}

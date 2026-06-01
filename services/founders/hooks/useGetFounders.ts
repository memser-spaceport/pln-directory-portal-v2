import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchFounders } from '../founders.service';
import { FoundersQueryKeys } from '../constants';
import type { FounderListParams } from '../types';

export function useGetFounders(params: FounderListParams, enabled = true) {
  return useQuery({
    queryKey: [FoundersQueryKeys.FOUNDERS_LIST, params],
    queryFn: () => fetchFounders(params),
    enabled,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}

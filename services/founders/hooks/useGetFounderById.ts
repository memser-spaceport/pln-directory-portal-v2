import { useQuery } from '@tanstack/react-query';
import { fetchFounderById } from '../founders.service';
import { FoundersQueryKeys } from '../constants';

export function useGetFounderById(id: string | null) {
  return useQuery({
    queryKey: [FoundersQueryKeys.FOUNDER_DETAIL, id],
    queryFn: () => fetchFounderById(id!),
    enabled: !!id,
    staleTime: 60_000,
  });
}

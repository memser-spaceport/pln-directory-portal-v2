import { useQuery } from '@tanstack/react-query';
import { AffinityQueryKeys } from '@/services/affinity/constants';
import { getAffinityMember } from '@/services/affinity/affinity.service';

export function useAffinityMember(uid: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: [AffinityQueryKeys.GET_AFFINITY_MEMBER, uid],
    queryFn: () => getAffinityMember(uid!),
    enabled: !!uid && enabled,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

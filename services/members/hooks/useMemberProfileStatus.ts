import { useQuery } from '@tanstack/react-query';
import { MembersQueryKeys } from '@/services/members/constants';

async function fetcher(uid: string | undefined) {
  if (!uid) {
    return null;
  }

  return 40;
}

export function useMemberProfileStatus(uid: string | undefined) {
  return useQuery({
    queryKey: [MembersQueryKeys.GET_PROFILE_STATUS, uid],
    queryFn: () => fetcher(uid),
    enabled: !!uid,
  });
}

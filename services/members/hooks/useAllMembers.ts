import { useQuery } from '@tanstack/react-query';
import { MembersQueryKeys } from '@/services/members/constants';
import { getMembersWithRoles } from '@/services/members.service';

async function fetcher() {
  return getMembersWithRoles();
}

export function useAllMembers() {
  return useQuery({
    queryKey: [MembersQueryKeys.GET_ALL_MEMBERS],
    queryFn: fetcher,
  });
}

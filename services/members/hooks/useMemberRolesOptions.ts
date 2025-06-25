import { useQuery } from '@tanstack/react-query';
import { MembersQueryKeys } from '@/services/members/constants';
import { getMemberInfoFormValues } from '@/utils/member.utils';
import { getMemberRoles } from '@/services/members.service';

async function fetcher() {
  return getMemberRoles({});
}

export function useMemberRolesOptions() {
  return useQuery({
    queryKey: [MembersQueryKeys.GET_MEMBERS_ROLES_OPTIONS],
    queryFn: fetcher,
  });
}

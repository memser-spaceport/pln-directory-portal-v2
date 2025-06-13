import { useQuery } from '@tanstack/react-query';
import { MembersQueryKeys } from '@/services/members/constants';
import { getMemberInfoFormValues } from '@/utils/member.utils';

async function fetcher() {
  return getMemberInfoFormValues();
}

export function useMemberFormOptions() {
  return useQuery({
    queryKey: [MembersQueryKeys.GET_SKILLS_OPTIONS],
    queryFn: fetcher,
  });
}

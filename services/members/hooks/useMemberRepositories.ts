import { useQuery } from '@tanstack/react-query';
import { MembersQueryKeys } from '@/services/members/constants';
import { getMemberRepositories } from '@/services/members.service';
import { IMember } from '@/types/members.types';

async function fetcher(id: string | undefined) {
  if (!id) {
    return null;
  }

  const res: IMember['repositories'] = await getMemberRepositories(id, { cache: 'default' });

  return res;
}

export function useMemberRepositories(id: string | undefined) {
  return useQuery({
    queryKey: [MembersQueryKeys.GET_MEMBER_REPOSITORIES, id],
    queryFn: () => fetcher(id),
    enabled: !!id,
  });
}

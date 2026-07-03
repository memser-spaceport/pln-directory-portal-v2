import { useQuery } from '@tanstack/react-query';
import Cookies from 'js-cookie';
import { getTeamFollowers } from '../follow.service';
import type { ITeamFollower, ITeamFollowersResponse } from '@/types/follow.types';
import { FollowQueryKeys } from '../constants';
import { getParsedValue } from '@/utils/common.utils';

export function useTeamFollowers(
  teamUid: string,
  options?: { enabled?: boolean; initialData?: ITeamFollowersResponse | null },
) {
  return useQuery({
    queryKey: [FollowQueryKeys.FOLLOWED_TEAMS, 'followers', teamUid],
    queryFn: async () => {
      const authToken = getParsedValue(Cookies.get('authToken'));
      const result = await getTeamFollowers(teamUid, { authToken });
      if (!result) return { items: [] as ITeamFollower[], total: 0 };
      return result;
    },
    enabled: options?.enabled ?? false,
    initialData: options?.initialData ?? undefined,
    staleTime: 30_000,
  });
}

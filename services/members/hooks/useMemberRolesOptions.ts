import { useQuery } from '@tanstack/react-query';
import { MembersQueryKeys } from '@/services/members/constants';
import { getRecommendationRoles } from '@/services/recommendations.service';

async function fetcher() {
  return getRecommendationRoles();
}

export function useMemberRolesOptions() {
  return useQuery({
    queryKey: [MembersQueryKeys.GET_MEMBERS_ROLES_OPTIONS],
    queryFn: fetcher,
  });
}

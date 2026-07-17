import { useQuery } from '@tanstack/react-query';
import { MembersQueryKeys } from '@/services/members/constants';
import { customFetch } from '@/utils/fetch-wrapper';
import { MemberProfileStatus } from '@/services/members/types';

async function fetcher(uid: string | undefined) {
  if (!uid) {
    return null;
  }

  const url = `${process.env.DIRECTORY_API_URL}/v1/profile/${uid}/status`;

  const response = await customFetch(
    url,
    {
      method: 'GET',
    },
    true,
  );

  if (!response?.ok) {
    // Non-critical background data (navbar treats missing status as "nothing to
    // show") — returning null instead of throwing keeps a 403/5xx on a background
    // refetch from tripping the global query error handler.
    console.error(`Failed to fetch profile status (status ${response?.status ?? 'unknown'})`);
    return null;
  }

  const data: MemberProfileStatus = await response.json();

  return data;
}

export function useMemberProfileStatus(uid: string | undefined) {
  return useQuery({
    queryKey: [MembersQueryKeys.GET_PROFILE_STATUS, uid],
    queryFn: () => fetcher(uid),
    enabled: !!uid,
  });
}

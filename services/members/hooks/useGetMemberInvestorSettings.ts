import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { customFetch } from '@/utils/fetch-wrapper';
import { MembersQueryKeys } from '@/services/members/constants';

export type MemberInvestorSettings = {
  isInvestor: boolean;
};

async function fetcher(uid: string | undefined): Promise<MemberInvestorSettings> {
  if (!uid) {
    throw new Error('UID is required');
  }

  const response = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/members/${uid}/investor-settings`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    },
    true,
  );

  if (!response?.ok) {
    const res = await response?.json();
    throw new Error(res?.status?.message || 'Failed to fetch member investor settings');
  }

  return await response.json();
}

export function useGetMemberInvestorSettings(uid: string | undefined, initialData?: MemberInvestorSettings) {
  return useQuery({
    queryKey: [MembersQueryKeys.GET_MEMBER_INVESTOR_SETTINGS, uid],
    queryFn: () => fetcher(uid),
    enabled: Boolean(uid),
    initialData,
    placeholderData: keepPreviousData,
  });
}

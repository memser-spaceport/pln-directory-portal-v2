import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { customFetch } from '@/utils/fetch-wrapper';
import { MembersQueryKeys } from '@/services/members/constants';
import Cookies from 'js-cookie';

export type InvestorSettings = {
  investorInvitesEnabled: boolean;
  investorDealflowEnabled: boolean;
  showInvestorProfileOnMemberPage: boolean;
  memberUid: string;
};

async function fetcher(uid: string | undefined) {
  if (!uid) {
    return null;
  }

  const response = await customFetch(
    `${process.env.DIRECTORY_API_URL}/v1/notification/settings/${uid}/investor`,
    {},
    true,
  );

  if (!response?.ok) {
    throw new Error('Failed to fetch investor settings');
  }

  return (await response.json()) as InvestorSettings;
}

export function useGetInvestorSettings(uid: string | undefined, initialData: InvestorSettings) {
  const authToken = Cookies.get('authToken') || '';

  return useQuery({
    queryKey: [MembersQueryKeys.GET_INVESTOR_SETTINGS, uid],
    queryFn: () => fetcher(uid),
    enabled: Boolean(uid) && Boolean(authToken),
    initialData,
    placeholderData: keepPreviousData,
  });
}

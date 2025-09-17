import { useQuery } from '@tanstack/react-query';
import { DemoDayQueryKeys } from '@/services/demo-day/constants';
import { customFetch } from '@/utils/fetch-wrapper';
import { IUserInfo } from '@/types/shared.types';
import { getParsedValue } from '@/utils/common.utils';
import Cookies from 'js-cookie';

type DemoDayState = {
  uid: string;
  access: 'NONE' | 'INVESTOR' | 'FOUNDER';
  date: string;
  title: string;
  description: string;
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

  investorsCount: 1;
  teamsCount: 1;
};

async function fetcher(memberUid?: string) {
  const url = `${process.env.DIRECTORY_API_URL}/v1/demo-days/current?memberUid=${memberUid}`;

  const response = await customFetch(
    url,
    {
      method: 'GET',
    },
    true,
  );

  if (!response?.ok) {
    throw new Error('Failed to fetch demo day status');
  }

  const data: DemoDayState = await response.json();

  return data;
}

export function useGetDemoDayState() {
  const userInfo: IUserInfo = getParsedValue(Cookies.get('userInfo'));
  const authToken = getParsedValue(Cookies.get('authToken'));

  return useQuery({
    queryKey: [DemoDayQueryKeys.GET_DEMO_DAY_STATE, userInfo?.uid],
    queryFn: () => fetcher(userInfo.uid),
    enabled: Boolean(userInfo && authToken),
  });
}

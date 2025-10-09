import { useQuery } from '@tanstack/react-query';
import { DemoDayQueryKeys } from '@/services/demo-day/constants';
import { customFetch } from '@/utils/fetch-wrapper';
import { IUserInfo } from '@/types/shared.types';
import { getParsedValue } from '@/utils/common.utils';
import Cookies from 'js-cookie';

type DemoDayState = {
  uid: string;
  access: 'none' | 'INVESTOR' | 'FOUNDER';
  date: string;
  title: string;
  description: string;
  status: 'NONE' | 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  isDemoDayAdmin: boolean;

  investorsCount: 1;
  teamsCount: 1;
};

export async function getDemoDayState(memberUid?: string) {
  const url = `${process.env.DIRECTORY_API_URL}/v1/demo-days/current${memberUid ? `?memberUid=${memberUid}` : ''}`;

  const response = await customFetch(
    url,
    {
      method: 'GET',
    },
    !!memberUid,
  );

  if (!response?.ok) {
    throw new Error('Failed to fetch demo day status');
  }

  const data: DemoDayState = await response.json();

  return data;
}

export function useGetDemoDayState() {
  const userInfo: IUserInfo = getParsedValue(Cookies.get('userInfo'));

  return useQuery({
    queryKey: [DemoDayQueryKeys.GET_DEMO_DAY_STATE, userInfo?.uid],
    queryFn: () => getDemoDayState(userInfo.uid),
  });
}

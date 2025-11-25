import { useQuery } from '@tanstack/react-query';
import { DemoDayQueryKeys } from '@/services/demo-day/constants';
import { customFetch } from '@/utils/fetch-wrapper';
import { IUserInfo } from '@/types/shared.types';
import { getParsedValue } from '@/utils/common.utils';
import Cookies from 'js-cookie';
import { useParams } from 'next/navigation';

type DemoDayState = {
  uid: string;
  access: 'none' | 'INVESTOR' | 'FOUNDER';
  date: string;
  title: string;
  description: string;
  status: 'NONE' | 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  isDemoDayAdmin: boolean;
  isEarlyAccess?: boolean;
  isPending?: boolean;
  approximateStartDate?: string;
  confidentialityAccepted: boolean;

  investorsCount: number;
  teamsCount: number;
};

export async function getDemoDayState(demoDaySlug: string, memberUid?: string) {
  if (!demoDaySlug) {
    return null;
  }

  const url = `${process.env.DIRECTORY_API_URL}/v1/demo-days/${demoDaySlug}${memberUid ? `?memberUid=${memberUid}` : ''}`;

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

export function useGetDemoDayState(initialData?: any) {
  const userInfo: IUserInfo = getParsedValue(Cookies.get('userInfo'));
  const params = useParams();

  return useQuery({
    queryKey: [DemoDayQueryKeys.GET_DEMO_DAY_STATE, userInfo?.uid],
    queryFn: () => getDemoDayState(params.demoDayId as string, userInfo.uid),
    initialData,
  });
}

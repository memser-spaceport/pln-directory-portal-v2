import { useQuery } from '@tanstack/react-query';
import { DemoDayQueryKeys } from '@/services/demo-day/constants';
import { customFetch } from '@/utils/fetch-wrapper';

type DemoDayState = {
  uid: string;
  access: 'none' | 'investor' | 'founder';
  date: string;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'archived';
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
    throw new Error('Failed to fetch notifications settings');
  }

  const data: DemoDayState = await response.json();

  return data;

  // return {
  //   uid: '123456789',
  //   access: 'founder',
  //   date: new Date().toISOString(),
  //   title: 'PL Demo Day',
  //   description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  //   status: 'pending',
  // };
}

export function useGetDemoDayState(memberUid?: string) {
  return useQuery({
    queryKey: [DemoDayQueryKeys.GET_DEMO_DAY_STATE, memberUid],
    queryFn: () => fetcher(memberUid),
  });
}

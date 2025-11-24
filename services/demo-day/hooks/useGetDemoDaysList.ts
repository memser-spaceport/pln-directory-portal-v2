import { useQuery } from '@tanstack/react-query';
import { DemoDayQueryKeys } from '@/services/demo-day/constants';
import { customFetch } from '@/utils/fetch-wrapper';

export type DemoDayListResponse = {
  access: 'none';
  confidentialityAccepted: boolean;
  date: string;
  description: string;
  investorsCount: number;
  slugURL: string;
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED' | 'REGISTRATION_OPEN';
  teamsCount: number;
  title: string;
};

async function fetcher(): Promise<DemoDayListResponse[]> {
  const url = `${process.env.DIRECTORY_API_URL}/v1/demo-days`;

  const response = await customFetch(url, { method: 'GET' }, false);

  if (!response?.ok) {
    throw new Error('Failed to fetch demo days list');
  }

  const data: DemoDayListResponse[] = await response.json();

  return data;
}

export function useGetDemoDaysList() {
  return useQuery({
    queryKey: [DemoDayQueryKeys.GET_DEMO_DAYS_LIST],
    queryFn: fetcher,
  });
}

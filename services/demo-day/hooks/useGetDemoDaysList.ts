import { useQuery } from '@tanstack/react-query';
import { DemoDayQueryKeys } from '@/services/demo-day/constants';
import { customFetch } from '@/utils/fetch-wrapper';

export type DemoDayListItem = {
  uid: string;
  title: string;
  description: string;
  date: string;
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  teamsCount: number;
  investorsCount: number;
};

type DemoDayListResponse = {
  createdAt: string;
  deletedAt: string | null;
  description: string;
  endDate: string;
  isDeleted: boolean;
  shortDescription: string;
  slugURL: string;
  startDate: string;
  status: DemoDayListItem['status'];
  title: string;
  uid: string;
  updatedAt: string;
};

async function fetcher(): Promise<DemoDayListItem[]> {
  const url = `${process.env.DIRECTORY_API_URL}/v1/demo-days`;

  const response = await customFetch(url, { method: 'GET' }, false);

  if (!response?.ok) {
    throw new Error('Failed to fetch demo days list');
  }

  const data: DemoDayListResponse[] = await response.json();

  return data.map((item) => ({
    uid: item.uid,
    title: item.title,
    description: item.description,
    date: item.startDate,
    status: item.status,
    teamsCount: 0,
    investorsCount: 0,
  }));
}

export function useGetDemoDaysList() {
  return useQuery({
    queryKey: [DemoDayQueryKeys.GET_DEMO_DAYS_LIST],
    queryFn: fetcher,
  });
}

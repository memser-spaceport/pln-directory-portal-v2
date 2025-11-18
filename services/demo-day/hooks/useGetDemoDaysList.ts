import { useQuery } from '@tanstack/react-query';
import { DemoDayQueryKeys } from '@/services/demo-day/constants';

export type DemoDayListItem = {
  uid: string;
  title: string;
  description: string;
  date: string;
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  teamsCount: number;
  investorsCount: number;
};

async function fetcher(): Promise<DemoDayListItem[]> {
  // TODO: Replace with actual API endpoint when backend is ready
  // const url = `${process.env.DIRECTORY_API_URL}/v1/demo-days`;
  // const response = await customFetch(url, { method: 'GET' }, false);
  // if (!response?.ok) {
  //   throw new Error('Failed to fetch demo days list');
  // }
  // return await response.json();

  // Mock data for now
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          uid: 'demo-day-1',
          title: 'LabWeek 25 Demo Day',
          description: 'Join us for an exciting showcase of innovative projects from our latest cohort.',
          date: '2025-02-15T18:00:00Z',
          status: 'UPCOMING',
          teamsCount: 12,
          investorsCount: 45,
        },
        {
          uid: 'demo-day-2',
          title: 'Fall 2024 Demo Day',
          description: 'Discover groundbreaking solutions from our fall cohort teams.',
          date: '2024-11-20T18:00:00Z',
          status: 'ACTIVE',
          teamsCount: 15,
          investorsCount: 52,
        },
        {
          uid: 'demo-day-3',
          title: 'Summer 2024 Demo Day',
          description: 'A showcase of summer innovations and breakthrough technologies.',
          date: '2024-08-10T18:00:00Z',
          status: 'COMPLETED',
          teamsCount: 18,
          investorsCount: 60,
        },
      ]);
    }, 100);
  });
}

export function useGetDemoDaysList() {
  return useQuery({
    queryKey: [DemoDayQueryKeys.GET_DEMO_DAYS_LIST],
    queryFn: fetcher,
  });
}


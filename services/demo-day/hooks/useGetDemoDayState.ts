import { useQuery } from '@tanstack/react-query';
import { DemoDayQueryKeys } from '@/services/demo-day/constants';

type DemoDayState = {
  uid: string;
  access: 'none' | 'investor' | 'founder';
  date: string;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'archived';
};

async function fetcher() {
  return {
    uid: '123456789',
    access: 'founder',
    date: new Date().toISOString(),
    title: 'PL Demo Day',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    status: 'pending',
  };
}

export function useGetDemoDayState() {
  return useQuery({
    queryKey: [DemoDayQueryKeys.GET_DEMO_DAY_STATE],
    queryFn: fetcher,
  });
}

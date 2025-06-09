import { useQuery } from '@tanstack/react-query';
import { EventsQueryKeys } from '@/services/events/constants';

type UpcomingEvent = {
  uid: string;
  name: string;
  logo: string;
  location: string;
  flag: string;
  startDate: string;
  endDate: string;
};

async function fetcher() {
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/irl/events/upcoming`);

  if (!response?.ok) {
    throw new Error('Failed to fetch upcoming events');
  }

  return (await response?.json()) as UpcomingEvent[];
}

export function useUpcomingEvents() {
  return useQuery({
    queryKey: [EventsQueryKeys.GET_UPCOMING_EVENTS],
    queryFn: fetcher,
  });
}

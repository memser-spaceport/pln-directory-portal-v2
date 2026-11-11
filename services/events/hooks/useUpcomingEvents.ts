import { useQuery } from '@tanstack/react-query';
import { EventsQueryKeys } from '@/services/events/constants';

export type UpcomingEvent = {
  uid: string;
  name: string;
  logo: string;
  location: string;
  flag: string;
  startDate: string;
  endDate: string;
  websiteUrl: string;
  /** The event's gathering (LAB-3213). Null when the event has none. */
  locationUid?: string | null;
};

/**
 * Optional narrowing of `GET /v1/irl/events/upcoming` (LAB-3071): events starting within `days`, at most `limit`
 * (the API caps them at 365 and 50), `soonest` first. Without them the endpoint returns every upcoming event, newest
 * first, as it always has.
 */
export type UpcomingEventsParams = { days?: number; limit?: number; sort?: 'soonest' };

async function fetcher(params?: UpcomingEventsParams) {
  const query = new URLSearchParams();
  if (params?.days) query.set('days', String(params.days));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.sort) query.set('sort', params.sort);
  const search = query.toString();
  const response = await fetch(`${process.env.DIRECTORY_API_URL}/v1/irl/events/upcoming${search ? `?${search}` : ''}`);

  if (!response?.ok) {
    throw new Error('Failed to fetch upcoming events');
  }

  return (await response?.json()) as UpcomingEvent[];
}

export function useUpcomingEvents(params?: UpcomingEventsParams, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: params ? [EventsQueryKeys.GET_UPCOMING_EVENTS, params] : [EventsQueryKeys.GET_UPCOMING_EVENTS],
    queryFn: () => fetcher(params),
    enabled: options.enabled ?? true,
  });
}

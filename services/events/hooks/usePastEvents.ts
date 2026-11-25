import { useQuery } from '@tanstack/react-query';

import { EventsQueryKeys } from '@/services/events/constants';
import type { AllEventsItem } from '@/services/events/all-events.types';

const FIVE_MINUTES_MS = 5 * 60_000;

async function fetchPastEvents(): Promise<AllEventsItem[]> {
  const response = await fetch('/api/events/past');
  if (!response.ok) throw new Error(`Past events responded with ${response.status}`);
  const body = await response.json();
  if (!Array.isArray(body?.items)) throw new Error('Past events have an unexpected shape');
  return body.items;
}

/**
 * Every event that has started or soon will, for the All Events page (LAB-3418), which tells the ended ones by its own
 * clock. Asked for once, after the page has loaded, so the page's own HTML never waits for it. A tab shown again does
 * not ask again: an event that ends while the page is open is already here or in the page's own list.
 */
export function usePastEvents(enabled: boolean) {
  return useQuery({
    queryKey: [EventsQueryKeys.PAST_EVENTS],
    queryFn: fetchPastEvents,
    enabled,
    staleTime: FIVE_MINUTES_MS,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

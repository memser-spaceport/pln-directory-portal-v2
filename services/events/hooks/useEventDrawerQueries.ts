import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { useCurrentUserStore } from '@/services/auth/store';
import { EventsQueryKeys } from '@/services/events/constants';
import { EventDetailError, getEventAttendees, getEventDetail, getMyGatheringPlans } from '../event-drawer.service';

export const EVENT_ATTENDEES_PAGE_SIZE = 20;

/**
 * One event for the drawer. Raw response; the drawer maps it (the jest `useQuery` mock ignores `select`).
 * `data` is `null` for a missing or deleted event. A 4xx other than 404 is not retried.
 */
export function useEventDetail(eventUid: string | null | undefined) {
  const { currentUser } = useCurrentUserStore();
  const viewerUid = currentUser?.uid ?? null;

  return useQuery({
    queryKey: [EventsQueryKeys.EVENT_DETAIL, eventUid, viewerUid],
    queryFn: () => getEventDetail(eventUid as string, !!viewerUid),
    enabled: !!eventUid,
    retry: (failureCount, error) =>
      failureCount < 2 && !(error instanceof EventDetailError && error.status !== null && error.status < 500),
  });
}

/** The strict attendee list of one event, 20 at a time, with the BE's search (name, team, project). */
export function useEventAttendees({
  locationUid,
  eventUid,
  search,
  enabled,
}: {
  locationUid: string | null | undefined;
  eventUid: string | null | undefined;
  search: string;
  enabled: boolean;
}) {
  const { currentUser } = useCurrentUserStore();
  const viewerUid = currentUser?.uid ?? null;

  return useInfiniteQuery({
    queryKey: [EventsQueryKeys.EVENT_ATTENDEES, eventUid, search.trim(), viewerUid],
    queryFn: ({ pageParam }) =>
      getEventAttendees({
        locationUid: locationUid as string,
        eventUid: eventUid as string,
        search,
        page: pageParam,
        limit: EVENT_ATTENDEES_PAGE_SIZE,
        withAuth: !!viewerUid,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) => {
      const loaded = pages.reduce((sum, page) => sum + page.rows.length, 0);
      return lastPage.rows.length > 0 && loaded < lastPage.total ? lastPage.page + 1 : undefined;
    },
    enabled: enabled && !!locationUid && !!eventUid,
  });
}

/** The viewer's own rows at a gathering, to prefill and diff the plans step. Needs a signed-in viewer. */
export function useMyGatheringPlans(locationUid: string | null | undefined, enabled = true) {
  const { currentUser } = useCurrentUserStore();
  const viewerUid = currentUser?.uid ?? null;

  return useQuery({
    queryKey: [EventsQueryKeys.MY_GATHERING_PLANS, locationUid, viewerUid],
    queryFn: () => getMyGatheringPlans(locationUid as string, viewerUid as string),
    enabled: enabled && !!viewerUid && !!locationUid,
  });
}

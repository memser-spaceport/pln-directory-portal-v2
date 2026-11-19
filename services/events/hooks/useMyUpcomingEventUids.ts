import { useQuery } from '@tanstack/react-query';

import { useCurrentUserStore } from '@/services/auth/store';
import { EventsQueryKeys } from '@/services/events/constants';

import { getMyUpcomingEventUids } from '../my-upcoming-events.service';

/**
 * The signed-in viewer's own upcoming event uids, for the "Going" marks on Home's rail (LAB-3220).
 *
 * Its own key, so it doesn't depend on the profile's `useMemberEvents` (LAB-3217); it reads the same endpoint and can
 * be folded into that hook later. The drawer's writes invalidate it. Off until there is a viewer, so the token fetch
 * never runs signed out.
 */
export function useMyUpcomingEventUids(enabled: boolean) {
  const { currentUser } = useCurrentUserStore();
  const viewerUid = currentUser?.uid ?? null;

  return useQuery({
    queryKey: [EventsQueryKeys.MY_UPCOMING_EVENT_UIDS, viewerUid],
    queryFn: () => getMyUpcomingEventUids(viewerUid as string),
    enabled: enabled && !!viewerUid,
  });
}

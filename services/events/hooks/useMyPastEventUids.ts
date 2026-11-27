import { useQuery } from '@tanstack/react-query';

import { useCurrentUserStore } from '@/services/auth/store';
import { EventsQueryKeys } from '@/services/events/constants';

import { getMyPastEventUids } from '../my-past-events.service';

/**
 * The ended events the signed-in viewer went to, for the "Went" pills on All Events' Past (LAB-3418). Off until Past is
 * shown and there is a viewer, so the token fetch never runs signed out.
 */
export function useMyPastEventUids(enabled: boolean) {
  const { currentUser } = useCurrentUserStore();
  const viewerUid = currentUser?.uid ?? null;

  return useQuery({
    queryKey: [EventsQueryKeys.MY_PAST_EVENT_UIDS, viewerUid],
    queryFn: () => getMyPastEventUids(viewerUid as string),
    enabled: enabled && !!viewerUid,
  });
}

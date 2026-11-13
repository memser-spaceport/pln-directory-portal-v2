import { useQuery } from '@tanstack/react-query';

import { useCurrentUserStore } from '@/services/auth/store';
import { EventsQueryKeys } from '@/services/events/constants';
import {
  memberEventsUrl,
  normalizeMemberEvents,
  PROFILE_EVENTS_FETCH_LIMIT,
} from '@/services/events/profile-events.service';
import { customFetch } from '@/utils/fetch-wrapper';
import { SHOW_EVENT_DRAWER } from '@/utils/event-drawer';

/** Thrown when the member's events couldn't be loaded; the section then falls back to the server's past list. */
export class MemberEventsError extends Error {
  constructor(readonly status: number | null) {
    super(`Failed to load the member's events${status ? ` (${status})` : ''}`);
    this.name = 'MemberEventsError';
  }
}

async function getMemberEvents(memberUid: string) {
  const response: Response | undefined = await customFetch(
    memberEventsUrl(memberUid, { limit: PROFILE_EVENTS_FETCH_LIMIT }),
    { method: 'GET', cache: 'no-store' },
    true,
  );
  if (!response?.ok) throw new MemberEventsError(response?.status ?? null);
  return normalizeMemberEvents(await response.json());
}

/**
 * A member's upcoming and past events as the signed-in viewer sees them (BE LAB-3215): both groups, every card in one
 * request. Gated on a current user, so `customFetch`'s reload-on-401 can't loop for a signed-out visitor, and on the
 * event drawer flag. Signed-out visitors get the server's past list instead (design D5).
 *
 * `data` is the normalised response, or `null` when it wasn't this endpoint's answer. Callers normalise again: the jest
 * `useQuery` mock returns its own data.
 */
export function useMemberEvents(memberUid: string | null | undefined) {
  const { currentUser } = useCurrentUserStore();
  const viewerUid = currentUser?.uid ?? null;

  return useQuery({
    queryKey: [EventsQueryKeys.MEMBER_EVENTS, memberUid, viewerUid],
    queryFn: () => getMemberEvents(memberUid as string),
    enabled: SHOW_EVENT_DRAWER && !!viewerUid && !!memberUid,
    retry: (failureCount, error) =>
      failureCount < 2 && !(error instanceof MemberEventsError && error.status !== null && error.status < 500),
  });
}

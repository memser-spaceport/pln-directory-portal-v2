import { useQuery } from '@tanstack/react-query';

import { useCurrentUserStore } from '@/services/auth/store';
import { EventsQueryKeys } from '@/services/events/constants';
import {
  normalizeTeamEvents,
  PROFILE_EVENTS_FETCH_LIMIT,
  teamEventsUrl,
} from '@/services/events/profile-events.service';
import { customFetch } from '@/utils/fetch-wrapper';
import { SHOW_EVENT_DRAWER } from '@/utils/event-drawer';

/** Thrown when the team's events couldn't be loaded; the section then keeps the server's past list. */
export class TeamEventsError extends Error {
  constructor(readonly status: number | null) {
    super(`Failed to load the team's events${status ? ` (${status})` : ''}`);
    this.name = 'TeamEventsError';
  }
}

async function getTeamEvents(teamUid: string) {
  const response: Response | undefined = await customFetch(
    teamEventsUrl(teamUid, { limit: PROFILE_EVENTS_FETCH_LIMIT }),
    { method: 'GET', cache: 'no-store' },
    true,
  );
  if (!response?.ok) throw new TeamEventsError(response?.status ?? null);
  return normalizeTeamEvents(await response.json());
}

/**
 * A team's upcoming and past events as the signed-in viewer sees them (BE LAB-3215, LAB-3219): the events its members
 * are going to, its past events and Demo Days, every card in one request. Gated on a current user, so `customFetch`'s
 * reload-on-401 can't loop for a signed-out visitor, and on the event drawer flag. Signed-out visitors get the server's
 * past list instead (design D5).
 *
 * `data` is the normalised response, or `null` when it wasn't this endpoint's answer. Callers normalise again: the jest
 * `useQuery` mock returns its own data.
 */
export function useTeamEvents(teamUid: string | null | undefined) {
  const { currentUser } = useCurrentUserStore();
  const viewerUid = currentUser?.uid ?? null;

  return useQuery({
    queryKey: [EventsQueryKeys.TEAM_EVENTS, teamUid, viewerUid],
    queryFn: () => getTeamEvents(teamUid as string),
    enabled: SHOW_EVENT_DRAWER && !!viewerUid && !!teamUid,
    retry: (failureCount, error) =>
      failureCount < 2 && !(error instanceof TeamEventsError && error.status !== null && error.status < 500),
  });
}

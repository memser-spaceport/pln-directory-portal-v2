import { QueryClient, useMutation, useQueryClient } from '@tanstack/react-query';

import { EventsQueryKeys } from '@/services/events/constants';
import { toEventRolesPayload } from '../event-drawer.mappers';
import { createEventAttendance, removeEventAttendance, updateMyGatheringPlans } from '../event-drawer.service';
import type { CreateEventAttendancePayload, EventRoleName } from '../event-drawer.types';

/** Every key an attendance change can make stale (design D3). */
export const EVENT_DRAWER_INVALIDATED_KEYS = [
  EventsQueryKeys.EVENT_DETAIL,
  EventsQueryKeys.EVENT_ATTENDEES,
  EventsQueryKeys.MY_GATHERING_PLANS,
  EventsQueryKeys.MEMBER_EVENTS,
  EventsQueryKeys.TEAM_EVENTS,
  EventsQueryKeys.MY_UPCOMING_EVENT_UIDS,
] as const;

export function invalidateEventDrawerQueries(queryClient: Pick<QueryClient, 'invalidateQueries'>) {
  return Promise.all(EVENT_DRAWER_INVALIDATED_KEYS.map((key) => queryClient.invalidateQueries({ queryKey: [key] })));
}

/** "Yes, I'm going": one row for one event. */
export function useMarkGoing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ locationUid, payload }: { locationUid: string; payload: CreateEventAttendancePayload }) =>
      createEventAttendance(locationUid, payload),
    onSettled: () => invalidateEventDrawerQueries(queryClient),
  });
}

/** Not going to these events (and only these). */
export function useRemoveGoing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      locationUid,
      memberUid,
      eventUids,
    }: {
      locationUid: string;
      memberUid: string;
      eventUids: string[];
    }) => removeEventAttendance(locationUid, memberUid, eventUids),
    onSettled: () => invalidateEventDrawerQueries(queryClient),
  });
}

export interface UpdateEventPlansShared {
  teamUid: string | null;
  topics: string[];
  reason: string;
  telegramId: string;
  officeHours: string;
  checkInDate: string;
  checkOutDate: string;
}

export interface UpdateEventPlansInput {
  locationUid: string;
  /** The drawer's event: the only row whose role changes. */
  eventUid: string;
  /** Host / Speaker / Sponsor; empty is plain attendance. */
  roles: EventRoleName[];
  /** The stay, topics and details, which the API keeps the same on every row at the gathering. */
  shared: UpdateEventPlansShared;
}

/**
 * "Add your plans" (LAB-3234): one PATCH, in place, for the drawer's event. The member is already going, so nothing is
 * created or deleted, and the member's other events at the gathering keep their roles.
 */
export function updateEventPlans({ locationUid, eventUid, roles, shared }: UpdateEventPlansInput) {
  return updateMyGatheringPlans(locationUid, {
    teamUid: shared.teamUid,
    topics: shared.topics,
    reason: shared.reason,
    telegramId: shared.telegramId,
    officeHours: shared.officeHours,
    additionalInfo: { checkInDate: shared.checkInDate, checkOutDate: shared.checkOutDate },
    events: [toEventRolesPayload(eventUid, roles)],
  });
}

export function useUpdateEventPlans() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateEventPlans,
    onSettled: () => invalidateEventDrawerQueries(queryClient),
  });
}

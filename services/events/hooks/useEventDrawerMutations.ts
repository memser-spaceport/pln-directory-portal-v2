import { QueryClient, useMutation, useQueryClient } from '@tanstack/react-query';

import type { EventRoleSelection } from '@/components/core/UpdatesPanel/IrlGatheringModal/types';
import { EventsQueryKeys } from '@/services/events/constants';
import { diffPlans, toEventRolesPayload } from '../event-drawer.mappers';
import {
  createEventAttendance,
  removeEventAttendance,
  setEventShowOnProfile,
  updateMyGatheringPlans,
} from '../event-drawer.service';
import type { CreateEventAttendancePayload } from '../event-drawer.types';

/** Every key an attendance change can make stale (design D3). */
export const EVENT_DRAWER_INVALIDATED_KEYS = [
  EventsQueryKeys.EVENT_DETAIL,
  EventsQueryKeys.EVENT_ATTENDEES,
  EventsQueryKeys.MY_GATHERING_PLANS,
  EventsQueryKeys.MEMBER_EVENTS,
  EventsQueryKeys.TEAM_EVENTS,
] as const;

export function invalidateEventDrawerQueries(queryClient: Pick<QueryClient, 'invalidateQueries'>) {
  return Promise.all(EVENT_DRAWER_INVALIDATED_KEYS.map((key) => queryClient.invalidateQueries({ queryKey: [key] })));
}

/** "Yes, I'm going": one row for one event, with the "Show on my profile" answer. */
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

/** Show or hide one event on the caller's profile. */
export function useSetShowOnProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventUid, showOnProfile }: { eventUid: string; showOnProfile: boolean }) =>
      setEventShowOnProfile(eventUid, showOnProfile),
    onSettled: () => invalidateEventDrawerQueries(queryClient),
  });
}

export interface SavePlansShared {
  teamUid: string | null;
  topics: string[];
  reason: string;
  telegramId: string;
  officeHours: string;
  checkInDate: string;
  checkOutDate: string;
}

export interface SavePlansInput {
  locationUid: string;
  memberUid: string;
  /** Events at the gathering the member is going to before this save. */
  existing: string[];
  /** Events ticked now. */
  selected: string[];
  /** The gathering's events the picker offered; nothing outside it is created or deleted. */
  pickable: string[];
  eventRoles: EventRoleSelection[];
  shared: SavePlansShared;
  /** For rows this save creates. Existing rows keep their own value. */
  showOnProfile: boolean;
}

export interface SavePlansResult {
  added: string[];
  removed: string[];
  kept: string[];
}

/** A save that stopped part way. `done` lists what was saved before the failure, so a retry doesn't redo it. */
export class SavePlansError extends Error {
  constructor(
    message: string,
    readonly done: { added: string[]; removed: string[] },
  ) {
    super(message);
    this.name = 'SavePlansError';
  }
}

const rolesOf = (eventRoles: EventRoleSelection[], uid: string) =>
  eventRoles.find((r) => r.eventUid === uid)?.roles ?? [];

/**
 * Saving the plans step (design D4): create for added events, PATCH in place for kept ones and the shared details,
 * per-event delete for removed ones. Never PUT, which would recreate every row and reset `showOnProfile`.
 */
export async function savePlans(input: SavePlansInput): Promise<SavePlansResult> {
  const { locationUid, memberUid, shared, eventRoles } = input;
  const { added, removed, kept } = diffPlans(input);
  const done = { added: [] as string[], removed: [] as string[] };

  const run = async (step: () => Promise<void>) => {
    try {
      await step();
    } catch (error) {
      throw new SavePlansError(error instanceof Error ? error.message : 'Failed to save your plans', done);
    }
  };

  if (added.length) {
    await run(() =>
      createEventAttendance(locationUid, {
        memberUid,
        ...(shared.teamUid ? { teamUid: shared.teamUid } : {}),
        telegramId: shared.telegramId,
        reason: shared.reason,
        topics: shared.topics,
        officeHours: shared.officeHours,
        additionalInfo: { checkInDate: shared.checkInDate, checkOutDate: shared.checkOutDate },
        showOnProfile: input.showOnProfile,
        events: added.map((uid) => toEventRolesPayload(uid, rolesOf(eventRoles, uid))),
      }),
    );
    done.added.push(...added);
  }

  if (kept.length) {
    await run(() =>
      updateMyGatheringPlans(locationUid, {
        teamUid: shared.teamUid,
        topics: shared.topics,
        reason: shared.reason,
        telegramId: shared.telegramId,
        officeHours: shared.officeHours,
        additionalInfo: { checkInDate: shared.checkInDate, checkOutDate: shared.checkOutDate },
        events: kept.map((uid) => toEventRolesPayload(uid, rolesOf(eventRoles, uid))),
      }),
    );
  }

  if (removed.length) {
    await run(() => removeEventAttendance(locationUid, memberUid, removed));
    done.removed.push(...removed);
  }

  return { added, removed, kept };
}

export function useSavePlans() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: savePlans,
    onSettled: () => invalidateEventDrawerQueries(queryClient),
  });
}

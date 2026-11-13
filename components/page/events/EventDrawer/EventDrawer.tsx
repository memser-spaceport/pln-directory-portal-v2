'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { formatDateForApi } from '@/components/core/UpdatesPanel/IrlGatheringModal/helpers';
import { toast } from '@/components/core/ToastContainer';
import { useEventsAnalytics, type EventDrawerSource } from '@/analytics/events.analytics';
import { useDebounce } from '@/hooks/useDebounce';
import { useIrlGoingAccess } from '@/services/access-control/hooks/useIrlGoingAccess';
import { useCurrentUserStore } from '@/services/auth/store';
import { EMPTY_PLANS, toEventDetail } from '@/services/events/event-drawer.mappers';
import { useMarkGoing, useRemoveGoing, useUpdateEventPlans } from '@/services/events/hooks/useEventDrawerMutations';
import { useEventAttendees, useEventDetail, useMyGatheringPlans } from '@/services/events/hooks/useEventDrawerQueries';
import { getMember } from '@/services/members.service';
import { MembersQueryKeys } from '@/services/members/constants';
import type { ITeam } from '@/types/teams.types';
import { SHOW_EVENT_DRAWER } from '@/utils/event-drawer';

import type { EventAttendeesState } from './AttendeesModal';
import {
  EventDrawerView,
  type EventDrawerStatus,
  type EventDrawerStep,
  type EventGoingNotice,
  type EventPlansValues,
} from './EventDrawerView';

export interface EventDrawerProps {
  /** The event to show. `null` renders nothing, so a host can keep the element mounted. */
  eventUid: string | null;
  /** Where it was opened from, for analytics. */
  source: EventDrawerSource;
  /** `plans` opens on the "Add your plans" sub-view (the owner's "Edit details"), when the viewer is going. */
  initialStep?: EventDrawerStep;
  onClose: () => void;
  /** The drawer closed after the member said they are going. The host shows "<event> is on your profile." (D8). */
  onGoing?: (notice: EventGoingNotice) => void;
}

/**
 * The event drawer (LAB-3216, option A; one event per drawer since LAB-3234): one IRL event as the PL events app draws
 * it, the going card, the gathering's links, and "Add your plans" (role, stay, topics). Behind
 * `NEXT_PUBLIC_SHOW_EVENT_DRAWER`: with the flag off it never mounts.
 *
 * Each host keeps its own `eventUid` state and renders `<EventDrawer eventUid={uid} … />` (design D2).
 */
export function EventDrawer(props: EventDrawerProps) {
  if (!SHOW_EVENT_DRAWER || !props.eventUid) return null;
  return <EventDrawerContainer key={props.eventUid} {...props} eventUid={props.eventUid} />;
}

function EventDrawerContainer({
  eventUid,
  source,
  initialStep,
  onClose,
  onGoing,
}: EventDrawerProps & { eventUid: string }) {
  const { currentUser } = useCurrentUserStore();
  const viewerUid = currentUser?.uid ?? null;
  const analytics = useEventsAnalytics();

  const detailQuery = useEventDetail(eventUid);
  const event = useMemo(() => (detailQuery.data ? toEventDetail(detailQuery.data) : null), [detailQuery.data]);
  const locationUid = event?.gathering?.uid ?? null;

  const access = useIrlGoingAccess();
  const canMarkGoing = !!viewerUid && access.canWrite && !!locationUid;

  const plansQuery = useMyGatheringPlans(locationUid, canMarkGoing);
  const plans = canMarkGoing ? (plansQuery.data ?? (plansQuery.isError ? EMPTY_PLANS : null)) : null;

  const { data: member } = useQuery({
    queryKey: [MembersQueryKeys.GET_MEMBER, viewerUid, !!currentUser, viewerUid],
    queryFn: () =>
      getMember(
        viewerUid ?? '',
        { with: 'image,skills,location,teamMemberRoles.team' },
        !!currentUser,
        currentUser,
        true,
        true,
      ),
    enabled: canMarkGoing,
    select: (data) => data?.data?.formattedData,
  });
  const memberTeams: ITeam[] = Array.isArray(member?.teams) ? member.teams : [];
  const memberInfo = useMemo(
    () => ({
      teams: memberTeams,
      telegramHandle: (member?.telegramHandle as string | undefined) ?? null,
      officeHours: (member?.officeHours as string | undefined) ?? null,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [member],
  );

  const [attendeesOpen, setAttendeesOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const attendeesQuery = useEventAttendees({ locationUid, eventUid, search: debouncedSearch, enabled: attendeesOpen });
  const attendees: EventAttendeesState = {
    rows: attendeesQuery.data?.pages.flatMap((p) => p.rows) ?? [],
    isLoading: attendeesQuery.isLoading || search !== debouncedSearch,
    isError: attendeesQuery.isError,
    hasNextPage: !!attendeesQuery.hasNextPage,
    isFetchingNextPage: attendeesQuery.isFetchingNextPage,
    fetchNextPage: () => void attendeesQuery.fetchNextPage(),
    search,
    onSearchChange: setSearch,
  };

  const markGoing = useMarkGoing();
  const removeGoing = useRemoveGoing();
  const updatePlans = useUpdateEventPlans();
  const saving = markGoing.isPending || removeGoing.isPending || updatePlans.isPending;

  const openedRef = useRef(false);
  useEffect(() => {
    if (openedRef.current) return;
    openedRef.current = true;
    analytics.onEventDrawerOpened({ eventUid, source });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const status: EventDrawerStatus = detailQuery.isError
    ? 'error'
    : detailQuery.data === null
      ? 'not-found'
      : !event || (!!viewerUid && access.isLoading)
        ? 'loading'
        : 'ready';

  const defaultDates = () => ({
    checkInDate: plans?.checkInDate || (event ? formatDateForApi(new Date(event.startDate)) : ''),
    checkOutDate: plans?.checkOutDate || (event ? formatDateForApi(new Date(event.endDate)) : ''),
  });

  const mainTeamUid = () =>
    plans?.teamUid || memberTeams.find((t) => t.mainTeam)?.id || currentUser?.leadingTeams?.[0] || null;

  const onYes = async () => {
    if (!event || !locationUid || !viewerUid) return false;
    const teamUid = mainTeamUid();
    try {
      await markGoing.mutateAsync({
        locationUid,
        payload: {
          memberUid: viewerUid,
          ...(teamUid ? { teamUid } : {}),
          telegramId: plans?.telegramId || memberInfo.telegramHandle || '',
          officeHours: plans?.officeHours || memberInfo.officeHours || '',
          reason: plans?.reason ?? '',
          topics: plans?.topics ?? [],
          additionalInfo: defaultDates(),
          events: [{ uid: event.uid, isHost: false, isSpeaker: false, isSponsor: false }],
        },
      });
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : 'Failed to save that you are going');
      return false;
    }
    analytics.onEventGoingMarked({ eventUid: event.uid, source });
    return true;
  };

  const onNotGoing = async () => {
    if (!event || !locationUid || !viewerUid) return false;
    try {
      await removeGoing.mutateAsync({ locationUid, memberUid: viewerUid, eventUids: [event.uid] });
    } catch {
      toast.error(`We couldn't mark you as not going to ${event.name}. Try again.`);
      return false;
    }
    analytics.onEventNotGoingMarked({ eventUid: event.uid });
    return true;
  };

  const onSave = async (values: EventPlansValues) => {
    if (!event || !locationUid) return false;
    const dates = values.dateRange
      ? { checkInDate: formatDateForApi(values.dateRange[0]), checkOutDate: formatDateForApi(values.dateRange[1]) }
      : defaultDates();
    try {
      await updatePlans.mutateAsync({
        locationUid,
        eventUid: event.uid,
        roles: values.roles,
        shared: {
          teamUid: values.teamUid,
          topics: values.topics,
          reason: values.reason,
          telegramId: values.telegramId,
          officeHours: values.officeHours,
          ...dates,
        },
      });
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : 'Failed to save your plans');
      return false;
    }
    analytics.onEventPlansSaved({ eventUid: event.uid, roles: values.roles });
    return true;
  };

  return (
    <EventDrawerView
      status={status}
      event={event}
      canMarkGoing={canMarkGoing}
      viewerUid={viewerUid}
      plans={plans}
      member={memberInfo}
      attendees={attendees}
      initialStep={initialStep}
      saving={saving}
      onClose={onClose}
      onRetry={() => void detailQuery.refetch()}
      onAttendeesOpen={() => {
        setAttendeesOpen(true);
        analytics.onEventAttendeesOpened({ eventUid });
      }}
      onYes={onYes}
      onNotGoing={onNotGoing}
      onSave={onSave}
      onGoing={onGoing}
    />
  );
}

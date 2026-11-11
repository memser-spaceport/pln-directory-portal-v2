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
import {
  SavePlansError,
  useMarkGoing,
  useSavePlans,
  useSetShowOnProfile,
} from '@/services/events/hooks/useEventDrawerMutations';
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
  /** `plans` opens on the plans step (e.g. the owner's "Edit details"). A viewer already going always gets it. */
  initialStep?: EventDrawerStep;
  onClose: () => void;
  /**
   * The drawer closed after the member said they are going. The host shows the toast: "<event> is on your
   * profile." when `showOnProfile`, otherwise "You're going to <event>." (design D2, D8).
   */
  onGoing?: (notice: EventGoingNotice) => void;
}

/**
 * The event drawer (LAB-3216, option A): one IRL event as the PL events app draws it, the gathering's links, who is
 * going, "Are you going?" with "Show on my profile", and the plans step. Behind `NEXT_PUBLIC_SHOW_EVENT_DRAWER`:
 * with the flag off it never mounts.
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
  const savePlans = useSavePlans();
  const setShowOnProfile = useSetShowOnProfile();
  const saving = markGoing.isPending || savePlans.isPending || setShowOnProfile.isPending;

  // What this drawer already saved, so a retry after a partial failure (or before the refetch lands) doesn't redo it.
  const markedRef = useRef(new Set<string>());
  const removedRef = useRef(new Set<string>());
  const markedShowRef = useRef(new Map<string, boolean>());

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

  const onYes = async (showOnProfile: boolean) => {
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
          showOnProfile,
          events: [{ uid: event.uid, isHost: false, isSpeaker: false, isSponsor: false }],
        },
      });
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : 'Failed to save that you are going');
      return false;
    }
    markedRef.current.add(event.uid);
    markedShowRef.current.set(event.uid, showOnProfile);
    removedRef.current.delete(event.uid);
    analytics.onEventGoingMarked({ eventUid: event.uid, showOnProfile, source });
    return true;
  };

  const onSave = async (values: EventPlansValues) => {
    if (!event || !locationUid || !viewerUid) return false;
    const existing = Array.from(new Set([...(plans?.eventUids ?? []), ...markedRef.current])).filter(
      (uid) => !removedRef.current.has(uid),
    );
    const pickable = Array.from(new Set([event.uid, ...(event.gathering?.events ?? []).map((ev) => ev.uid)]));
    const dates = values.dateRange
      ? { checkInDate: formatDateForApi(values.dateRange[0]), checkOutDate: formatDateForApi(values.dateRange[1]) }
      : defaultDates();

    try {
      const result = await savePlans.mutateAsync({
        locationUid,
        memberUid: viewerUid,
        existing,
        selected: values.selectedEventUids,
        pickable,
        eventRoles: values.eventRoles,
        showOnProfile: values.showOnProfile,
        shared: {
          teamUid: values.teamUid,
          topics: values.topics,
          reason: values.reason,
          telegramId: values.telegramId,
          officeHours: values.officeHours,
          ...dates,
        },
      });
      result.added.forEach((uid) => {
        markedRef.current.add(uid);
        removedRef.current.delete(uid);
        analytics.onEventGoingMarked({ eventUid: uid, showOnProfile: values.showOnProfile, source });
      });
      result.removed.forEach((uid) => {
        removedRef.current.add(uid);
        markedRef.current.delete(uid);
        analytics.onEventNotGoingMarked({ eventUid: uid });
      });

      // "Show on my profile" for this event, when the member was already going and changed it here.
      const keptCurrent = result.kept.includes(event.uid);
      const currentShow = event.viewer?.showOnProfile ?? markedShowRef.current.get(event.uid) ?? null;
      if (keptCurrent && currentShow !== null && currentShow !== values.showOnProfile) {
        await setShowOnProfile.mutateAsync({ eventUid: event.uid, showOnProfile: values.showOnProfile });
        markedShowRef.current.set(event.uid, values.showOnProfile);
        analytics.onEventShowOnProfileToggled({
          eventUid: event.uid,
          showOnProfile: values.showOnProfile,
          from: 'drawer',
        });
      }

      analytics.onEventPlansSaved({ eventUid: event.uid, eventsCount: values.selectedEventUids.length });
      return true;
    } catch (error) {
      if (error instanceof SavePlansError) {
        error.done.added.forEach((uid) => markedRef.current.add(uid));
        error.done.removed.forEach((uid) => {
          removedRef.current.add(uid);
          markedRef.current.delete(uid);
        });
      }
      toast.error(error instanceof Error && error.message ? error.message : 'Failed to save your plans');
      return false;
    }
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
      onSave={onSave}
      onGoing={onGoing}
    />
  );
}

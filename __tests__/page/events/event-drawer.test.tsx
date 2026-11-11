import React from 'react';
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { EventDrawer } from '@/components/page/events/EventDrawer';
import { GOING_PLANS, NO_PLANS, eventResponse } from '@/components/page/events/EventDrawer/EventDrawer.fixtures';
import { useCurrentUserStore } from '@/services/auth/store';
import { SavePlansError } from '@/services/events/hooks/useEventDrawerMutations';
import type { EventDetailResponse, MyGatheringPlans } from '@/services/events/event-drawer.types';

const flag = { on: true };
jest.mock('@/utils/event-drawer', () => ({
  get SHOW_EVENT_DRAWER() {
    return flag.on;
  },
}));

jest.mock('react-calendar', () => ({ __esModule: true, default: () => <div /> }));

const toastError = jest.fn();
jest.mock('@/components/core/ToastContainer', () => ({ toast: { error: (...a: unknown[]) => toastError(...a) } }));

const analytics = {
  onEventDrawerOpened: jest.fn(),
  onEventGoingMarked: jest.fn(),
  onEventNotGoingMarked: jest.fn(),
  onEventShowOnProfileToggled: jest.fn(),
  onEventPlansSaved: jest.fn(),
  onEventAttendeesOpened: jest.fn(),
};
jest.mock('@/analytics/events.analytics', () => ({ useEventsAnalytics: () => analytics }));

const access = { canWrite: true, canRead: true, isLoading: false, isError: false };
jest.mock('@/services/access-control/hooks/useIrlGoingAccess', () => ({ useIrlGoingAccess: () => access }));

const queries: {
  detail: { data: EventDetailResponse | null | undefined; isError: boolean; refetch: jest.Mock };
  plans: { data: MyGatheringPlans | undefined; isError: boolean };
  attendeesEnabled: boolean[];
} = {
  detail: { data: undefined, isError: false, refetch: jest.fn() },
  plans: { data: undefined, isError: false },
  attendeesEnabled: [],
};
jest.mock('@/services/events/hooks/useEventDrawerQueries', () => ({
  useEventDetail: () => queries.detail,
  useMyGatheringPlans: () => queries.plans,
  useEventAttendees: ({ enabled }: { enabled: boolean }) => {
    queries.attendeesEnabled.push(enabled);
    return {
      data: undefined,
      isLoading: false,
      isError: false,
      hasNextPage: false,
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
    };
  },
}));

const markGoing = { mutateAsync: jest.fn(), isPending: false };
const savePlans = { mutateAsync: jest.fn(), isPending: false };
const setShowOnProfile = { mutateAsync: jest.fn(), isPending: false };
jest.mock('@/services/events/hooks/useEventDrawerMutations', () => ({
  ...jest.requireActual('@/services/events/hooks/useEventDrawerMutations'),
  useMarkGoing: () => markGoing,
  useSavePlans: () => savePlans,
  useSetShowOnProfile: () => setShowOnProfile,
}));

const yes = () => screen.getByRole('button', { name: "Yes, I'm going" });

async function click(el: HTMLElement) {
  await act(async () => {
    fireEvent.click(el);
  });
}

describe('EventDrawer (LAB-3216)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    flag.on = true;
    access.canWrite = true;
    access.isLoading = false;
    queries.detail = { data: eventResponse(), isError: false, refetch: jest.fn() };
    queries.plans = { data: NO_PLANS, isError: false };
    queries.attendeesEnabled = [];
    useCurrentUserStore.setState({ currentUser: { uid: 'viewer-1', name: 'Maya', leadingTeams: [] } as never });
    markGoing.mutateAsync.mockResolvedValue(undefined);
    savePlans.mutateAsync.mockImplementation(async ({ existing, selected }) => ({
      added: selected.filter((u: string) => !existing.includes(u)),
      removed: existing.filter((u: string) => !selected.includes(u)),
      kept: selected.filter((u: string) => existing.includes(u)),
    }));
    setShowOnProfile.mutateAsync.mockResolvedValue(undefined);
  });

  it('Flag off: the drawer never mounts', () => {
    flag.on = false;
    const { container } = render(<EventDrawer eventUid="labweek-lisbon" source="home" onClose={jest.fn()} />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText('EVENT DETAILS')).not.toBeInTheDocument();
    expect(analytics.onEventDrawerOpened).not.toHaveBeenCalled();
  });

  it('renders nothing without an event', () => {
    render(<EventDrawer eventUid={null} source="home" onClose={jest.fn()} />);
    expect(screen.queryByText('EVENT DETAILS')).not.toBeInTheDocument();
  });

  it('Flag on: opens on the event and records where from, once', () => {
    const { rerender } = render(<EventDrawer eventUid="labweek-lisbon" source="member-profile" onClose={jest.fn()} />);
    rerender(<EventDrawer eventUid="labweek-lisbon" source="member-profile" onClose={jest.fn()} />);
    expect(screen.getByRole('heading', { name: 'LabWeek Lisbon' })).toBeInTheDocument();
    expect(analytics.onEventDrawerOpened).toHaveBeenCalledTimes(1);
    expect(analytics.onEventDrawerOpened).toHaveBeenCalledWith({
      eventUid: 'labweek-lisbon',
      source: 'member-profile',
    });
  });

  it('Event no longer available (404)', () => {
    queries.detail = { data: null, isError: false, refetch: jest.fn() };
    render(<EventDrawer eventUid="gone" source="home" onClose={jest.fn()} />);
    expect(screen.getByText('This event is no longer available')).toBeInTheDocument();
  });

  it('a failed fetch shows the error state and retries', () => {
    queries.detail = { data: undefined, isError: true, refetch: jest.fn() };
    render(<EventDrawer eventUid="ev" source="home" onClose={jest.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(queries.detail.refetch).toHaveBeenCalled();
  });

  it('signed out: the event and attendees, no question', () => {
    useCurrentUserStore.setState({ currentUser: null as never });
    render(<EventDrawer eventUid="labweek-lisbon" source="home" onClose={jest.fn()} />);
    expect(screen.getByRole('button', { name: '40 People going' })).toBeInTheDocument();
    expect(screen.queryByText(/Are you going/)).not.toBeInTheDocument();
  });

  it('Member without attendance permission', () => {
    access.canWrite = false;
    render(<EventDrawer eventUid="labweek-lisbon" source="home" onClose={jest.fn()} />);
    expect(screen.queryByRole('button', { name: "Yes, I'm going" })).not.toBeInTheDocument();
  });

  it('Going from Home: saves this one event with the checkbox value and records it', async () => {
    render(<EventDrawer eventUid="labweek-lisbon" source="home" onClose={jest.fn()} />);
    await click(yes());

    expect(markGoing.mutateAsync).toHaveBeenCalledWith({
      locationUid: 'loc-lisbon',
      payload: expect.objectContaining({
        memberUid: 'viewer-1',
        showOnProfile: true,
        officeHours: '',
        additionalInfo: { checkInDate: '2030-12-01', checkOutDate: '2030-12-05' },
        events: [{ uid: 'labweek-lisbon', isHost: false, isSpeaker: false, isSponsor: false }],
      }),
    });
    expect(analytics.onEventGoingMarked).toHaveBeenCalledWith({
      eventUid: 'labweek-lisbon',
      showOnProfile: true,
      source: 'home',
    });
    expect(screen.getByText(/Thanks for confirming/)).toBeInTheDocument();
  });

  it('Other events at the same gathering are kept: "Yes" creates only this event', async () => {
    queries.plans = {
      data: { ...NO_PLANS, eventUids: ['libp2p-day'], eventRoles: [{ eventUid: 'libp2p-day', roles: ['Attendee'] }] },
      isError: false,
    };
    render(<EventDrawer eventUid="labweek-lisbon" source="home" onClose={jest.fn()} />);
    await click(yes());
    const { payload } = markGoing.mutateAsync.mock.calls[0][0];
    expect(payload.events.map((e: { uid: string }) => e.uid)).toEqual(['labweek-lisbon']);
  });

  it('Saving fails: an error toast, and the question stays', async () => {
    markGoing.mutateAsync.mockRejectedValue(new Error('Boom'));
    render(<EventDrawer eventUid="labweek-lisbon" source="home" onClose={jest.fn()} />);
    await click(yes());
    expect(toastError).toHaveBeenCalledWith('Boom');
    expect(screen.getByText('Are you going to LabWeek Lisbon?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '40 People going' })).toBeInTheDocument();
    expect(analytics.onEventGoingMarked).not.toHaveBeenCalled();
  });

  it('Saving the plans after a yes: the new event counts as existing, then tells the host', async () => {
    const onClose = jest.fn();
    const onGoing = jest.fn();
    render(<EventDrawer eventUid="labweek-lisbon" source="home" onClose={onClose} onGoing={onGoing} />);
    await click(yes());
    await click(screen.getByRole('button', { name: 'Save' }));

    expect(savePlans.mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        locationUid: 'loc-lisbon',
        memberUid: 'viewer-1',
        existing: ['labweek-lisbon'],
        selected: ['labweek-lisbon'],
        pickable: ['labweek-lisbon', 'libp2p-day', 'lisbon-founders-day'],
        showOnProfile: true,
      }),
    );
    expect(analytics.onEventPlansSaved).toHaveBeenCalledWith({ eventUid: 'labweek-lisbon', eventsCount: 1 });
    expect(setShowOnProfile.mutateAsync).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
    expect(onGoing).toHaveBeenCalledWith({ eventName: 'LabWeek Lisbon', showOnProfile: true });
  });

  it('a partly failed save toasts, keeps the drawer, and a retry does not recreate what was saved', async () => {
    queries.detail = {
      data: eventResponse({ viewerGoing: true, viewer: { showOnProfile: true, roles: [] } }),
      isError: false,
      refetch: jest.fn(),
    };
    queries.plans = {
      data: {
        ...GOING_PLANS,
        eventUids: ['labweek-lisbon'],
        eventRoles: [{ eventUid: 'labweek-lisbon', roles: ['Attendee'] }],
      },
      isError: false,
    };
    savePlans.mutateAsync.mockRejectedValueOnce(new SavePlansError('Half way', { added: ['libp2p-day'], removed: [] }));
    const onClose = jest.fn();
    render(<EventDrawer eventUid="labweek-lisbon" source="home" onClose={onClose} />);

    await click(screen.getByRole('button', { name: 'Save' }));
    expect(toastError).toHaveBeenCalledWith('Half way');
    expect(onClose).not.toHaveBeenCalled();

    await click(screen.getByRole('button', { name: 'Save' }));
    expect(savePlans.mutateAsync.mock.calls[1][0].existing).toEqual(['labweek-lisbon', 'libp2p-day']);
  });

  it('changing "Show on my profile" on an event the member is going to toggles it', async () => {
    queries.detail = {
      data: eventResponse({ viewerGoing: true, viewer: { showOnProfile: true, roles: [] } }),
      isError: false,
      refetch: jest.fn(),
    };
    queries.plans = {
      data: {
        ...GOING_PLANS,
        eventUids: ['labweek-lisbon'],
        eventRoles: [{ eventUid: 'labweek-lisbon', roles: ['Attendee'] }],
      },
      isError: false,
    };
    const onGoing = jest.fn();
    render(<EventDrawer eventUid="labweek-lisbon" source="member-profile" onClose={jest.fn()} onGoing={onGoing} />);

    fireEvent.click(screen.getByRole('checkbox', { name: 'Show on my profile' }));
    await click(screen.getByRole('button', { name: 'Save' }));

    expect(setShowOnProfile.mutateAsync).toHaveBeenCalledWith({ eventUid: 'labweek-lisbon', showOnProfile: false });
    expect(analytics.onEventShowOnProfileToggled).toHaveBeenCalledWith({
      eventUid: 'labweek-lisbon',
      showOnProfile: false,
      from: 'drawer',
    });
    expect(onGoing).not.toHaveBeenCalled();
  });

  it('records not-going for events the save removed', async () => {
    queries.detail = {
      data: eventResponse({ viewerGoing: true, viewer: { showOnProfile: true, roles: [] } }),
      isError: false,
      refetch: jest.fn(),
    };
    queries.plans = { data: GOING_PLANS, isError: false };
    savePlans.mutateAsync.mockResolvedValue({ added: [], removed: ['libp2p-day'], kept: ['labweek-lisbon'] });
    render(<EventDrawer eventUid="labweek-lisbon" source="home" onClose={jest.fn()} />);
    await click(screen.getByRole('button', { name: 'Save' }));
    expect(analytics.onEventNotGoingMarked).toHaveBeenCalledWith({ eventUid: 'libp2p-day' });
  });

  it('loads the attendee list only once it is opened, and records it', () => {
    render(<EventDrawer eventUid="labweek-lisbon" source="home" onClose={jest.fn()} />);
    expect(queries.attendeesEnabled.every((e) => e === false)).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: '40 People going' }));
    expect(queries.attendeesEnabled[queries.attendeesEnabled.length - 1]).toBe(true);
    expect(analytics.onEventAttendeesOpened).toHaveBeenCalledWith({ eventUid: 'labweek-lisbon' });
  });
});

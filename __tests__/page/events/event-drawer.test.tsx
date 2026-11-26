import React from 'react';
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { EventDrawer } from '@/components/page/events/EventDrawer';
import { GOING_PLANS, NO_PLANS, eventResponse } from '@/components/page/events/EventDrawer/EventDrawer.fixtures';
import { useCurrentUserStore } from '@/services/auth/store';
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
  onEventPlansSaved: jest.fn(),
  onEventAttendeesOpened: jest.fn(),
  onEventDrawerStepped: jest.fn(),
  onEventLinkCopied: jest.fn(),
  onEventEventsAppOpened: jest.fn(),
};
jest.mock('@/analytics/events.analytics', () => ({ useEventsAnalytics: () => analytics }));

const access = { canWrite: true, canRead: true, isLoading: false, isError: false };
jest.mock('@/services/access-control/hooks/useIrlGoingAccess', () => ({ useIrlGoingAccess: () => access }));

const queries: {
  detail: { data: EventDetailResponse | null | undefined; isError: boolean; refetch: jest.Mock };
  detailOptions?: { anonymous?: boolean };
  plans: { data: MyGatheringPlans | undefined; isError: boolean };
  attendeesEnabled: boolean[];
} = {
  detail: { data: undefined, isError: false, refetch: jest.fn() },
  plans: { data: undefined, isError: false },
  attendeesEnabled: [],
};
jest.mock('@/services/events/hooks/useEventDrawerQueries', () => ({
  useEventDetail: (_uid: string, options?: { anonymous?: boolean }) => {
    queries.detailOptions = options;
    return queries.detail;
  },
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
const removeGoing = { mutateAsync: jest.fn(), isPending: false };
const updatePlans = { mutateAsync: jest.fn(), isPending: false };
jest.mock('@/services/events/hooks/useEventDrawerMutations', () => ({
  ...jest.requireActual('@/services/events/hooks/useEventDrawerMutations'),
  useMarkGoing: () => markGoing,
  useRemoveGoing: () => removeGoing,
  useUpdateEventPlans: () => updatePlans,
}));

const goToLogin = jest.fn();
jest.mock('@/components/core/login/utils/loginRedirect', () => ({ useLoginRedirect: () => goToLogin }));

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
    removeGoing.mutateAsync.mockResolvedValue(undefined);
    updatePlans.mutateAsync.mockResolvedValue(undefined);
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

  it('signed out: the event and attendees, and the card asks (its "Yes" starts sign-in, LAB-3361)', () => {
    useCurrentUserStore.setState({ currentUser: null as never });
    render(<EventDrawer eventUid="labweek-lisbon" source="home" onClose={jest.fn()} />);
    expect(screen.getByRole('button', { name: '40 members going' })).toBeInTheDocument();
    expect(screen.getByText('Are you going?')).toBeInTheDocument();
  });

  it('signed out: "Yes, I\'m going" starts sign-in with the drawer still open, and saves nothing (LAB-3368)', async () => {
    useCurrentUserStore.setState({ currentUser: null as never });
    const onClose = jest.fn();
    render(<EventDrawer eventUid="labweek-lisbon" source="home" onClose={onClose} />);
    await click(yes());
    expect(goToLogin).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
    expect(markGoing.mutateAsync).not.toHaveBeenCalled();
  });

  it('signed out: the going count starts sign-in too, with the drawer still open (LAB-3371)', async () => {
    useCurrentUserStore.setState({ currentUser: null as never });
    const onClose = jest.fn();
    render(<EventDrawer eventUid="labweek-lisbon" source="home" onClose={onClose} />);
    await click(await screen.findByRole('button', { name: '40 members going' }));
    expect(goToLogin).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('Member without attendance permission', () => {
    access.canWrite = false;
    render(<EventDrawer eventUid="labweek-lisbon" source="home" onClose={jest.fn()} />);
    expect(screen.queryByRole('button', { name: "Yes, I'm going" })).not.toBeInTheDocument();
  });

  it('Going from Home: saves this one event, always shown, and records it', async () => {
    render(<EventDrawer eventUid="labweek-lisbon" source="home" onClose={jest.fn()} />);
    await click(yes());

    expect(markGoing.mutateAsync).toHaveBeenCalledWith({
      locationUid: 'loc-lisbon',
      payload: expect.objectContaining({
        memberUid: 'viewer-1',
        officeHours: '',
        additionalInfo: { checkInDate: '2030-12-01', checkOutDate: '2030-12-05' },
        events: [{ uid: 'labweek-lisbon', isHost: false, isSpeaker: false, isSponsor: false }],
      }),
    });
    expect(markGoing.mutateAsync.mock.calls[0][0].payload).not.toHaveProperty('showOnProfile');
    expect(analytics.onEventGoingMarked).toHaveBeenCalledWith({ eventUid: 'labweek-lisbon', source: 'home' });
    expect(screen.getByText("You're going")).toBeInTheDocument();
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
    expect(screen.getByText('Are you going?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '40 members going' })).toBeInTheDocument();
    expect(analytics.onEventGoingMarked).not.toHaveBeenCalled();
  });

  it('closing after a yes tells the host', async () => {
    const onClose = jest.fn();
    const onGoing = jest.fn();
    render(<EventDrawer eventUid="labweek-lisbon" source="home" onClose={onClose} onGoing={onGoing} />);
    await click(yes());
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalled();
    expect(onGoing).toHaveBeenCalledWith({ eventName: 'LabWeek Lisbon' });
  });

  describe('already going', () => {
    beforeEach(() => {
      queries.detail = {
        data: eventResponse({ viewerGoing: true, viewer: { showOnProfile: true, roles: [] } }),
        isError: false,
        refetch: jest.fn(),
      };
      queries.plans = { data: GOING_PLANS, isError: false };
    });

    it('"Mark as not going" removes this event only, and records it', async () => {
      render(<EventDrawer eventUid="labweek-lisbon" source="home" onClose={jest.fn()} />);
      await click(screen.getByRole('button', { name: 'Mark as not going' }));
      expect(removeGoing.mutateAsync).toHaveBeenCalledWith({
        locationUid: 'loc-lisbon',
        memberUid: 'viewer-1',
        eventUids: ['labweek-lisbon'],
      });
      expect(analytics.onEventNotGoingMarked).toHaveBeenCalledWith({ eventUid: 'labweek-lisbon' });
      expect(screen.getByText('Are you going?')).toBeInTheDocument();
    });

    it('a failed "Mark as not going" toasts and keeps "You\'re going"', async () => {
      removeGoing.mutateAsync.mockRejectedValue(new Error('nope'));
      render(<EventDrawer eventUid="labweek-lisbon" source="home" onClose={jest.fn()} />);
      await click(screen.getByRole('button', { name: 'Mark as not going' }));
      expect(toastError).toHaveBeenCalledWith("We couldn't mark you as not going to LabWeek Lisbon. Try again.");
      expect(analytics.onEventNotGoingMarked).not.toHaveBeenCalled();
      expect(screen.getByText("You're going")).toBeInTheDocument();
    });

    it('Save in "Add your plans": one PATCH with this event\'s role and the shared plans', async () => {
      render(<EventDrawer eventUid="labweek-lisbon" source="member-profile" onClose={jest.fn()} initialStep="plans" />);
      fireEvent.click(screen.getByRole('button', { name: 'Speaker' }));
      await click(screen.getByRole('button', { name: 'Save' }));

      expect(updatePlans.mutateAsync).toHaveBeenCalledTimes(1);
      expect(updatePlans.mutateAsync).toHaveBeenCalledWith({
        locationUid: 'loc-lisbon',
        eventUid: 'labweek-lisbon',
        roles: ['Speaker'],
        shared: {
          teamUid: null,
          topics: ['AI'],
          reason: 'Happy to talk storage.',
          telegramId: '@mayaokonkwo',
          officeHours: '',
          checkInDate: '2030-12-01',
          checkOutDate: '2030-12-05',
        },
      });
      expect(markGoing.mutateAsync).not.toHaveBeenCalled();
      expect(removeGoing.mutateAsync).not.toHaveBeenCalled();
      expect(analytics.onEventPlansSaved).toHaveBeenCalledWith({ eventUid: 'labweek-lisbon', roles: ['Speaker'] });
      expect(screen.getByText("You're going")).toBeInTheDocument();
    });

    it('a failed plans save toasts and keeps the plans open', async () => {
      updatePlans.mutateAsync.mockRejectedValue(new Error('Half way'));
      render(<EventDrawer eventUid="labweek-lisbon" source="home" onClose={jest.fn()} initialStep="plans" />);
      await click(screen.getByRole('button', { name: 'Save' }));
      expect(toastError).toHaveBeenCalledWith('Half way');
      expect(analytics.onEventPlansSaved).not.toHaveBeenCalled();
      expect(screen.getByRole('heading', { name: 'Your plans for Lisbon' })).toBeInTheDocument();
    });
  });

  it('loads the attendee list only once it is opened, and records it', () => {
    render(<EventDrawer eventUid="labweek-lisbon" source="home" onClose={jest.fn()} />);
    expect(queries.attendeesEnabled.every((e) => e === false)).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: '40 members going' }));
    expect(queries.attendeesEnabled[queries.attendeesEnabled.length - 1]).toBe(true);
    expect(analytics.onEventAttendeesOpened).toHaveBeenCalledWith({ eventUid: 'labweek-lisbon' });
  });
});

jest.mock('@/services/member-signals/member-signals.service', () => ({
  ...jest.requireActual('@/services/member-signals/member-signals.service'),
  recordMemberSignal: jest.fn(),
}));
const mockRecordSignal = require('@/services/member-signals/member-signals.service').recordMemberSignal as jest.Mock;

describe('EventDrawer member signals (LAB-3267)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    flag.on = true;
    queries.detail = { data: eventResponse(), isError: false, refetch: jest.fn() };
    queries.plans = { data: NO_PLANS, isError: false };
    useCurrentUserStore.setState({ currentUser: { uid: 'viewer-1', name: 'Maya', leadingTeams: [] } as never });
  });

  it('opening the drawer records one view of the event', () => {
    const { rerender } = render(<EventDrawer eventUid="labweek-lisbon" source="home" onClose={jest.fn()} />);
    rerender(<EventDrawer eventUid="labweek-lisbon" source="home" onClose={jest.fn()} />);

    expect(mockRecordSignal).toHaveBeenCalledTimes(1);
    expect(mockRecordSignal).toHaveBeenCalledWith({ action: 'view', entityType: 'event', entityId: 'labweek-lisbon' });
  });

  it('records nothing while the drawer is switched off', () => {
    flag.on = false;
    render(<EventDrawer eventUid="labweek-lisbon" source="home" onClose={jest.fn()} />);

    expect(mockRecordSignal).not.toHaveBeenCalled();
  });

  describe('LAB-3361: previous / next and the toolbar', () => {
    it('steps to the next event in the list: records it and asks the host to open it', () => {
      const onNavigate = jest.fn();
      render(
        <EventDrawer
          eventUid="labweek-lisbon"
          source="all-events"
          onClose={jest.fn()}
          sequence={['labweek-lisbon', 'next-one']}
          onNavigate={onNavigate}
        />,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Next event' }));
      expect(onNavigate).toHaveBeenCalledWith('next-one');
      expect(analytics.onEventDrawerStepped).toHaveBeenCalledWith({
        eventUid: 'next-one',
        direction: 'next',
        source: 'all-events',
      });
    });

    it('a host without onNavigate gets no previous / next', () => {
      render(
        <EventDrawer eventUid="labweek-lisbon" source="home" onClose={jest.fn()} sequence={['labweek-lisbon', 'b']} />,
      );
      expect(screen.queryByRole('button', { name: 'Next event' })).not.toBeInTheDocument();
    });

    it('records Copy link', async () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: jest.fn(async () => {}) },
        configurable: true,
      });
      render(<EventDrawer eventUid="labweek-lisbon" source="home" onClose={jest.fn()} />);
      await click(screen.getByRole('button', { name: 'Copy link' }));
      expect(analytics.onEventLinkCopied).toHaveBeenCalledWith({ eventUid: 'labweek-lisbon' });
    });
  });
});

describe('EventDrawer in the embed (LAB-3392)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    flag.on = true;
    access.canWrite = true;
    access.isLoading = false;
    queries.detail = { data: eventResponse(), isError: false, refetch: jest.fn() };
    queries.plans = { data: NO_PLANS, isError: false };
    queries.attendeesEnabled = [];
    // The Embed dialog's preview is LabOS framing itself, so a member may well be signed in.
    useCurrentUserStore.setState({ currentUser: { uid: 'viewer-1', name: 'Maya', leadingTeams: [] } as never });
  });

  const renderEmbed = () => render(<EventDrawer embed eventUid="labweek-lisbon" source="embed" onClose={jest.fn()} />);

  it('reads the event signed out and asks with "RSVP on LabOS", in a new tab', () => {
    renderEmbed();
    expect(queries.detailOptions).toEqual({ anonymous: true });
    expect(screen.getByText('Are you going?')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: "Yes, I'm going" })).toBeNull();
    const rsvp = screen.getByRole('link', { name: /RSVP on LabOS/ });
    expect(rsvp).toHaveAttribute('href', '/events/all?event=labweek-lisbon');
    expect(rsvp).toHaveAttribute('target', '_blank');
    expect(rsvp).toHaveAttribute('rel', 'noopener noreferrer');
    expect(analytics.onEventDrawerOpened).toHaveBeenCalledWith({ eventUid: 'labweek-lisbon', source: 'embed' });
  });

  it('shows who is going as text: no sign-in, no attendee list', () => {
    renderEmbed();
    expect(screen.getByText('40 members going')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '40 members going' })).toBeNull();
    expect(goToLogin).not.toHaveBeenCalled();
    expect(queries.attendeesEnabled.every((e) => e === false)).toBe(true);
  });

  it('has no "Open in PL Events" in the embed either, with the app address and the event id (LAB-3420)', () => {
    const original = process.env.PL_EVENTS_BASE_URL;
    process.env.PL_EVENTS_BASE_URL = 'https://events.test';
    try {
      renderEmbed();
      expect(screen.getByRole('button', { name: 'Copy link' })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /PL Events/ })).toBeNull();
      expect(document.querySelector('a[href^="https://events.test"]')).toBeNull();
      expect(analytics.onEventEventsAppOpened).not.toHaveBeenCalled();
    } finally {
      if (original === undefined) delete process.env.PL_EVENTS_BASE_URL;
      else process.env.PL_EVENTS_BASE_URL = original;
    }
  });

  it("records no member signal: a view inside another site's embed is nobody's", () => {
    renderEmbed();
    expect(mockRecordSignal).not.toHaveBeenCalled();
  });
});

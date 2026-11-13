/**
 * LAB-3218: the owner's controls in the member Events section. Scenarios from the `profiles` spec delta of
 * `openspec/changes/lab-3211-event-drawer-and-profile-events`; copy strings are sentinels (design D8).
 */
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockDrawer = jest.fn();
jest.mock('@/components/page/events/EventDrawer', () => ({
  ...jest.requireActual('@/components/page/events/EventDrawer/toast'),
  EventDrawer: (props: {
    eventUid: string | null;
    source: string;
    initialStep?: string;
    onGoing?: (notice: unknown) => void;
  }) => {
    mockDrawer(props);
    return props.eventUid ? (
      <div data-testid={`event-drawer-${props.source}`}>
        {props.eventUid} at {props.initialStep ?? 'start'}
        <button onClick={() => props.onGoing?.({ eventName: 'IPFS Camp' })}>{"Yes, I'm going"}</button>
      </div>
    ) : null;
  },
}));

const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();
jest.mock('@/components/core/ToastContainer', () => ({
  toast: { success: (text: string) => mockToastSuccess(text), error: (text: string) => mockToastError(text) },
}));

const mockCapture = jest.fn();
jest.mock('posthog-js/react', () => ({ usePostHog: () => ({ capture: mockCapture }) }));

let mockCanWrite = true;
jest.mock('@/services/access-control/hooks/useIrlGoingAccess', () => ({
  useIrlGoingAccess: () => ({ canRead: true, canWrite: mockCanWrite, isLoading: false, isError: false }),
}));

type MutateOptions = { onSuccess?: () => void; onError?: (e: Error) => void; onSettled?: () => void };
let mockMutationOutcome: 'success' | 'error' = 'success';
const settle = (options?: MutateOptions) => {
  if (mockMutationOutcome === 'success') options?.onSuccess?.();
  else options?.onError?.(new Error('nope'));
  options?.onSettled?.();
};
const mockRemove = jest.fn((_vars: unknown, options?: MutateOptions) => settle(options));
jest.mock('@/services/events/hooks/useEventDrawerMutations', () => ({
  useRemoveGoing: () => ({ mutate: mockRemove, isPending: false }),
}));

jest.mock('@/services/events/hooks/useMyUpcomingEventUids', () => ({
  useMyUpcomingEventUids: () => ({ data: ['up-3'] }),
}));

const mockUpcomingEvents = jest.fn();
jest.mock('@/services/events/hooks/useUpcomingEvents', () => ({
  useUpcomingEvents: (...args: unknown[]) => mockUpcomingEvents(...args),
}));

import {
  OwnerMemberEventsSection,
  type OwnerMemberEventsSectionProps,
} from '@/components/page/member-details/MemberEventsSection';
import {
  memberEvent,
  PAST,
  UPCOMING,
} from '@/components/page/member-details/MemberEventsSection/MemberEventsSection.fixtures';

const upcomingEvent = (uid: string, name: string, location: string, startDate: string) => ({
  uid,
  name,
  location,
  startDate,
  endDate: startDate,
  logo: '',
  flag: '',
  websiteUrl: '',
  locationUid: `loc-${uid}`,
});

const CATALOGUE = [
  upcomingEvent('up-1', 'FIL Berlin', 'Berlin, Germany', '2026-11-18T00:00:00.000Z'),
  upcomingEvent('up-3', 'Hidden Summit', 'Lisbon, Portugal', '2026-11-25T00:00:00.000Z'),
  upcomingEvent('ev-camp', 'IPFS Camp', 'Lisbon, Portugal', '2027-01-15T00:00:00.000Z'),
  upcomingEvent('ev-denver', 'ETHDenver', 'Denver, USA', '2027-02-20T00:00:00.000Z'),
];

const renderSection = (props: Partial<OwnerMemberEventsSectionProps> = {}) =>
  render(
    <OwnerMemberEventsSection
      memberUid="me"
      firstName="Ana"
      upcoming={UPCOMING}
      upcomingTotal={UPCOMING.length}
      past={PAST}
      pastTotal={PAST.length}
      {...props}
    />,
  );

const captured = (name: string) =>
  mockCapture.mock.calls.filter(([event]) => event === name).map(([, params]) => params);

const openMenu = (eventName: string) =>
  fireEvent.click(screen.getByRole('button', { name: `Actions for ${eventName}` }));
const menuItems = () => screen.getAllByRole('menuitem').map((item) => item.textContent);

beforeEach(() => {
  jest.clearAllMocks();
  mockCanWrite = true;
  mockMutationOutcome = 'success';
  mockUpcomingEvents.mockReturnValue({ data: CATALOGUE, isLoading: false, isError: false });
});

describe('OwnerMemberEventsSection (LAB-3218)', () => {
  describe('Add event', () => {
    it('Owner adds an event: picker without the events they have, search, then the drawer from add-event', async () => {
      renderSection();
      fireEvent.click(screen.getByRole('button', { name: 'Add event' }));

      const dialog = screen.getByRole('heading', { name: "Add an event you're going to" }).closest('div')!;
      expect(dialog).toBeInTheDocument();
      expect(mockUpcomingEvents).toHaveBeenLastCalledWith({ days: 365, limit: 50, sort: 'soonest' }, { enabled: true });

      // FIL Berlin is on the profile and Hidden Summit is in the viewer's own list: both are left out.
      const list = screen.getByRole('list', { name: 'Upcoming events' });
      const names = within(list)
        .getAllByRole('button')
        .map((b) => b.textContent);
      expect(names).toEqual(['IPFS Camp', 'ETHDenver']);
      // A one-day event's meta is just the city: the tile already says the day.
      expect(within(list).getByText('Lisbon')).toBeInTheDocument();

      fireEvent.change(screen.getByPlaceholderText('Search by event or city'), { target: { value: 'lisbon' } });
      expect(
        within(list)
          .getAllByRole('button')
          .map((b) => b.textContent),
      ).toEqual(['IPFS Camp']);

      fireEvent.change(screen.getByPlaceholderText('Search by event or city'), { target: { value: 'nowhere' } });
      expect(within(list).getByText('No upcoming events match that search.')).toBeInTheDocument();

      fireEvent.change(screen.getByPlaceholderText('Search by event or city'), { target: { value: 'camp' } });
      fireEvent.click(within(list).getByRole('button', { name: 'IPFS Camp' }));

      expect(screen.getByTestId('event-drawer-add-event')).toHaveTextContent('ev-camp at start');
      // The picker steps aside (after its exit animation) for the drawer.
      await waitFor(() =>
        expect(screen.queryByRole('heading', { name: "Add an event you're going to" })).not.toBeInTheDocument(),
      );

      fireEvent.click(screen.getByRole('button', { name: "Yes, I'm going" }));
      expect(mockToastSuccess).toHaveBeenCalledWith('IPFS Camp is on your profile.');

      expect(captured('profile-event-add-clicked')).toEqual([expect.objectContaining({ from: 'header' })]);
    });

    it('says so when the owner already has every upcoming event', () => {
      mockUpcomingEvents.mockReturnValue({ data: CATALOGUE.slice(0, 2), isLoading: false, isError: false });
      renderSection();
      fireEvent.click(screen.getByRole('button', { name: 'Add event' }));
      expect(screen.getByText("You're already going to every upcoming event we know of.")).toBeInTheDocument();
    });

    it('Owner with nothing upcoming: the empty state reads the spec copy and its button opens the picker', () => {
      renderSection({ upcoming: [], upcomingTotal: 0 });

      expect(screen.getByText('No upcoming events on your profile yet.')).toBeInTheDocument();
      // One "Add event", in the empty state; the header has none.
      const buttons = screen.getAllByRole('button', { name: 'Add event' });
      expect(buttons).toHaveLength(1);
      fireEvent.click(buttons[0]);
      expect(screen.getByRole('heading', { name: "Add an event you're going to" })).toBeInTheDocument();
      expect(captured('profile-event-add-clicked')).toEqual([expect.objectContaining({ from: 'empty-state' })]);
    });

    it('without the write permission there is no Add event and no empty state', () => {
      mockCanWrite = false;
      const { rerender } = renderSection();
      expect(screen.queryByRole('button', { name: 'Add event' })).not.toBeInTheDocument();

      rerender(
        <OwnerMemberEventsSection
          memberUid="me"
          firstName="Ana"
          upcoming={[]}
          upcomingTotal={0}
          past={PAST}
          pastTotal={PAST.length}
        />,
      );
      expect(screen.queryByText('No upcoming events on your profile yet.')).not.toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(/^Events$/);
    });
  });

  describe('⋯ menu', () => {
    it('lists Edit details and Remove, and no hide (LAB-3234)', () => {
      renderSection();
      openMenu('FIL Berlin');
      expect(menuItems()).toEqual(['Edit details', 'Remove']);
    });

    it('is only on upcoming cards', () => {
      renderSection();
      expect(screen.getAllByRole('button', { name: /^Actions for / })).toHaveLength(UPCOMING.length);
    });

    it('without the write permission there is no menu', () => {
      mockCanWrite = false;
      renderSection();
      expect(screen.queryByRole('button', { name: /^Actions for / })).not.toBeInTheDocument();
    });

    it('Edit details opens the drawer at the plans step', () => {
      renderSection();
      openMenu('FIL Berlin');
      fireEvent.click(screen.getByRole('menuitem', { name: 'Edit details' }));
      expect(screen.getByTestId('event-drawer-member-profile')).toHaveTextContent('up-1 at plans');
    });

    it('an event saved as hidden before LAB-3234 shows no pill', () => {
      renderSection({ upcoming: [{ ...UPCOMING[0], showOnProfile: false }, UPCOMING[1]], upcomingTotal: 2 });
      expect(screen.queryByText('Only visible to you')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^FIL Berlin,/ })).toBeInTheDocument();
    });

    it('Owner removes an event: confirm with the spec copy, one event removed, toast and analytics', () => {
      renderSection();
      openMenu('FIL Berlin');
      fireEvent.click(screen.getByRole('menuitem', { name: 'Remove' }));

      expect(screen.getByRole('heading', { name: 'Remove FIL Berlin?' })).toBeInTheDocument();
      expect(
        screen.getByText("You'll come off the list of people going, and it leaves your profile."),
      ).toBeInTheDocument();
      expect(mockRemove).not.toHaveBeenCalled();

      fireEvent.click(screen.getByRole('button', { name: 'Remove' }));

      expect(mockRemove).toHaveBeenCalledWith(
        { locationUid: 'loc-berlin', memberUid: 'me', eventUids: ['up-1'] },
        expect.any(Object),
      );
      expect(mockToastSuccess).toHaveBeenCalledWith('Removed FIL Berlin.');
      expect(captured('profile-event-removed')).toEqual([expect.objectContaining({ event_uid: 'up-1' })]);
      expect(screen.queryByRole('heading', { name: 'Remove FIL Berlin?' })).not.toBeInTheDocument();
    });

    it('Cancel on the remove confirm changes nothing', () => {
      renderSection();
      openMenu('Funding the Commons');
      fireEvent.click(screen.getByRole('menuitem', { name: 'Remove' }));
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(screen.queryByRole('heading', { name: 'Remove Funding the Commons?' })).not.toBeInTheDocument();
      expect(mockRemove).not.toHaveBeenCalled();
      expect(captured('profile-event-removed')).toEqual([]);
    });

    it('a failed remove says so and records nothing', () => {
      mockMutationOutcome = 'error';
      renderSection();
      openMenu('FIL Berlin');
      fireEvent.click(screen.getByRole('menuitem', { name: 'Remove' }));
      fireEvent.click(screen.getByRole('button', { name: 'Remove' }));

      expect(mockToastError).toHaveBeenCalledWith("We couldn't remove FIL Berlin. Try again.");
      expect(mockToastSuccess).not.toHaveBeenCalled();
      expect(captured('profile-event-removed')).toEqual([]);
    });

    it('Escape closes the menu without choosing anything', async () => {
      renderSection();
      openMenu('FIL Berlin');
      expect(screen.getByRole('menu')).toBeInTheDocument();
      await act(async () => {
        fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
      });
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      expect(mockRemove).not.toHaveBeenCalled();
    });
  });
});

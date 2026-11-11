import React from 'react';
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, within } from '@testing-library/react';

import { EventsSection } from '@/components/page/home/HomeV2/EventsSection';
import { EventsQueryKeys } from '@/services/events/constants';
import type { IHomeEvent } from '@/types/home.types';

/*
 * LAB-3220: with the event drawer flag on, a signed-in member's rail rows open the drawer over Home, "Going" marks
 * come from their own upcoming events, and the drawer's "yes" shows a toast with a link to their profile.
 */

const flag = { on: true };
jest.mock('@/utils/event-drawer', () => ({
  get SHOW_EVENT_DRAWER() {
    return flag.on;
  },
}));

type DrawerProps = {
  eventUid: string;
  source: string;
  onClose: () => void;
  onGoing?: (notice: { eventName: string; showOnProfile: boolean }) => void;
};
const drawers: DrawerProps[] = [];
// next/dynamic would hand back a loading placeholder; render a stand-in that records what the rail passes.
jest.mock(
  'next/dynamic',
  () => () =>
    function EventDrawerStandIn(props: DrawerProps) {
      drawers.push(props);
      return <div data-testid="event-drawer" data-uid={props.eventUid} data-source={props.source} />;
    },
);

const analytics = { onEventClicked: jest.fn(), onSeeAllClicked: jest.fn() };
jest.mock('@/analytics/home.analytics', () => ({ useHomeAnalytics: () => analytics }));

const viewer: { currentUser: { uid: string } | null } = { currentUser: { uid: 'm1' } };
jest.mock('@/services/auth/store', () => ({ useCurrentUserStore: () => viewer }));

const going: { data: unknown; isError: boolean; enabled: boolean[] } = { data: [], isError: false, enabled: [] };
jest.mock('@/services/events/hooks/useMyUpcomingEventUids', () => ({
  useMyUpcomingEventUids: (enabled: boolean) => {
    going.enabled.push(enabled);
    return { data: going.data, isError: going.isError };
  },
}));

const queryClient = { setQueryData: jest.fn() };
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQueryClient: () => queryClient,
}));

const toastSuccess = jest.fn();
jest.mock('@/components/core/ToastContainer', () => ({ toast: { success: (...a: unknown[]) => toastSuccess(...a) } }));

const events: IHomeEvent[] = [
  {
    uid: 'e1',
    name: 'libp2p Day',
    startDate: '2026-11-20T09:00:00.000Z',
    endDate: '2026-11-20T18:00:00.000Z',
    location: 'Lisbon',
    locationUid: 'loc-1',
  },
  {
    uid: 'e2',
    name: 'FIL Builders',
    startDate: '2026-11-24T09:00:00.000Z',
    endDate: '2026-11-26T18:00:00.000Z',
    location: 'Berlin',
    locationUid: 'loc-2',
  },
];

const renderRail = (signedIn = true) => render(<EventsSection events={events} total={7} signedIn={signedIn} />);
const row = (name: string) => screen.getByText(name).closest('li') as HTMLElement;

async function click(el: HTMLElement) {
  await act(async () => {
    fireEvent.click(el);
  });
}

describe('Home rail opens the event drawer (LAB-3220)', () => {
  beforeEach(() => {
    flag.on = true;
    viewer.currentUser = { uid: 'm1' };
    going.data = [];
    going.isError = false;
    going.enabled = [];
    drawers.length = 0;
    jest.clearAllMocks();
  });

  it('opens the drawer on the pressed event over Home, and still sends home-event-clicked', async () => {
    renderRail();

    expect(screen.queryByTestId('event-drawer')).not.toBeInTheDocument();
    expect(within(row('FIL Builders')).queryByRole('link')).not.toBeInTheDocument();

    await click(screen.getByRole('button', { name: 'FIL Builders' }));

    const drawer = screen.getByTestId('event-drawer');
    expect(drawer).toHaveAttribute('data-uid', 'e2');
    expect(drawer).toHaveAttribute('data-source', 'home');
    expect(analytics.onEventClicked).toHaveBeenCalledWith({ event_uid: 'e2', position: 2, signed_in: true });
  });

  it('asks nothing on the row itself', () => {
    renderRail();

    expect(screen.queryByRole('button', { name: /going/i })).not.toBeInTheDocument();
  });

  it('closes the drawer', async () => {
    renderRail();
    await click(screen.getByRole('button', { name: 'libp2p Day' }));

    await act(async () => drawers[drawers.length - 1].onClose());

    expect(screen.queryByTestId('event-drawer')).not.toBeInTheDocument();
  });

  it("marks the events the viewer is going to with 'Going' in place of the arrow", () => {
    going.data = ['e2'];
    renderRail();

    expect(within(row('FIL Builders')).getByText('Going')).toBeInTheDocument();
    expect(within(row('libp2p Day')).queryByText('Going')).not.toBeInTheDocument();
    expect(going.enabled).toContain(true);
  });

  it('after "Yes" with Show on my profile, marks the row and toasts a link to their profile', async () => {
    renderRail();
    await click(screen.getByRole('button', { name: 'libp2p Day' }));

    await act(async () => drawers[drawers.length - 1].onGoing?.({ eventName: 'libp2p Day', showOnProfile: true }));

    const [key, update] = queryClient.setQueryData.mock.calls[0];
    expect(key).toEqual([EventsQueryKeys.MY_UPCOMING_EVENT_UIDS, 'm1']);
    expect(update(['e9'])).toEqual(['e9', 'e1']);
    expect(update(undefined)).toEqual(['e1']);

    render(<>{toastSuccess.mock.calls[0][0]}</>);
    expect(screen.getByText(/libp2p Day is on your profile\./)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View profile' })).toHaveAttribute('href', '/members/m1');
  });

  it('after "Yes" without Show on my profile, toasts without a profile link', async () => {
    renderRail();
    await click(screen.getByRole('button', { name: 'libp2p Day' }));

    await act(async () => drawers[drawers.length - 1].onGoing?.({ eventName: 'libp2p Day', showOnProfile: false }));

    render(<>{toastSuccess.mock.calls[0][0]}</>);
    expect(screen.getByText("You're going to libp2p Day.")).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'View profile' })).not.toBeInTheDocument();
  });

  it('without the viewer’s events (failed request), shows no marks and rows still open the drawer', async () => {
    going.data = undefined;
    going.isError = true;
    renderRail();

    expect(screen.queryByText('Going')).not.toBeInTheDocument();
    await click(screen.getByRole('button', { name: 'libp2p Day' }));
    expect(screen.getByTestId('event-drawer')).toHaveAttribute('data-uid', 'e1');
  });

  it('signed out with the flag on, keeps the calendar links and never asks for the viewer’s events', () => {
    viewer.currentUser = null;
    renderRail(false);

    expect(screen.getByRole('link', { name: 'libp2p Day' }).getAttribute('href')).toMatch(/^\/events\/all\?embedPath=/);
    expect(screen.queryByRole('button', { name: 'libp2p Day' })).not.toBeInTheDocument();
    expect(going.enabled.every((enabled) => enabled === false)).toBe(true);
  });

  it('with the flag off, a signed-in member keeps the calendar links and sees no marks', () => {
    flag.on = false;
    going.data = ['e1'];
    renderRail();

    expect(screen.getByRole('link', { name: 'libp2p Day' })).toBeInTheDocument();
    expect(screen.queryByText('Going')).not.toBeInTheDocument();
    expect(going.enabled.every((enabled) => enabled === false)).toBe(true);
  });
});

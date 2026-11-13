import { useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { screen, userEvent, within } from 'storybook/test';

import { AccessControlQueryKeys } from '@/services/access-control/constants';
import { useCurrentUserStore } from '@/services/auth/store';
import { EventsQueryKeys } from '@/services/events/constants';
import type { UpcomingEvent } from '@/services/events/hooks/useUpcomingEvents';

import { ADD_EVENT_PICKER_QUERY } from './AddEventPicker';
import { memberEvent, PAST, UPCOMING } from './MemberEventsSection.fixtures';
import { OwnerMemberEventsSection } from './OwnerMemberEventsSection';

/**
 * The member Events section on the member's own profile (LAB-3218, LAB-3234): "Add event" and the ⋯ menu (Edit details,
 * Remove).
 * Compare with the prototype at `/prototypes/member-events-going` (owner view). The drawer is behind
 * `NEXT_PUBLIC_SHOW_EVENT_DRAWER`; the writes have no backend here, so a menu choice ends in an error toast.
 */
const OWNER_UID = 'owner-1';

const catalogueEvent = (uid: string, name: string, location: string, startDate: string, endDate = startDate) =>
  ({
    uid,
    name,
    location,
    startDate,
    endDate,
    logo: '',
    flag: '',
    websiteUrl: '',
    locationUid: `loc-${uid}`,
  }) as UpcomingEvent;

const CATALOGUE: UpcomingEvent[] = [
  catalogueEvent('up-1', 'FIL Berlin', 'Berlin, Germany', '2026-11-18T00:00:00.000Z', '2026-11-20T00:00:00.000Z'),
  catalogueEvent('ev-camp', 'IPFS Camp', 'Lisbon, Portugal', '2027-01-15T00:00:00.000Z', '2027-01-17T00:00:00.000Z'),
  catalogueEvent('ev-desci', 'DeSci Summit', 'Lisbon, Portugal', '2027-02-03T00:00:00.000Z'),
  catalogueEvent('ev-denver', 'ETHDenver', 'Denver, USA', '2027-02-20T00:00:00.000Z', '2027-02-27T00:00:00.000Z'),
  catalogueEvent('ev-labweek', 'LabWeek', 'Buenos Aires, Argentina', '2027-03-10T00:00:00.000Z'),
];

function Providers({ canWrite, children }: { canWrite: boolean; children: ReactNode }) {
  const [client] = useState(() => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
    qc.setQueryData([AccessControlQueryKeys.MY_ACCESS], {
      effectivePermissions: canWrite ? ['irlg.going.read', 'irlg.going.write'] : ['irlg.going.read'],
    });
    qc.setQueryData([EventsQueryKeys.GET_UPCOMING_EVENTS, ADD_EVENT_PICKER_QUERY], CATALOGUE);
    qc.setQueryData([EventsQueryKeys.MY_UPCOMING_EVENT_UIDS, OWNER_UID], ['up-1', 'up-2']);
    return qc;
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

type Args = { canWrite: boolean; upcoming: typeof UPCOMING };

const meta: Meta<Args> = {
  title: 'Member details/Events section (owner)',
  render: ({ canWrite, upcoming }) => {
    useCurrentUserStore.setState({ currentUser: { uid: OWNER_UID, name: 'Ana Lima' } as never });
    return (
      <Providers canWrite={canWrite}>
        <div style={{ maxWidth: 760, margin: '24px auto' }}>
          <OwnerMemberEventsSection
            memberUid={OWNER_UID}
            firstName="Ana"
            upcoming={upcoming}
            upcomingTotal={upcoming.length}
            past={PAST}
            pastTotal={PAST.length}
          />
        </div>
      </Providers>
    );
  },
  args: { canWrite: true, upcoming: UPCOMING },
};
export default meta;

type Story = StoryObj<Args>;

/** "Add event" in the header and a ⋯ menu on each upcoming card. */
export const Owner: Story = {};

/** Nothing upcoming: "No upcoming events on your profile yet." with its own "Add event". */
export const NothingUpcoming: Story = { args: { upcoming: [] } };

/** Without the write permission: no "Add event" and no ⋯ menu. */
export const WithoutWritePermission: Story = { args: { canWrite: false } };

/** The ⋯ menu open on FIL Berlin. */
export const MenuOpen: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Actions for FIL Berlin' }));
  },
};

/** "Add an event you're going to": the events the owner already has are left out. */
export const AddEventPickerOpen: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Add event' }));
    await screen.findByRole('heading', { name: "Add an event you're going to" });
  },
};

/** The remove confirm. */
export const RemoveConfirm: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Actions for FIL Berlin' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Remove' }));
  },
};

/** Many upcoming events: "Show all 5 upcoming events". */
export const ManyUpcoming: Story = {
  args: {
    upcoming: [
      ...UPCOMING,
      memberEvent({ uid: 'up-3', name: 'IPFS Camp', startDate: '2027-01-15T00:00:00.000Z' }),
      memberEvent({ uid: 'up-4', name: 'ETHDenver', startDate: '2027-02-20T00:00:00.000Z', faces: [] }),
      memberEvent({ uid: 'up-5', name: 'LabWeek', startDate: '2027-03-10T00:00:00.000Z' }),
    ],
  },
};

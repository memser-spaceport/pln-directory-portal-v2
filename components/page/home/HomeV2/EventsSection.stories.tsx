import { useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useCurrentUserStore } from '@/services/auth/store';
import { EventsQueryKeys } from '@/services/events/constants';
import type { IHomeEvent } from '@/types/home.types';

import { EventsSection } from './EventsSection';

/**
 * Home's Upcoming events rail (LAB-3220). Run Storybook with `NEXT_PUBLIC_SHOW_EVENT_DRAWER=true` to see the drawer
 * behaviour: rows open the event drawer, and the viewer's own upcoming events (seeded here) read "Going". Compare with
 * the prototype at `/prototypes/homepage` (signed in, Upcoming events rail). The drawer itself has its own stories.
 */
const VIEWER_UID = 'viewer-1';

const day = 24 * 60 * 60 * 1000;
const at = (days: number, hours = 9) =>
  new Date(Date.UTC(2026, 10, 14) + days * day + hours * 3600 * 1000).toISOString();

const EVENTS: IHomeEvent[] = [
  { uid: 'e1', name: 'libp2p Day', startDate: at(6), endDate: at(6, 18), location: 'Lisbon', locationUid: 'loc-1' },
  {
    uid: 'e2',
    name: 'FIL Builders Summit',
    startDate: at(10),
    endDate: at(12, 18),
    location: 'Berlin, Germany',
    locationUid: 'loc-2',
  },
  {
    uid: 'e3',
    name: 'Funding the Commons: a very long event name that has to truncate',
    startDate: at(19),
    endDate: at(19, 18),
    location: 'Bangkok',
    locationUid: 'loc-3',
  },
];

function Providers({ going, children }: { going: string[] | null; children: ReactNode }) {
  const [client] = useState(() => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
    if (going) qc.setQueryData([EventsQueryKeys.MY_UPCOMING_EVENT_UIDS, VIEWER_UID], going);
    return qc;
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

type Args = { signedIn: boolean; going: string[] | null };

const meta: Meta<Args> = {
  title: 'Home/HomeV2/EventsSection',
  parameters: { layout: 'padded' },
  render: ({ signedIn, going }) => {
    useCurrentUserStore.setState({
      currentUser: signedIn ? ({ uid: VIEWER_UID, name: 'Maya Chen' } as never) : null,
    });
    return (
      <Providers going={going}>
        <div style={{ maxWidth: 360 }}>
          <EventsSection events={EVENTS} total={18} signedIn={signedIn} />
        </div>
      </Providers>
    );
  },
};
export default meta;

type Story = StoryObj<Args>;

/** Signed in, going to FIL Builders Summit: that row reads "Going"; every row opens the drawer. */
export const SignedInGoing: Story = { args: { signedIn: true, going: ['e2'] } };

/** Signed in, not going anywhere yet (or the viewer's events failed to load): no marks. */
export const SignedInNotGoing: Story = { args: { signedIn: true, going: [] } };

/** Signed out: rows stay links to All Events, as before. */
export const SignedOut: Story = { args: { signedIn: false, going: null } };

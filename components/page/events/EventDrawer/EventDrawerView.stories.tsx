import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn, userEvent, within } from 'storybook/test';

import { toEventDetail } from '@/services/events/event-drawer.mappers';
import type { EventDetailResponse } from '@/services/events/event-drawer.types';

import { ATTENDEES, GOING_PLANS, NO_PLANS, bareEventResponse, eventResponse } from './EventDrawer.fixtures';
import { EventDrawerView, type EventDrawerViewProps } from './EventDrawerView';

/**
 * The event drawer's states (LAB-3216), without providers: `EventDrawerView` takes everything as props. Compare with
 * the prototype at `/prototypes/member-events-going`. The attendee list filters the fixture rows the way the BE
 * search does (name or team).
 */
type HarnessProps = Omit<EventDrawerViewProps, 'event' | 'attendees'> & {
  raw: EventDetailResponse | null;
  attendeeRows?: typeof ATTENDEES;
};

function Harness({ raw, attendeeRows = ATTENDEES, ...rest }: HarnessProps) {
  const [search, setSearch] = useState('');
  const needle = search.trim().toLowerCase();
  const rows = attendeeRows.filter((a) => `${a.name} ${a.teamName}`.toLowerCase().includes(needle));
  return (
    <EventDrawerView
      {...rest}
      event={raw ? toEventDetail(raw) : null}
      attendees={{
        rows,
        isLoading: false,
        isError: false,
        hasNextPage: false,
        isFetchingNextPage: false,
        fetchNextPage: fn(),
        search,
        onSearchChange: setSearch,
      }}
    />
  );
}

const meta = {
  title: 'page/events/EventDrawer',
  component: Harness,
  parameters: { layout: 'fullscreen' },
  args: {
    status: 'ready',
    raw: eventResponse(),
    canMarkGoing: true,
    viewerUid: 'viewer-1',
    plans: NO_PLANS,
    member: { teams: [], telegramHandle: '@mayaokonkwo', officeHours: null },
    saving: false,
    onClose: fn(),
    onRetry: fn(),
    onAttendeesOpen: fn(),
    onGoing: fn(),
    onYes: fn(async () => true),
    onSave: fn(async () => true),
  },
} satisfies Meta<typeof Harness>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A member with attendance permission who is not going: the question, "Show on my profile" ticked. */
export const NotGoing: Story = {};

/** Already going: opens on the plans step, with Cancel / Save and their own "Show on my profile". */
export const Going: Story = {
  args: {
    raw: eventResponse({ viewerGoing: true, viewer: { showOnProfile: false, roles: [] } }),
    plans: GOING_PLANS,
  },
};

/** Right after "Yes, I'm going": the plans step with Skip / Save. */
export const PlansAfterYes: Story = {
  play: async () => {
    await userEvent.click(within(document.body).getByRole('button', { name: "Yes, I'm going" }));
  },
};

/** "Yes" fails: the drawer stays on the question (the container shows the error toast). */
export const YesFails: Story = {
  args: { onYes: fn(async () => false) },
  play: async () => {
    await userEvent.click(within(document.body).getByRole('button', { name: "Yes, I'm going" }));
  },
};

/** Save fails: the plans stay open with the member's values. */
export const SaveFails: Story = {
  args: {
    raw: eventResponse({ viewerGoing: true, viewer: { showOnProfile: true, roles: [] } }),
    plans: GOING_PLANS,
    onSave: fn(async () => false),
  },
};

/** Signed in without `irlg.going.write` (investors, job aspirants): the event and attendees only. */
export const NoWritePermission: Story = {
  args: { canMarkGoing: false, plans: null },
};

/** Signed out: no question, the list without "You". */
export const SignedOut: Story = {
  args: { canMarkGoing: false, viewerUid: null, plans: null },
};

/** The attendee list above the drawer, "You" first. Try "lighthouse", then "zzz" for the empty search. */
export const AttendeesList: Story = {
  play: async () => {
    await userEvent.click(within(document.body).getByRole('button', { name: '40 People going' }));
  },
};

/** No tags, agenda, host or description: those blocks are left out. */
export const WithoutAgendaOrTags: Story = {
  args: { raw: bareEventResponse() },
};

/** Nobody going yet. */
export const NobodyGoing: Story = {
  args: { raw: eventResponse({ goingCount: 0, faces: [] }), attendeeRows: [] },
};

export const Loading: Story = { args: { status: 'loading', raw: null } };

/** A deleted event (404). */
export const NotFound: Story = { args: { status: 'not-found', raw: null } };

/** A failed fetch, with Try again. */
export const LoadError: Story = { args: { status: 'error', raw: null } };

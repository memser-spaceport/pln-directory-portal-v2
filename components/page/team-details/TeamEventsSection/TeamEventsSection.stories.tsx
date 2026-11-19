import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { DEMO_DAY, pastEvent, TEAM_NAME, TEAM_PAST, TEAM_UPCOMING, teamEvent } from './TeamEventsSection.fixtures';
import { TeamEventsSection } from './TeamEventsSection';

/**
 * The team profile's Events section (LAB-3219). Compare with the prototype at `/prototypes/member-events-going`
 * (team profile view). The drawer is behind `NEXT_PUBLIC_SHOW_EVENT_DRAWER`, so a card's press opens it only with the
 * flag on.
 */
const meta: Meta<typeof TeamEventsSection> = {
  title: 'Team details/Events section',
  component: TeamEventsSection,
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 900, margin: '24px auto' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    teamName: TEAM_NAME,
    upcoming: TEAM_UPCOMING,
    upcomingTotal: TEAM_UPCOMING.length,
    past: TEAM_PAST,
    pastTotal: TEAM_PAST.length,
  },
};

export default meta;
type Story = StoryObj<typeof TeamEventsSection>;

/** "Events", with "Lighthouse is going to" and "Contributions"; Demo Day leads the past cards. */
export const BothGroups: Story = {};

/** One group: "Past events", no labels. What a signed-out visitor sees. */
export const PastOnly: Story = { args: { upcoming: [], upcomingTotal: 0 } };

/** One group: "Events Lighthouse is going to". */
export const UpcomingOnly: Story = { args: { past: [], pastTotal: 0 } };

/** Four cards, then "Show all 6 past events". */
export const ManyPast: Story = {
  args: {
    upcoming: [],
    upcomingTotal: 0,
    past: [
      DEMO_DAY,
      ...TEAM_PAST.slice(1),
      pastEvent({ uid: 'past-3', name: 'IPFS Camp', startDate: '2025-10-01T00:00:00.000Z', roles: ['Speaker'] }),
      pastEvent({ uid: 'past-4', name: 'ETHDenver', startDate: '2025-02-20T00:00:00.000Z', city: 'Denver' }),
      pastEvent({ uid: 'past-5', name: 'DeSci Berlin', startDate: '2024-06-01T00:00:00.000Z', roles: ['Sponsor'] }),
    ],
    pastTotal: 6,
  },
};

/** A long title and several roles; one card without faces. */
export const LongTitles: Story = {
  args: {
    upcoming: [
      ...TEAM_UPCOMING,
      teamEvent({
        uid: 'up-3',
        name: 'Decentralized Science Summit and Unconference, Day One',
        startDate: '2026-12-10T00:00:00.000Z',
        roles: ['Host', 'Sponsor'],
      }),
    ],
    upcomingTotal: 3,
  },
};

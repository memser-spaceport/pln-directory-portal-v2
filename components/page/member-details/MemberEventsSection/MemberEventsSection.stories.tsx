import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { memberEvent, PAST, SEVEN_PAST, UPCOMING } from './MemberEventsSection.fixtures';
import { MemberEventsSection } from './MemberEventsSection';

/**
 * The member profile's Events section, viewer view (LAB-3217). Compare with the prototype at
 * `/prototypes/member-events-going`. The drawer is behind `NEXT_PUBLIC_SHOW_EVENT_DRAWER`, so a card's press opens it
 * only with the flag on.
 */
const meta: Meta<typeof MemberEventsSection> = {
  title: 'Member details/Events section',
  component: MemberEventsSection,
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 760, margin: '24px auto' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    firstName: 'Ana',
    isOwner: false,
    upcoming: UPCOMING,
    upcomingTotal: UPCOMING.length,
    past: PAST,
    pastTotal: PAST.length,
  },
};

export default meta;
type Story = StoryObj<typeof MemberEventsSection>;

/** "Events", with "Ana is going to" and "Contributions". */
export const BothGroups: Story = {};

/** One group: "Past events", no labels. What a signed-out visitor sees. */
export const PastOnly: Story = { args: { upcoming: [], upcomingTotal: 0 } };

/** One group: "Events Ana is going to". */
export const UpcomingOnly: Story = { args: { past: [], pastTotal: 0 } };

/** Four cards, then "Show all 7 past events". */
export const SevenPast: Story = { args: { upcoming: [], upcomingTotal: 0, past: SEVEN_PAST, pastTotal: 7 } };

/** Five upcoming: "Show all 5 upcoming events". A long title wraps; the foot stays on the card's floor. */
export const ManyUpcoming: Story = {
  args: {
    upcoming: [
      ...UPCOMING,
      memberEvent({
        uid: 'up-3',
        name: 'Decentralized Science Summit and Unconference, Day One',
        startDate: '2026-12-10T00:00:00.000Z',
        roles: ['Host', 'Sponsor'],
      }),
      memberEvent({ uid: 'up-4', name: 'IPFS Camp', startDate: '2027-01-15T00:00:00.000Z', city: null }),
      memberEvent({ uid: 'up-5', name: 'ETHDenver', startDate: '2027-02-20T00:00:00.000Z', faces: [] }),
    ],
    upcomingTotal: 5,
  },
};

/** The owner's own view, before LAB-3218 adds its controls. */
export const Owner: Story = { args: { isOwner: true } };

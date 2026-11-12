/**
 * LAB-3219: the team profile's Events section. Scenarios from the `profiles` spec delta of
 * `openspec/changes/lab-3211-event-drawer-and-profile-events`; copy strings are sentinels (design D8).
 */
import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';

// The real drawer pulls in `react-calendar`, which jest can't load.
jest.mock('@/components/page/events/EventDrawer', () => ({
  ...jest.requireActual('@/components/page/events/EventDrawer/toast'),
  EventDrawer: (props: { eventUid: string | null; source: string; onGoing?: (notice: unknown) => void }) =>
    props.eventUid ? (
      <div data-testid="event-drawer">
        {props.eventUid} from {props.source}
        <button onClick={() => props.onGoing?.({ eventName: 'FIL Berlin', showOnProfile: true })}>
          {"Yes, I'm going"}
        </button>
      </div>
    ) : null,
}));
const mockPrefetchEvent = jest.fn();
jest.mock('@/services/events/hooks/useEventDrawerQueries', () => ({
  usePrefetchEventDetail: () => mockPrefetchEvent,
}));
const mockToastSuccess = jest.fn();
jest.mock('@/components/core/ToastContainer', () => ({ toast: { success: (text: string) => mockToastSuccess(text) } }));

import { TeamEventsSection, type TeamEventsSectionProps } from '@/components/page/team-details/TeamEventsSection';
import {
  DEMO_DAY,
  pastEvent,
  TEAM_NAME,
  TEAM_PAST,
  TEAM_UPCOMING,
  TEAMMATES,
  teamEvent,
} from '@/components/page/team-details/TeamEventsSection/TeamEventsSection.fixtures';

const renderSection = (props: Partial<TeamEventsSectionProps> = {}) =>
  render(
    <TeamEventsSection
      teamName={TEAM_NAME}
      upcoming={TEAM_UPCOMING}
      upcomingTotal={TEAM_UPCOMING.length}
      past={TEAM_PAST}
      pastTotal={TEAM_PAST.length}
      {...props}
    />,
  );

const title = () => screen.getByRole('heading', { level: 2 });
const groupLabels = () => screen.queryAllByRole('heading', { level: 3 }).map((h) => h.textContent);
const cards = (name: string) => within(screen.getByRole('list', { name })).getAllByRole('listitem');

beforeEach(() => mockToastSuccess.mockClear());

describe('TeamEventsSection (LAB-3219)', () => {
  it('Team with both groups: titled "Events", with "Lighthouse is going to" and "Contributions"', () => {
    renderSection();

    expect(title()).toHaveTextContent(/^Events$/);
    expect(groupLabels()).toEqual(['Lighthouse is going to', 'Contributions']);
    expect(cards('Events Lighthouse is going to')).toHaveLength(2);
    expect(cards('Contributions')).toHaveLength(3);
  });

  it('only past events: titled "Past events", with no group labels', () => {
    renderSection({ upcoming: [], upcomingTotal: 0 });

    expect(title()).toHaveTextContent('Past events');
    expect(groupLabels()).toEqual([]);
    expect(cards('Past events')).toHaveLength(3);
  });

  it('only upcoming: titled "Events Lighthouse is going to"', () => {
    renderSection({ past: [], pastTotal: 0 });

    expect(title()).toHaveTextContent('Events Lighthouse is going to');
    expect(groupLabels()).toEqual([]);
  });

  it('neither group: no section', () => {
    const { container } = renderSection({ upcoming: [], upcomingTotal: 0, past: [], pastTotal: 0 });

    expect(container).toBeEmptyDOMElement();
  });

  it('Three teammates going: the card reads "3 from Lighthouse", with their faces and the team\'s role', () => {
    renderSection({ past: [], pastTotal: 0 });

    const [berlin, commons] = cards('Events Lighthouse is going to');
    expect(within(berlin).getByText('3 from Lighthouse')).toBeInTheDocument();
    expect(within(berlin).getByText('Nov 18–20 · Berlin')).toBeInTheDocument();
    expect(within(berlin).getByText('Sponsor')).toBeInTheDocument();
    expect(berlin.querySelectorAll('img')).toHaveLength(TEAMMATES.length);
    expect(within(commons).getByText('1 from Lighthouse')).toBeInTheDocument();
    expect(commons.querySelectorAll('img')).toHaveLength(1);
    // The team's people, not everyone going.
    expect(screen.queryByText(/going$/)).not.toBeInTheDocument();
  });

  it('no Add event, ⋯ menu or empty state in the upcoming group', () => {
    renderSection();

    expect(screen.queryByRole('button', { name: /Add event/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Actions for|more/i })).not.toBeInTheDocument();
    // The only buttons are the two upcoming cards' titles.
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toHaveLength(2);
  });

  it('the reader going too: that card says "You\'re going too", and only that one', () => {
    renderSection();

    const [berlin, commons] = cards('Events Lighthouse is going to');
    expect(within(berlin).getByText("You're going too")).toBeInTheDocument();
    expect(within(commons).queryByText("You're going too")).not.toBeInTheDocument();
  });

  it('an upcoming card opens the event drawer on that event, from the team profile, and shows the D8 toast', () => {
    renderSection();
    expect(screen.queryByTestId('event-drawer')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'FIL Berlin, Nov 18–20' }));
    expect(screen.getByTestId('event-drawer')).toHaveTextContent('up-1 from team-profile');

    fireEvent.click(screen.getByRole('button', { name: "Yes, I'm going" }));
    expect(mockToastSuccess).toHaveBeenCalledWith('FIL Berlin is on your profile.');
  });

  it('Team that took part in a Demo Day: Demo Day first, with its pill and link; the hosted event next with "Host"', () => {
    renderSection({ upcoming: [], upcomingTotal: 0 });

    const [demoDay, hosted, attended] = cards('Past events');
    expect(within(demoDay).getByText('Demo Day')).toBeInTheDocument();
    expect(within(demoDay).getByRole('link', { name: 'PL Demo Day, June 2026' })).toHaveAttribute(
      'href',
      '/demoday/june-2026',
    );
    expect(demoDay).toHaveTextContent('JUN');

    expect(within(hosted).getByText('LabWeek Lisbon')).toBeInTheDocument();
    expect(within(hosted).getByText('Host')).toBeInTheDocument();
    expect(within(hosted).queryByRole('link')).not.toBeInTheDocument();

    // Plain participation: no pill, no link.
    expect(within(attended).getByText('Founders Forum')).toBeInTheDocument();
    expect(within(attended).queryByText(/Host|Speaker|Sponsor|Participant|Demo Day/)).not.toBeInTheDocument();
    expect(within(attended).queryByRole('link')).not.toBeInTheDocument();
  });

  it('a Demo Day never opens the drawer', () => {
    renderSection({ upcoming: [], upcomingTotal: 0 });

    fireEvent.click(screen.getByRole('link', { name: DEMO_DAY.title }));

    expect(screen.queryByTestId('event-drawer')).not.toBeInTheDocument();
  });

  it('six past items: four cards, then "Show all 6 past events", which shows all six in place', () => {
    const six = [
      ...TEAM_PAST,
      pastEvent({ uid: 'p3', name: 'IPFS Camp', startDate: '2025-10-01T00:00:00.000Z' }),
      pastEvent({ uid: 'p4', name: 'ETHDenver', startDate: '2025-02-20T00:00:00.000Z' }),
      pastEvent({ uid: 'p5', name: 'DeSci Berlin', startDate: '2024-06-01T00:00:00.000Z' }),
    ];
    renderSection({ upcoming: [], upcomingTotal: 0, past: six, pastTotal: 6 });

    expect(cards('Past events')).toHaveLength(4);
    fireEvent.click(screen.getByRole('button', { name: 'Show all 6 past events' }));
    expect(cards('Past events')).toHaveLength(6);
  });

  it('five upcoming events: four cards, then "Show all 5 upcoming events"', () => {
    const five = [1, 2, 3, 4, 5].map((n) => teamEvent({ uid: `u${n}`, name: `Event ${n}` }));
    renderSection({ upcoming: five, upcomingTotal: 5, past: [], pastTotal: 0 });

    expect(cards('Events Lighthouse is going to')).toHaveLength(4);
    fireEvent.click(screen.getByRole('button', { name: 'Show all 5 upcoming events' }));
    expect(cards('Events Lighthouse is going to')).toHaveLength(5);
  });
});

describe('prefetching the event before the press', () => {
  it('loads the event when the pointer reaches a card, and on keyboard focus', () => {
    mockPrefetchEvent.mockClear();
    renderSection();
    const [event] = TEAM_UPCOMING;
    const press = screen.getByRole('button', { name: new RegExp(`^${event.name}, `) });

    fireEvent.pointerEnter(press);
    expect(mockPrefetchEvent).toHaveBeenCalledWith(event.uid);

    mockPrefetchEvent.mockClear();
    fireEvent.focus(press);
    expect(mockPrefetchEvent).toHaveBeenCalledWith(event.uid);
  });
});

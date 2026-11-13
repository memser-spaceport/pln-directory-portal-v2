/**
 * LAB-3217: the member profile's Events section, viewer view. Scenarios from the `profiles` spec delta of
 * `openspec/changes/lab-3211-event-drawer-and-profile-events`; copy strings are sentinels (design D8).
 */
import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockDrawer = jest.fn();
jest.mock('@/components/page/events/EventDrawer', () => ({
  ...jest.requireActual('@/components/page/events/EventDrawer/toast'),
  EventDrawer: (props: { eventUid: string | null; source: string; onGoing?: (notice: unknown) => void }) => {
    mockDrawer(props);
    return props.eventUid ? (
      <div data-testid="event-drawer">
        {props.eventUid} from {props.source}
        <button onClick={() => props.onGoing?.({ eventName: 'FIL Berlin' })}>{"Yes, I'm going"}</button>
      </div>
    ) : null;
  },
}));
const mockPrefetchEvent = jest.fn();
jest.mock('@/services/events/hooks/useEventDrawerQueries', () => ({
  usePrefetchEventDetail: () => mockPrefetchEvent,
}));
const mockToastSuccess = jest.fn();
jest.mock('@/components/core/ToastContainer', () => ({ toast: { success: (text: string) => mockToastSuccess(text) } }));

import {
  MemberEventsSection,
  type MemberEventsSectionProps,
} from '@/components/page/member-details/MemberEventsSection';
import {
  PAST,
  SEVEN_PAST,
  UPCOMING,
} from '@/components/page/member-details/MemberEventsSection/MemberEventsSection.fixtures';

const renderSection = (props: Partial<MemberEventsSectionProps> = {}) =>
  render(
    <MemberEventsSection
      firstName="Ana"
      isOwner={false}
      upcoming={UPCOMING}
      upcomingTotal={UPCOMING.length}
      past={PAST}
      pastTotal={PAST.length}
      {...props}
    />,
  );

const title = () => screen.getByRole('heading', { level: 2 });
const groupLabels = () => screen.queryAllByRole('heading', { level: 3 }).map((h) => h.textContent);

beforeEach(() => {
  mockDrawer.mockClear();
  mockToastSuccess.mockClear();
});

describe('MemberEventsSection (LAB-3217)', () => {
  it('Only past events: titled "Events", with the "Past events" label (LAB-3230, LAB-3234)', () => {
    renderSection({ upcoming: [], upcomingTotal: 0 });

    expect(title()).toHaveTextContent(/^Events$/);
    expect(groupLabels()).toEqual(['Past events']);
    expect(within(screen.getByRole('list', { name: 'Past events' })).getAllByRole('listitem')).toHaveLength(3);
  });

  it('Both groups: titled "Events", with "Ana is going to" over the upcoming cards and "Past events" over the past', () => {
    renderSection();

    expect(title()).toHaveTextContent(/^Events$/);
    expect(groupLabels()).toEqual(['Ana is going to', 'Past events']);
    expect(within(screen.getByRole('list', { name: 'Ana is going to' })).getAllByRole('listitem')).toHaveLength(2);
    expect(within(screen.getByRole('list', { name: 'Past events' })).getAllByRole('listitem')).toHaveLength(3);
    expect(screen.queryByText('Contributions')).not.toBeInTheDocument();
  });

  it('only upcoming: titled "Events", with the "Ana is going to" label', () => {
    renderSection({ past: [], pastTotal: 0 });

    expect(title()).toHaveTextContent(/^Events$/);
    expect(groupLabels()).toEqual(['Ana is going to']);
  });

  it('the owner reads "You\'re going to"', () => {
    const { rerender } = renderSection({ isOwner: true });
    expect(groupLabels()).toEqual(["You're going to", 'Past events']);

    rerender(
      <MemberEventsSection firstName="Ana" isOwner upcoming={UPCOMING} upcomingTotal={2} past={[]} pastTotal={0} />,
    );
    expect(title()).toHaveTextContent(/^Events$/);
    expect(groupLabels()).toEqual(["You're going to"]);
  });

  it('cards sit in one full-width column (LAB-3234)', () => {
    renderSection();
    expect(screen.getByRole('list', { name: 'Ana is going to' })).toHaveClass('cardsSingle');
    expect(screen.getByRole('list', { name: 'Past events' })).toHaveClass('cardsSingle');
  });

  it('neither group: no section', () => {
    const { container } = renderSection({ upcoming: [], upcomingTotal: 0, past: [], pastTotal: 0 });

    expect(container).toBeEmptyDOMElement();
  });

  it('Viewer going to the same event: that card says "You\'re going too", and only that one', () => {
    renderSection();

    const [berlin, commons] = within(screen.getByRole('list', { name: 'Ana is going to' })).getAllByRole('listitem');
    expect(within(berlin).getByText("You're going too")).toBeInTheDocument();
    expect(within(commons).queryByText("You're going too")).not.toBeInTheDocument();
  });

  it('an upcoming card: date tile, range and city for a multi-day event, roles, and "N going"', () => {
    renderSection();

    const [berlin, commons] = within(screen.getByRole('list', { name: 'Ana is going to' })).getAllByRole('listitem');
    expect(berlin).toHaveTextContent('NOV18');
    expect(within(berlin).getByText('Nov 18–20 · Berlin')).toBeInTheDocument();
    expect(within(berlin).getByText('Speaker')).toBeInTheDocument();
    expect(within(berlin).getByText('42 going')).toBeInTheDocument();
    // The tile already says a one-day event's date, so its meta is the city alone.
    expect(within(commons).getByText('Berlin')).toBeInTheDocument();
    expect(within(commons).getByText('7 going')).toBeInTheDocument();
  });

  it('Past event with a role: "MAR", "2026", "Founders Forum", "Lisbon" and a "Speaker" tag, and no link', () => {
    renderSection({ upcoming: [], upcomingTotal: 0 });

    const [card] = within(screen.getByRole('list', { name: 'Past events' })).getAllByRole('listitem');
    for (const text of ['MAR', '2026', 'Founders Forum', 'Lisbon', 'Speaker']) {
      expect(within(card).getByText(text)).toBeInTheDocument();
    }
    expect(within(card).queryByRole('link')).not.toBeInTheDocument();
    expect(within(card).queryByRole('button')).not.toBeInTheDocument();
  });

  it('Seven past events: four cards, then "Show all 7 past events", which shows all seven in place', () => {
    renderSection({ upcoming: [], upcomingTotal: 0, past: SEVEN_PAST, pastTotal: 7 });

    const list = () => within(screen.getByRole('list', { name: 'Past events' })).getAllByRole('listitem');
    expect(list()).toHaveLength(4);

    fireEvent.click(screen.getByRole('button', { name: 'Show all 7 past events' }));

    expect(list()).toHaveLength(7);
    expect(screen.queryByRole('button', { name: /Show all/ })).not.toBeInTheDocument();
  });

  it('five upcoming events: four cards, then "Show all 5 upcoming events"', () => {
    const five = [...UPCOMING, ...SEVEN_PAST.slice(0, 3)];
    renderSection({ upcoming: five, upcomingTotal: 5 });

    expect(within(screen.getByRole('list', { name: 'Ana is going to' })).getAllByRole('listitem')).toHaveLength(4);
    fireEvent.click(screen.getByRole('button', { name: 'Show all 5 upcoming events' }));
    expect(within(screen.getByRole('list', { name: 'Ana is going to' })).getAllByRole('listitem')).toHaveLength(5);
  });

  it('Card opens the drawer: the title opens the event drawer on that event, from the member profile', () => {
    renderSection();
    expect(screen.queryByTestId('event-drawer')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'FIL Berlin, Nov 18–20' }));

    expect(screen.getByTestId('event-drawer')).toHaveTextContent('up-1 from member-profile');
  });

  it('shows the D8 toast when the drawer reports the viewer is going', () => {
    renderSection();
    fireEvent.click(screen.getByRole('button', { name: 'Funding the Commons, Dec 4' }));

    fireEvent.click(screen.getByRole('button', { name: "Yes, I'm going" }));

    expect(mockToastSuccess).toHaveBeenCalledWith('FIL Berlin is on your profile.');
  });

  it("leaves slots for the owner's controls (LAB-3218)", () => {
    renderSection({
      isOwner: true,
      upcoming: [],
      upcomingTotal: 0,
      headerAction: <button>Add event</button>,
      upcomingEmpty: <p>No upcoming events on your profile yet.</p>,
    });

    // The empty slot keeps the upcoming group, so both groups are labelled.
    expect(title()).toHaveTextContent(/^Events$/);
    expect(screen.getByText('No upcoming events on your profile yet.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add event' })).toBeInTheDocument();
  });

  it('renders a card menu from the slot, and the menu can open the drawer at the plans step', () => {
    renderSection({
      isOwner: true,
      renderCardMenu: (event, openDrawer) => (
        <button onClick={() => openDrawer('plans')}>{`Actions for ${event.name}`}</button>
      ),
    });

    // The owner is never told they're going "too".
    expect(screen.queryByText("You're going too")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Actions for FIL Berlin' }));
    expect(mockDrawer).toHaveBeenLastCalledWith(expect.objectContaining({ eventUid: 'up-1', initialStep: 'plans' }));
  });
});

describe('prefetching the event before the press', () => {
  it('loads the event when the pointer reaches a card, and on keyboard focus', () => {
    mockPrefetchEvent.mockClear();
    renderSection();
    const [event] = UPCOMING;
    const press = screen.getByRole('button', { name: new RegExp(`^${event.name}, `) });

    fireEvent.pointerEnter(press);
    expect(mockPrefetchEvent).toHaveBeenCalledWith(event.uid);

    mockPrefetchEvent.mockClear();
    fireEvent.focus(press);
    expect(mockPrefetchEvent).toHaveBeenCalledWith(event.uid);
  });
});

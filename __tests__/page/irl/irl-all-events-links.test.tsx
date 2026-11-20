import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import IrlLocation from '@/components/page/irl/locations/irl-location';
import GuestList from '@/components/page/irl/attendee-list/guest-list';

const flags = { on: true };

jest.mock('@/utils/events-page', () => ({
  get SHOW_EVENTS_PAGE_V2() {
    return flags.on;
  },
}));
jest.mock('@/utils/event-drawer', () => ({
  get SHOW_EVENT_DRAWER() {
    return flags.on;
  },
}));
jest.mock('@/analytics/irl.analytics', () => ({
  useIrlAnalytics: () => new Proxy({}, { get: () => jest.fn() }),
}));

const OLD_EVENTS_APP = 'https://events.example';
const OLD_SCHEDULE = 'https://schedule.example';

function renderGuestList(gathering: string) {
  render(
    <GuestList
      userInfo={{} as any}
      eventDetails={{ events: { upcomingEvents: [], pastEvents: [] } } as any}
      showTelegram={false}
      items={[]}
      selectedGuests={[]}
      setSelectedGuests={jest.fn()}
      location={{ name: gathering } as any}
      isLoggedIn
      onLogin={jest.fn()}
      searchParams={{}}
      isAdminInAllEvents={false}
      newSearchParams={new URLSearchParams()}
      hasFiltersApplied={false}
    />,
  );
  return screen.getByRole('link', { name: 'View schedule of events' });
}

describe('IRL Gatherings page links (LAB-3337)', () => {
  const env = process.env;
  beforeEach(() => {
    process.env = { ...env, NEXT_PUBLIC_PL_EVENTS_URL: OLD_EVENTS_APP, SCHEDULE_BASE_URL: OLD_SCHEDULE };
    flags.on = true;
  });
  afterAll(() => {
    process.env = env;
  });

  it('R4: "View All Events" opens the All Events page in the same tab', () => {
    render(<IrlLocation locationDetails={[]} searchParams={{}} />);
    const card = screen.getByRole('link', { name: /View All Events/ });
    expect(card).toHaveAttribute('href', '/events/all');
    expect(card).not.toHaveAttribute('target');
  });

  it('R3: the empty guest list links to the city on the All Events page, in the same tab', () => {
    const link = renderGuestList('london');
    expect(link).toHaveAttribute('href', '/events/all?city=London');
    expect(link).not.toHaveAttribute('target');
  });

  it('R6: with the page off, both stay on the events app in a new tab', () => {
    flags.on = false;
    render(<IrlLocation locationDetails={[]} searchParams={{}} />);
    const card = screen.getByRole('link', { name: /View All Events/ });
    expect(card).toHaveAttribute('href', OLD_EVENTS_APP);
    expect(card).toHaveAttribute('target', '_blank');

    const link = renderGuestList('london');
    expect(link).toHaveAttribute('href', `${OLD_SCHEDULE}/calendar?location=london`);
    expect(link).toHaveAttribute('target', '_blank');
  });
});

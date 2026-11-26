import React from 'react';
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, within } from '@testing-library/react';

import { AllEventsPage, type AllEventsPageProps } from '@/components/page/events/all-events/AllEventsPage';
import { monthsWithEvents } from '@/components/page/events/all-events/calendar/MonthYearPicker';
import { parseMonthKey } from '@/components/page/events/all-events/calendar/weeks';
import { useAllEventsFilterStore } from '@/services/events/all-events-filters.store';
import { allEventsItem as item } from '@/services/events/all-events.fixtures';
import type { AllEventsItem } from '@/services/events/all-events.types';

/*
 * LAB-3460 (Polina's prototype, 2026-11-26): the Calendar keeps the Live & upcoming | Past tabs, which follow the month
 * or week on show; a press on a tab moves the calendar; a "Month YYYY" pill jumps to any month; `?month=` keeps it.
 */

jest.mock('@/utils/events-page', () => ({
  SHOW_EVENTS_PAGE_V2: true,
  HAS_EVENTS_MAP: true,
  GOOGLE_MAPS_API_KEY: 'test-key',
  GOOGLE_MAPS_MAP_ID: 'test-map-id',
}));
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn(), refresh: jest.fn() }),
  usePathname: () => '/events/all',
  useSearchParams: () => new URLSearchParams(window.location.search),
}));
jest.mock('next/dynamic', () => () => () => null);
jest.mock('@/components/page/events/EventDrawer/EventDrawer', () => ({ EventDrawer: () => null }));

const analytics = {
  onEventsViewChanged: jest.fn(),
  onEventsWhenChanged: jest.fn(),
  onEventsYearChanged: jest.fn(),
  onEventsFiltersApplied: jest.fn(),
  onEventsCitySelected: jest.fn(),
  onSubmitEventButtonClicked: jest.fn(),
  onEventsEmbedLinkCopied: jest.fn(),
  onEventsEmbedCodeCopied: jest.fn(),
  onEventsEmbedViewed: jest.fn(),
};
jest.mock('@/analytics/events.analytics', () => ({ useEventsAnalytics: () => analytics }));
const going: { uids: string[] | undefined } = { uids: undefined };
jest.mock('@/services/events/hooks/useMyUpcomingEventUids', () => ({
  useMyUpcomingEventUids: () => ({ data: going.uids }),
}));

type Query<T> = { data: T | undefined; isError: boolean; isFetching: boolean; fetchStatus?: 'fetching' | 'idle' };
const pastEvents: { state: Query<AllEventsItem[]>; enabled: boolean[] } = {
  state: { data: undefined, isError: false, isFetching: false },
  enabled: [],
};
jest.mock('@/services/events/hooks/usePastEvents', () => ({
  // As React Query has it: a query that is switched off has no data and nothing under way.
  usePastEvents: (enabled: boolean) => {
    pastEvents.enabled.push(enabled);
    if (!enabled)
      return { data: undefined, isError: false, isFetching: false, fetchStatus: 'idle', refetch: jest.fn() };
    return { ...pastEvents.state, refetch: jest.fn() };
  },
}));
jest.mock('@/services/events/hooks/useMyPastEventUids', () => ({
  useMyPastEventUids: () => ({ data: [], isError: false, isFetching: false, refetch: jest.fn() }),
}));
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQueryClient: () => ({ setQueryData: jest.fn() }),
}));
jest.mock('@/services/events/hooks/useEventDrawerQueries', () => ({ usePrefetchEventDetail: () => jest.fn() }));
jest.mock('@/components/page/events/all-events/map/EventsMap', () => ({
  EventsMap: () => <div data-testid="events-map" />,
}));
jest.mock('@/components/core/ToastContainer', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

type YearViewProps = {
  locale?: string;
  activeStartDate: Date;
  value: Date;
  onActiveStartDateChange: (args: { activeStartDate: Date }) => void;
  onClickMonth: (date: Date) => void;
  formatMonth: (locale: string | undefined, date: Date) => string;
  tileContent: (args: { date: Date }) => React.ReactNode;
  prevAriaLabel: string;
  nextAriaLabel: string;
};
/*
 * react-calendar ships ESM only, which jest doesn't load. A stand-in for its year view with the props the picker uses:
 * ‹ year ›, twelve month tiles (react-calendar names each "November 2030" and shows "Nov"), the active tile, tileContent.
 * The real one is checked in the browser.
 */
jest.mock('react-calendar', () => ({
  __esModule: true,
  default: function YearView(props: YearViewProps) {
    const year = props.activeStartDate.getFullYear();
    return (
      <div className="react-calendar" data-locale={props.locale}>
        <button
          type="button"
          aria-label={props.prevAriaLabel}
          onClick={() => props.onActiveStartDateChange({ activeStartDate: new Date(year - 1, 0, 1) })}
        />
        <span data-testid="picker-year">{year}</span>
        <button
          type="button"
          aria-label={props.nextAriaLabel}
          onClick={() => props.onActiveStartDateChange({ activeStartDate: new Date(year + 1, 0, 1) })}
        />
        {Array.from({ length: 12 }, (_, m) => {
          const date = new Date(year, m, 1);
          const active = props.value.getFullYear() === year && props.value.getMonth() === m;
          return (
            <button
              key={m}
              type="button"
              data-active={active}
              className={active ? 'react-calendar__tile--active' : undefined}
              onClick={() => props.onClickMonth(date)}
            >
              <abbr aria-label={date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}>
                {props.formatMonth(undefined, date)}
              </abbr>
              {props.tileContent({ date })}
            </button>
          );
        })}
      </div>
    );
  },
}));

/** Noon UTC on Monday, Nov 25, 2030, whatever zone the tests run in. */
const NOW = Date.UTC(2030, 10, 25, 12);
const TODAY = '2030-11-25';

const on = (uid: string, startDay: string, over: Partial<AllEventsItem> = {}) =>
  item({
    uid,
    name: `Event ${uid}`,
    startDay,
    endDay: startDay,
    startDate: `${startDay}T09:00:00.000Z`,
    endDate: `${startDay}T11:00:00.000Z`,
    ...over,
  });
const upcoming = () => [on('dec', '2030-12-03'), on('jan', '2031-01-10')];
const past = () => [
  on('p-nov', '2030-11-12'),
  on('p-jan', '2030-01-02'),
  on('p-newyear', '2029-12-30', { endDay: '2030-01-03', endDate: '2030-01-03T18:00:00.000Z' }),
];

function renderPage(url: string, over: Partial<AllEventsPageProps> = {}) {
  window.history.replaceState(null, '', url);
  return render(
    <AllEventsPage
      result={{ ok: true, items: upcoming() }}
      signedIn={false}
      viewerUid={null}
      memberCity={undefined}
      serverNow={NOW}
      serverTodayIso={TODAY}
      submitHref="https://irl.example/submit"
      {...over}
    />,
  );
}
const MONTH = '/events/all?view=calendar&cal=month';
const WEEK = '/events/all?view=calendar&cal=week';

const tab = (name: RegExp) => within(screen.getByRole('tablist', { name: 'When' })).getByRole('tab', { name });
const liveTab = () => tab(/^Live & upcoming/);
const pastTab = () => tab(/^Past/);
const selected = () => (pastTab().getAttribute('aria-selected') === 'true' ? 'past' : 'live');
/** The calendar's heading: the week's range, or the month (for screen readers in Month). */
const label = () => document.querySelector('[data-testid="events-calendar"] h3')?.textContent;
const press = (name: string) => fireEvent.click(screen.getByRole('button', { name }));
const card = (uid: string) => document.querySelector(`[data-event-uid="${uid}"]`);
const pill = () => screen.getByRole('button', { name: /: go to a month$/ });
const settle = () => act(() => void jest.advanceTimersByTime(50));
const month = () => new URLSearchParams(window.location.search).get('month');

async function openPicker() {
  fireEvent.click(pill());
  await act(async () => void jest.advanceTimersByTime(100));
  return screen.getByRole('dialog', { name: 'Go to a month' });
}

beforeEach(() => {
  jest.useFakeTimers({ now: NOW });
  useAllEventsFilterStore.setState({ params: new URLSearchParams(), _clearImmediate: false });
  pastEvents.state = { data: past(), isError: false, isFetching: false };
  pastEvents.enabled = [];
  going.uids = undefined;
  jest.clearAllMocks();
});
afterEach(() => {
  act(() => jest.runOnlyPendingTimers());
  jest.useRealTimers();
});

describe('the tabs follow the calendar', () => {
  it('has both tabs with their counts and no year, and this month is Live & upcoming', () => {
    renderPage(`${MONTH}&when=past&year=2029`);
    expect([liveTab(), pastTab()].map((el) => el.textContent?.trim())).toEqual(['Live & upcoming 2', 'Past 3']);
    expect(selected()).toBe('live');
    expect(screen.queryByRole('button', { name: /^Year: / })).toBeNull();
  });

  it('in Month: a month that ended before today selects Past, and stepping back to this month Live & upcoming', () => {
    renderPage(MONTH);
    press('Previous month');
    expect(label()).toBe('October 2030');
    expect(selected()).toBe('past');
    press('Next month');
    expect(selected()).toBe('live');
    press('Next month');
    expect(selected()).toBe('live');
  });

  it('in Week: last week is Past, this week is Live & upcoming', () => {
    renderPage(WEEK);
    expect(label()).toBe('Nov 25 – Dec 1, 2030');
    press('Previous week');
    expect(label()).toBe('Nov 18 – Nov 24, 2030');
    expect(selected()).toBe('past');
    press('Next week');
    expect(selected()).toBe('live');
  });

  it('switching Week to Month keeps the tab of what is on show', () => {
    renderPage(WEEK);
    press('Previous week');
    fireEvent.click(screen.getByRole('tab', { name: 'Month' }));
    // November holds today, so it is Live & upcoming again.
    expect(label()).toBe('November 2030');
    expect(selected()).toBe('live');
  });
});

describe('a press on a tab moves the calendar', () => {
  it('Past goes to the latest past event, capped at last month; Live & upcoming goes to today', () => {
    renderPage(MONTH);
    fireEvent.click(pastTab());
    // The latest past event is Nov 12, in this month, so it lands on October, the last month wholly past.
    expect(label()).toBe('October 2030');
    expect(selected()).toBe('past');
    fireEvent.click(liveTab());
    expect(label()).toBe('November 2030');
    expect(selected()).toBe('live');
  });

  it('in Week, Past goes to the latest past event’s week', () => {
    renderPage(WEEK);
    fireEvent.click(pastTab());
    expect(label()).toBe('Nov 11 – Nov 17, 2030');
    expect(card('p-nov')).not.toBeNull();
    expect(selected()).toBe('past');
  });

  it('pressing the tab on show moves it too, and only a switch is recorded', () => {
    renderPage(MONTH);
    fireEvent.click(pastTab());
    expect(analytics.onEventsWhenChanged).toHaveBeenCalledWith({ when: 'past', view: 'calendar' });
    press('Previous month');
    press('Previous month');
    expect(label()).toBe('August 2030');
    fireEvent.click(pastTab());
    expect(label()).toBe('October 2030');
    press('Next month');
    press('Next month');
    expect(label()).toBe('December 2030');
    fireEvent.click(liveTab());
    expect(label()).toBe('November 2030');
    expect(analytics.onEventsWhenChanged).toHaveBeenCalledTimes(1);
  });

  it('never writes `when` to the address, and List goes by the address’s again', () => {
    renderPage(MONTH);
    settle();
    fireEvent.click(pastTab());
    settle();
    expect(useAllEventsFilterStore.getState().params.get('when')).toBeNull();
    fireEvent.click(screen.getByRole('tab', { name: 'List' }));
    expect(selected()).toBe('live');
    expect(card('dec')).not.toBeNull();
  });

  it('before past events have loaded: Past has no count, and its press lands on last month', () => {
    pastEvents.state = { data: undefined, isError: false, isFetching: true, fetchStatus: 'fetching' };
    const { rerender } = renderPage(MONTH);
    expect(pastTab().textContent?.trim()).toBe('Past');
    fireEvent.click(pastTab());
    expect(label()).toBe('October 2030');
    expect(selected()).toBe('past');
    // When they come, the calendar stays where it is.
    pastEvents.state = { data: past(), isError: false, isFetching: false };
    rerender(
      <AllEventsPage
        result={{ ok: true, items: upcoming() }}
        signedIn={false}
        viewerUid={null}
        memberCity={undefined}
        serverNow={NOW}
        serverTodayIso={TODAY}
        submitHref="https://irl.example/submit"
      />,
    );
    expect(label()).toBe('October 2030');
    expect(pastTab().textContent?.trim()).toBe('Past 3');
  });

  it('when past events fail to load: Past has no count, and its press still lands on last month', () => {
    pastEvents.state = { data: undefined, isError: true, isFetching: false, fetchStatus: 'idle' };
    renderPage(MONTH);
    expect(pastTab().textContent?.trim()).toBe('Past');
    fireEvent.click(pastTab());
    expect(label()).toBe('October 2030');
    expect(selected()).toBe('past');
  });

  it('asks for past events with the page: a press never switches the one query off or on', () => {
    renderPage(MONTH);
    expect(pastEvents.enabled.every(Boolean)).toBe(true);
    fireEvent.click(pastTab());
    fireEvent.click(liveTab());
    fireEvent.click(pastTab());
    // React Query asks again only for a new key or a query switched back on; neither happens.
    expect(pastEvents.enabled.every(Boolean)).toBe(true);
  });
});

describe('?month=', () => {
  it('opens that month, and the tab follows it', () => {
    renderPage(`${MONTH}&month=2030-01`);
    expect(label()).toBe('January 2030');
    expect(card('p-jan')).not.toBeNull();
    expect(selected()).toBe('past');
    expect(pill()).toHaveTextContent('January 2030');
  });

  it('opens Week on that month’s first event, or on today in this month', () => {
    const { unmount } = renderPage(`${WEEK}&month=2030-01`);
    // Dec 30 – Jan 3 runs into January: its first January day is Jan 1, in the week from Monday, Dec 31.
    expect(label()).toBe('Dec 31 – Jan 6, 2030');
    expect(selected()).toBe('past');
    unmount();
    renderPage(`${WEEK}&month=2030-11`);
    expect(label()).toBe('Nov 25 – Dec 1, 2030');
    expect(selected()).toBe('live');
  });

  it.each(['2030-13', '2030-00', '2030-1', 'abc', '0999-05', ''])('ignores month=%s', (value) => {
    renderPage(`${MONTH}&month=${value}`);
    expect(label()).toBe('November 2030');
    expect(selected()).toBe('live');
  });

  it('is written once the visitor moves the calendar, in place, never on opening it', () => {
    const push = jest.spyOn(window.history, 'pushState');
    renderPage(MONTH);
    settle();
    expect(month()).toBeNull();
    press('Next month');
    settle();
    expect(month()).toBe('2030-12');
    fireEvent.click(pastTab());
    settle();
    expect(month()).toBe('2030-10');
    expect(push).not.toHaveBeenCalled();
    // Other parameters stay as they were.
    expect(new URLSearchParams(window.location.search).get('view')).toBe('calendar');
    push.mockRestore();
  });

  it('follows the Week on show into another month', () => {
    renderPage(WEEK);
    press('Next week');
    settle();
    expect(month()).toBe('2030-12');
  });

  it('a linked past event that comes later does not move a linked month', () => {
    pastEvents.state = { data: undefined, isError: false, isFetching: true, fetchStatus: 'fetching' };
    const { rerender } = renderPage(`${MONTH}&month=2030-03&event=p-jan`);
    expect(label()).toBe('March 2030');
    pastEvents.state = { data: past(), isError: false, isFetching: false };
    rerender(
      <AllEventsPage
        result={{ ok: true, items: upcoming() }}
        signedIn={false}
        viewerUid={null}
        memberCity={undefined}
        serverNow={NOW}
        serverTodayIso={TODAY}
        submitHref="https://irl.example/submit"
      />,
    );
    expect(label()).toBe('March 2030');
  });

  it.each([MONTH, `${MONTH}&month=2030-12`, '/events/all?month=2030-12'])(
    'is never in the Embed link: an embed opens on today (%s, after a move)',
    async (url) => {
      renderPage(url);
      if (url.includes('view=calendar')) press('Next month');
      settle();
      fireEvent.click(screen.getByRole('button', { name: 'Embed' }));
      await act(async () => void jest.advanceTimersByTime(500));
      expect(screen.getByRole('dialog').querySelector('iframe')?.getAttribute('src')).not.toContain('month=');
    },
  );

  it('opens the embed on that month, and its link to the page keeps the month on show', () => {
    renderPage('/events/embed?view=calendar&cal=month&month=2031-01', { embed: true });
    expect(label()).toBe('January 2031');
    expect(card('jan')).not.toBeNull();
    const foot = () => screen.getByRole('link', { name: /All events on PL Directory/ });
    expect(foot()).toHaveAttribute('href', '/events/all?view=calendar&cal=month&month=2031-01');
    press('Next month');
    settle();
    expect(foot()).toHaveAttribute('href', '/events/all?view=calendar&cal=month&month=2031-02');
  });

  it('an embed with no month links to the page with none, until its calendar moves', () => {
    renderPage('/events/embed?view=calendar&cal=month', { embed: true });
    const foot = () => screen.getByRole('link', { name: /All events on PL Directory/ });
    expect(foot()).toHaveAttribute('href', '/events/all?view=calendar&cal=month');
    press('Previous month');
    settle();
    expect(foot()).toHaveAttribute('href', '/events/all?view=calendar&cal=month&month=2030-10');
  });
});

describe('Back and Forward', () => {
  const goBackTo = (url: string) => {
    window.history.replaceState(null, '', url);
    act(() => void window.dispatchEvent(new PopStateEvent('popstate')));
    settle();
  };

  it('take the calendar to the month of that address, and the tab with it', () => {
    renderPage(MONTH);
    press('Next month');
    settle();
    expect(month()).toBe('2030-12');
    goBackTo(`${MONTH}&month=2030-10`);
    expect(label()).toBe('October 2030');
    expect(selected()).toBe('past');
    // The calendar is where the address says: nothing is written back.
    expect(month()).toBe('2030-10');
    goBackTo(`${MONTH}&month=2031-01`);
    expect(label()).toBe('January 2031');
    expect(selected()).toBe('live');
  });

  it('to an address with no month, take it to where it opens: today', () => {
    renderPage(MONTH);
    press('Previous month');
    press('Previous month');
    settle();
    goBackTo(MONTH);
    expect(label()).toBe('November 2030');
    expect(selected()).toBe('live');
    expect(month()).toBeNull();
  });

  it('a move that also adds an entry (Week | Month) leaves the entry before on the month it showed', () => {
    const writes: string[] = [];
    const push = jest.spyOn(window.history, 'pushState').mockImplementation(function (this: History, ...args) {
      writes.push(`push ${String(args[2])}`);
      return History.prototype.pushState.apply(this, args);
    });
    const replace = jest.spyOn(window.history, 'replaceState').mockImplementation(function (this: History, ...args) {
      writes.push(`replace ${String(args[2])}`);
      return History.prototype.replaceState.apply(this, args);
    });
    renderPage(MONTH);
    settle();
    press('Next month');
    settle();
    writes.length = 0;
    fireEvent.click(screen.getByRole('tab', { name: 'Week' }));
    settle();
    // The new Week entry is pushed with December, then gets this week's month; the Month entry keeps December.
    expect(writes).toEqual([
      'push /events/all?view=calendar&cal=week&month=2030-12',
      'replace /events/all?view=calendar&cal=week&month=2030-11',
    ]);
    push.mockRestore();
    replace.mockRestore();
  });

  it('then a move writes the month again', () => {
    renderPage(MONTH);
    press('Next month');
    settle();
    goBackTo(`${MONTH}&month=2030-10`);
    press('Next month');
    settle();
    expect(month()).toBe('2030-11');
  });
});

describe('a link to a past month in Week, before past events have loaded', () => {
  const jun = () => [...past(), on('p-jun', '2030-06-20')];
  const late = (rerender: (ui: React.ReactElement) => void) => {
    pastEvents.state = { data: jun(), isError: false, isFetching: false };
    rerender(
      <AllEventsPage
        result={{ ok: true, items: upcoming() }}
        signedIn={false}
        viewerUid={null}
        memberCity={undefined}
        serverNow={NOW}
        serverTodayIso={TODAY}
        submitHref="https://irl.example/submit"
      />,
    );
  };

  it('opens on the week of the 1st, then on the month’s first event when they come', () => {
    pastEvents.state = { data: undefined, isError: false, isFetching: true, fetchStatus: 'fetching' };
    const { rerender } = renderPage(`${WEEK}&month=2030-06`);
    expect(label()).toBe('May 27 – Jun 2, 2030');
    late(rerender);
    expect(label()).toBe('Jun 17 – Jun 23, 2030');
    expect(card('p-jun')).not.toBeNull();
  });

  it('stays where the visitor moved it', () => {
    pastEvents.state = { data: undefined, isError: false, isFetching: true, fetchStatus: 'fetching' };
    const { rerender } = renderPage(`${WEEK}&month=2030-06`);
    press('Next week');
    late(rerender);
    expect(label()).toBe('Jun 3 – Jun 9, 2030');
  });
});

describe('a city chosen after a move', () => {
  const items = () => [...upcoming(), on('paris', '2031-03-05', { city: 'Paris' })];
  const choose = (key: string, value: string | undefined) =>
    act(() => useAllEventsFilterStore.getState().setParam(key, value));

  it('opens on that city’s first event, and the month leaves the address', () => {
    renderPage(MONTH, { result: { ok: true, items: items() } });
    settle();
    press('Next month');
    settle();
    expect(month()).toBe('2030-12');
    choose('city', 'Paris');
    settle();
    expect(label()).toBe('March 2031');
    expect(card('paris')).not.toBeNull();
    expect(month()).toBeNull();
    expect(new URLSearchParams(window.location.search).get('city')).toBe('Paris');
  });

  it('clearing it opens on today', () => {
    renderPage(`${MONTH}&city=Paris`, { result: { ok: true, items: items() } });
    settle();
    expect(label()).toBe('March 2031');
    press('Next month');
    settle();
    choose('city', undefined);
    settle();
    expect(label()).toBe('November 2030');
    expect(month()).toBeNull();
  });

  it('Clear all with a city drops the month too, and opens on today', () => {
    renderPage(`${MONTH}&city=Paris&search=Event`, { result: { ok: true, items: items() } });
    settle();
    expect(label()).toBe('March 2031');
    press('Next month');
    settle();
    expect(month()).toBe('2031-04');
    fireEvent.click(within(screen.getByLabelText('Applied filters')).getByRole('button', { name: 'Clear all' }));
    settle();
    expect(label()).toBe('November 2030');
    expect(month()).toBeNull();
    const address = new URLSearchParams(window.location.search);
    expect(address.has('city')).toBe(false);
    expect(address.get('view')).toBe('calendar');
  });

  it('another filter keeps the month', () => {
    renderPage(MONTH, { result: { ok: true, items: items() } });
    settle();
    press('Next month');
    settle();
    choose('mode', 'Online');
    settle();
    expect(month()).toBe('2030-12');
  });
});

describe('"Events I\'m going to" in Calendar (P14)', () => {
  it('keeps its words on a past month: the tab follows the calendar, the label does not', () => {
    going.uids = ['dec'];
    renderPage(`${MONTH}&going=true`, { signedIn: true, viewerUid: 'm1' });
    const chip = () =>
      within(screen.getByLabelText('Applied filters')).getByRole('button', { name: /^Remove filter Events I/ });
    expect(chip()).toHaveAccessibleName("Remove filter Events I'm going to");
    press('Previous month');
    settle();
    expect(selected()).toBe('past');
    expect(chip()).toHaveAccessibleName("Remove filter Events I'm going to");
    fireEvent.click(document.querySelector('[aria-controls="events-filters"]') as HTMLElement);
    const rail = document.getElementById('events-filters') as HTMLElement;
    expect(within(rail).getByText(/^Events I'm going to/)).toBeInTheDocument();
    expect(within(rail).queryByText(/Events I went to/)).toBeNull();
  });
});

describe('with nothing to show', () => {
  it('the tab is Live & upcoming, and a press moves and records nothing', () => {
    renderPage(MONTH);
    press('Previous month');
    expect(selected()).toBe('past');
    act(() => useAllEventsFilterStore.getState().setParam('search', 'zzz'));
    expect(screen.getByText('No live or upcoming events match')).toBeInTheDocument();
    expect(selected()).toBe('live');
    jest.clearAllMocks();
    fireEvent.click(pastTab());
    expect(selected()).toBe('live');
    expect(analytics.onEventsWhenChanged).not.toHaveBeenCalled();
  });
});

describe('the month picker', () => {
  it('opens a year of months from the pill, marks the months with events, and goes to the one picked', async () => {
    renderPage(MONTH);
    expect(pill()).toHaveAccessibleName('November 2030: go to a month');
    const popup = await openPicker();
    expect(within(popup).getByTestId('picker-year')).toHaveTextContent('2030');
    const busy = within(popup)
      .getAllByRole('img', { name: 'has events' })
      .map((dot) => dot.parentElement?.textContent);
    expect(busy).toEqual(['Jan', 'Nov', 'Dec']);
    expect(within(popup).getByRole('button', { name: /^November 2030/ })).toHaveAttribute('data-active', 'true');

    fireEvent.click(within(popup).getByRole('button', { name: 'Previous year' }));
    expect(within(popup).getByTestId('picker-year')).toHaveTextContent('2029');
    fireEvent.click(within(popup).getByRole('button', { name: /^December 2029/ }));
    await act(async () => void jest.advanceTimersByTime(500));

    expect(screen.queryByRole('dialog', { name: 'Go to a month' })).toBeNull();
    expect(label()).toBe('December 2029');
    expect(selected()).toBe('past');
    settle();
    expect(month()).toBe('2029-12');
  });

  it('names its months in English, whatever the browser’s language', async () => {
    renderPage(MONTH);
    const popup = await openPicker();
    expect(popup.querySelector('.react-calendar')).toHaveAttribute('data-locale', 'en-US');
  });

  it('closes on a press outside', async () => {
    renderPage(MONTH);
    await openPicker();
    fireEvent.pointerDown(document.body);
    fireEvent.mouseDown(document.body);
    fireEvent.click(document.body);
    await act(async () => void jest.advanceTimersByTime(500));
    expect(screen.queryByRole('dialog', { name: 'Go to a month' })).toBeNull();
  });

  it('reopens on the calendar’s year', async () => {
    renderPage(MONTH);
    let popup = await openPicker();
    fireEvent.click(within(popup).getByRole('button', { name: 'Next year' }));
    expect(within(popup).getByTestId('picker-year')).toHaveTextContent('2031');
    fireEvent.keyDown(popup, { key: 'Escape' });
    await act(async () => void jest.advanceTimersByTime(500));
    popup = await openPicker();
    expect(within(popup).getByTestId('picker-year')).toHaveTextContent('2030');
  });

  it('closes on Escape and gives focus back to the pill', async () => {
    renderPage(MONTH);
    pill().focus();
    const popup = await openPicker();
    expect(popup).toBeInTheDocument();
    fireEvent.keyDown(popup, { key: 'Escape' });
    await act(async () => void jest.advanceTimersByTime(500));
    expect(screen.queryByRole('dialog', { name: 'Go to a month' })).toBeNull();
    expect(pill()).toHaveFocus();
    expect(label()).toBe('November 2030');
  });

  it('in Week, names the week’s month and lands on the picked month’s first event', async () => {
    renderPage(WEEK);
    expect(pill()).toHaveTextContent('November 2030');
    const popup = await openPicker();
    fireEvent.click(within(popup).getByRole('button', { name: /^January 2030/ }));
    await act(async () => void jest.advanceTimersByTime(500));
    expect(label()).toBe('Dec 31 – Jan 6, 2030');
    expect(card('p-jan')).not.toBeNull();
  });
});

describe('month helpers', () => {
  it('reads `?month=` back', () => {
    expect(parseMonthKey('2026-03')).toEqual({ year: 2026, month: 2 });
    expect(parseMonthKey('2026-12')).toEqual({ year: 2026, month: 11 });
    expect(parseMonthKey(null)).toBeNull();
  });

  it('marks every month an event touches, over a new year too', () => {
    const keys = monthsWithEvents([
      on('a', '2029-11-28', { endDay: '2030-02-01' }),
      on('b', '2030-05-05'),
      // An end before its start counts as its first day only.
      on('c', '2030-08-10', { endDay: '2030-08-01' }),
    ]);
    expect(Array.from(keys).sort()).toEqual(['2029-11', '2029-12', '2030-01', '2030-02', '2030-05', '2030-08']);
  });
});

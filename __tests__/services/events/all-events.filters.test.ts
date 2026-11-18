import {
  countAppliedFilters,
  dayHeading,
  dayOfSpan,
  facetOptions,
  filterEvents,
  groupByDay,
  nearYou,
  readFilters,
  spanLabel,
  topCities,
} from '@/services/events/all-events.filters';
import { allEventsItem as item } from '@/services/events/all-events.fixtures';

/* LAB-3247 (design D4): the All Events page's pure views over the loaded events. */

const lisbon = item({ uid: 'lis', name: 'LabWeek Lisbon', hosts: ['Protocol Labs'], tags: ['Storage'] });
const online = item({ uid: 'onl', name: 'Community Call', mode: 'Virtual', city: null });
const hybrid = item({ uid: 'hyb', name: 'FIL Dev Summit', mode: 'Hybrid', city: 'Dubai' });

const params = (q: string) => new URLSearchParams(q);

describe('filterEvents', () => {
  const all = [lisbon, online, hybrid];
  const run = (q: string, going: string[] = []) =>
    filterEvents(all, readFilters(params(q)), new Set(going)).map((e) => e.uid);

  it('searches names, cities, hosts and topics', () => {
    expect(run('search=summit')).toEqual(['hyb']);
    expect(run('search=dubai')).toEqual(['hyb']);
    expect(run('search=protocol')).toEqual(['lis']);
    expect(run('search=storage')).toEqual(['lis']);
  });

  it('filters by mode, OR within the filter', () => {
    expect(run('mode=Virtual')).toEqual(['onl']);
    expect(run('mode=Virtual|Hybrid')).toEqual(['onl', 'hyb']);
  });

  it('filters by city, case-insensitively', () => {
    expect(run('city=dubai')).toEqual(['hyb']);
  });

  it('keeps only the events the viewer is going to', () => {
    expect(run('going=true', ['lis', 'hyb'])).toEqual(['lis', 'hyb']);
  });

  it('ANDs filters together', () => {
    expect(run('mode=Hybrid&city=Lisbon')).toEqual([]);
  });

  it('counts each applied value, never the view, calendar mode or open event', () => {
    expect(countAppliedFilters(params('search=x&going=true&mode=Virtual|Hybrid&city=Dubai'))).toBe(5);
    expect(countAppliedFilters(params('view=calendar&cal=month&event=e1'))).toBe(0);
  });

  it('lists facet options with counts, most first', () => {
    expect(facetOptions([lisbon, hybrid, item({ uid: 'x' })], 'city')).toEqual([
      { value: 'Lisbon', count: 2, disabled: false },
      { value: 'Dubai', count: 1, disabled: false },
    ]);
    expect(facetOptions([lisbon, online], 'mode').map((o) => o.value)).toEqual(['In person', 'Virtual']);
  });
});

describe('days', () => {
  const twoDay = item({ uid: 'two', startDay: '2030-12-03', endDay: '2030-12-04' });

  it('groups by start day, an event under way sits on today', () => {
    const under = item({
      uid: 'under',
      startDay: '2030-12-01',
      endDay: '2030-12-05',
      startDate: '2030-12-01T09:00:00Z',
    });
    const later = item({
      uid: 'later',
      startDay: '2030-12-07',
      endDay: '2030-12-07',
      startDate: '2030-12-07T09:00:00Z',
    });
    expect(groupByDay([later, under, twoDay], '2030-12-03')).toEqual([
      { day: '2030-12-03', events: [under, twoDay] },
      { day: '2030-12-07', events: [later] },
    ]);
  });

  it('reads "Day n of m" for multi-day events only', () => {
    expect(dayOfSpan(twoDay, '2030-12-03')).toBe('Day 1 of 2');
    expect(dayOfSpan(twoDay, '2030-12-04')).toBe('Day 2 of 2');
    expect(dayOfSpan(lisbon, '2030-12-03')).toBe('');
  });

  it('labels days and spans as the prototype does', () => {
    expect(dayHeading('2030-12-03', '2030-12-03')).toEqual({ label: 'Today', weekday: 'Tuesday' });
    expect(dayHeading('2030-12-04', '2030-12-03').label).toBe('Tomorrow');
    expect(dayHeading('2030-12-05', '2030-12-03')).toEqual({ label: 'Dec 5', weekday: 'Thursday' });
    expect(spanLabel('2030-12-01', '2030-12-05')).toBe('Dec 1 – 5');
    expect(spanLabel('2030-11-30', '2030-12-02')).toBe('Nov 30 – Dec 2');
    expect(spanLabel('2031-01-14', '2031-01-14')).toBe('Jan 14');
  });
});

describe('topCities', () => {
  it('orders by event count, then by the earliest start; online events have no city', () => {
    const cities = topCities([
      item({ uid: 'a', city: 'Paris', startDay: '2030-12-09' }),
      item({ uid: 'b', city: 'Dubai', startDay: '2030-12-05' }),
      item({ uid: 'c', city: 'Lisbon', startDay: '2030-12-10' }),
      item({ uid: 'd', city: 'Lisbon', startDay: '2030-12-02', endDay: '2030-12-12' }),
      online,
    ]);
    expect(cities.map((c) => [c.city, c.eventCount])).toEqual([
      ['Lisbon', 2],
      ['Dubai', 1],
      ['Paris', 1],
    ]);
    expect(cities[0]).toMatchObject({ startDay: '2030-12-02', endDay: '2030-12-12' });
  });
});

describe('nearYou', () => {
  const lisbonEvents = [1, 2, 3, 4].map((n) =>
    item({ uid: `l${n}`, startDate: `2030-12-0${n}T09:00:00Z`, startDay: `2030-12-0${n}` }),
  );

  it('matches the member city loosely and shows the 3 soonest in-person events', () => {
    for (const memberCity of ['Lisbon', 'lisbon, portugal', ' LISBON ']) {
      const near = nearYou([...lisbonEvents].reverse(), memberCity);
      expect(near?.city).toBe('Lisbon');
      expect(near?.events.map((e) => e.uid)).toEqual(['l1', 'l2', 'l3']);
    }
  });

  it('is null without a city, without a match, or when the only match is online', () => {
    expect(nearYou(lisbonEvents, null)).toBeNull();
    expect(nearYou(lisbonEvents, 'Berlin')).toBeNull();
    expect(nearYou([item({ mode: 'Virtual' })], 'Lisbon')).toBeNull();
  });
});

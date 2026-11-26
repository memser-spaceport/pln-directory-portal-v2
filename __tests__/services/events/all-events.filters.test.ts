import {
  countAppliedFilters,
  dayHeading,
  dayOfSpan,
  embedQuery,
  facetLabel,
  facetOptions,
  filterEvents,
  groupByDay,
  groupPastByDay,
  inYear,
  isFilterParam,
  nearYou,
  pastCitySummary,
  pastDayHeading,
  pastLandingQuery,
  pastSpanLabel,
  pastYears,
  readFilters,
  readYear,
  sharedZone,
  sortPast,
  spanLabel,
  startLabel,
  timeRange,
  topCities,
  whenLine,
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
    expect(run('mode=Online')).toEqual(['onl']);
    expect(run('mode=Online|Hybrid')).toEqual(['onl', 'hyb']);
  });

  it('filters by city, case-insensitively', () => {
    expect(run('city=dubai')).toEqual(['hyb']);
  });

  it('keeps only the events the viewer is going to', () => {
    expect(run('going=true', ['lis', 'hyb'])).toEqual(['lis', 'hyb']);
  });

  it('keeps only featured events when Featured is on', () => {
    const featured = item({ uid: 'fea', featured: true });
    const uids = (q: string) => filterEvents([...all, featured], readFilters(params(q)), new Set()).map((e) => e.uid);
    expect(uids('featured=true')).toEqual(['fea']);
    expect(uids('featured=true&mode=Virtual')).toEqual([]);
    expect(uids('featured=false')).toHaveLength(4);
  });

  it('reads every filter back from a page address', () => {
    const address =
      'search=lab&going=true&featured=true&mode=Hybrid&access=Paid|Free&focus=FA3&topic=Talks&city=Lisbon&host=PL&view=map';
    expect(readFilters(params(address))).toEqual({
      search: 'lab',
      going: true,
      featured: true,
      mode: ['Hybrid'],
      access: ['Paid', 'Free'],
      focus: ['FA3'],
      topic: ['Talks'],
      city: ['Lisbon'],
      host: ['PL'],
    });
    expect(countAppliedFilters(params(address))).toBe(10);
  });

  it('ANDs filters together', () => {
    expect(run('mode=Hybrid&city=Lisbon')).toEqual([]);
  });

  describe('Access type, Focus area, Topic and Host (from the event details)', () => {
    const paid = item({
      uid: 'paid',
      access: 'PAID',
      hosts: ['Filecoin Foundation', 'Protocol Labs'],
      focusAreas: ['FA4'],
      tags: ['AI'],
    });
    const invite = item({
      uid: 'inv',
      access: 'INVITE ONLY',
      hosts: ['Protocol Labs'],
      focusAreas: ['FA3', 'FA4'],
      tags: ['Storage', 'AI'],
    });
    const bare = item({ uid: 'bare' });
    const many = [paid, invite, bare];
    const pick = (q: string) => filterEvents(many, readFilters(params(q)), new Set()).map((e) => e.uid);

    it('an RSVP event reads "RSVP", and links made when it read "Free" still find it (LAB-3407)', () => {
      const rsvp = item({ uid: 'rsvp', access: 'FREE w/ RSVP' });
      const found = (query: string) =>
        filterEvents([rsvp, paid], readFilters(params(query)), new Set()).map((e) => e.uid);
      expect(found('access=Free')).toEqual(['rsvp']);
      expect(found('access=free|Paid')).toEqual(['rsvp', 'paid']);
      expect(facetOptions([rsvp, paid], 'access').map((o) => facetLabel('access', o.value))).toEqual(['Paid', 'RSVP']);
      expect(facetLabel('access', 'free')).toBe('RSVP');
      // Only there: a topic called "Free" stays as it is.
      expect(facetLabel('topic', 'Free')).toBe('Free');
    });

    it('filters by access, in the words the cards use', () => {
      expect(pick('access=Paid')).toEqual(['paid']);
      expect(pick('access=Paid|Invite only')).toEqual(['paid', 'inv']);
    });

    it('filters by focus area code and by topic, apart (LAB-3404)', () => {
      expect(pick('focus=FA3')).toEqual(['inv']);
      expect(pick('focus=FA3|FA4')).toEqual(['paid', 'inv']);
      expect(pick('topic=storage')).toEqual(['inv']);
      expect(pick('focus=FA4&topic=Storage')).toEqual(['inv']);
      expect(pick('focus=AI')).toEqual([]);
      expect(pick('topic=FA4')).toEqual([]);
    });

    it('finds an event by its focus area name, never by the code (LAB-3404)', () => {
      expect(pick('search=robotics')).toEqual(['inv']);
      expect(pick('search=Neurotech')).toEqual(['paid', 'inv']);
      expect(pick('search=FA4')).toEqual([]);
    });

    it('keeps the code in the link and shows the name (LAB-3404)', () => {
      expect(facetLabel('focus', 'FA4')).toBe('Neurotech');
      expect(facetLabel('topic', 'AI')).toBe('AI');
      expect(embedQuery(params('view=map&focus=FA4&topic=AI&going=true'))).toBe('view=map&focus=FA4&topic=AI');
    });

    it('filters by any of the hosts, case-insensitively', () => {
      expect(pick('host=Filecoin Foundation')).toEqual(['paid']);
      expect(pick('host=protocol labs&access=Invite only')).toEqual(['inv']);
    });

    it('never matches an event without details once one of them is applied', () => {
      expect(pick('host=Protocol Labs')).not.toContain('bare');
      expect(pick('')).toContain('bare');
    });

    it('lists their options with counts; an event without details adds none', () => {
      expect(facetOptions(many, 'access').map((o) => o.value)).toEqual(['Invite only', 'Paid']);
      expect(facetOptions(many, 'focus')).toEqual([
        { value: 'FA4', count: 2, disabled: false },
        { value: 'FA3', count: 1, disabled: false },
      ]);
      expect(facetOptions(many, 'topic')).toEqual([
        { value: 'AI', count: 2, disabled: false },
        { value: 'Storage', count: 1, disabled: false },
      ]);
      expect(facetOptions(many, 'host').map((o) => [o.value, o.count])).toEqual([
        ['Protocol Labs', 2],
        ['Filecoin Foundation', 1],
      ]);
      expect(facetOptions([bare], 'access')).toEqual([]);
    });
  });

  it('counts each applied value, never the view, calendar mode or open event', () => {
    expect(countAppliedFilters(params('search=x&going=true&mode=Online|Hybrid&city=Dubai'))).toBe(5);
    expect(countAppliedFilters(params('access=Paid&focus=FA3|FA4&topic=AI&host=Protocol Labs'))).toBe(5);
    expect(countAppliedFilters(params('view=calendar&cal=month&event=e1'))).toBe(0);
  });

  it('lists facet options with counts, most first', () => {
    expect(facetOptions([lisbon, hybrid, item({ uid: 'x' })], 'city')).toEqual([
      { value: 'Lisbon', count: 2, disabled: false },
      { value: 'Dubai', count: 1, disabled: false },
    ]);
    expect(facetOptions([lisbon, online], 'mode').map((o) => o.value)).toEqual(['In person', 'Online']);
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

  it.each([
    ['a viewer east of the event, already on the day after its last', '2030-12-04', '2030-12-05', 'Day 2 of 2'],
    ['a page left open past the end', '2030-12-24', '2030-12-28', 'Day 22 of 22'],
    ['a day before the first', '2030-12-04', '2030-12-02', 'Day 1 of 2'],
    ['an end before the start', '2030-12-01', '2030-12-03', ''],
  ])('keeps the day number between 1 and the total: %s', (_, endDay, day, text) => {
    expect(dayOfSpan(item({ startDay: '2030-12-03', endDay }), day)).toBe(text);
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

  it('matches a city-state saved as a country (Singapore), and a country with no event city matches nothing', () => {
    const singapore = item({ uid: 'sg', city: 'Singapore', cityKey: 'singapore' });
    expect(nearYou([singapore], 'Singapore')?.events.map((e) => e.uid)).toEqual(['sg']);
    expect(nearYou([singapore], 'Slovenia')).toBeNull();
  });

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

describe('Past (LAB-3418)', () => {
  const on = (uid: string, startDay: string, hour = 9, endDay = startDay) =>
    item({
      uid,
      startDay,
      endDay,
      startDate: `${startDay}T${String(hour).padStart(2, '0')}:00:00.000Z`,
      endDate: `${endDay}T23:00:00.000Z`,
    });
  const mixed = [
    on('jan', '2030-01-02'),
    on('dec-late', '2029-12-31', 19),
    on('dec-early', '2029-12-31', 8),
    on('newyear', '2029-12-30', 9, '2030-01-03'),
    on('nov', '2030-11-12'),
  ];

  it('sorts newest first by first day, then by start, whatever the order it came in', () => {
    const order = ['nov', 'jan', 'dec-late', 'dec-early', 'newyear'];
    expect(sortPast(mixed).map((e) => e.uid)).toEqual(order);
    expect(sortPast([...mixed].reverse()).map((e) => e.uid)).toEqual(order);
  });

  // Each is in one year by its first day, and in the other by its start instant.
  const tokyo = { ...on('tokyo', '2030-01-01'), startDate: '2029-12-31T15:30:00.000Z' };
  const newYork = { ...on('new-york', '2029-12-31'), startDate: '2030-01-01T01:00:00.000Z' };

  it('a first day is the event’s own, not that of its start instant: for the order and for the year', () => {
    expect(sortPast([newYork, tokyo]).map((e) => e.uid)).toEqual(['tokyo', 'new-york']);
    expect(inYear([newYork, tokyo], '2030').map((e) => e.uid)).toEqual(['tokyo']);
    expect(inYear([newYork, tokyo], '2029').map((e) => e.uid)).toEqual(['new-york']);
    expect(pastYears([tokyo])).toEqual(['2030']);
    expect(pastYears([newYork])).toEqual(['2029']);
  });

  it('groups by first day, newest first: an event across days stays on its first', () => {
    expect(groupPastByDay(mixed).map(({ day, events }) => [day, events.map((e) => e.uid)])).toEqual([
      ['2030-11-12', ['nov']],
      ['2030-01-02', ['jan']],
      ['2029-12-31', ['dec-late', 'dec-early']],
      ['2029-12-30', ['newyear']],
    ]);
  });

  it('heads a day with its year outside the current one', () => {
    expect(pastDayHeading('2030-01-02', '2030-11-25')).toEqual({ label: 'Jan 2', weekday: 'Wednesday' });
    expect(pastDayHeading('2029-12-31', '2030-11-25')).toEqual({ label: 'Dec 31, 2029', weekday: 'Monday' });
    expect(pastDayHeading('2029-12-31', '2030-01-01').label).toBe('Dec 31, 2029');
    expect(pastDayHeading('2030-11-25', '2030-11-25').label).toBe('Today');
  });

  it('prints a span with its year outside the current one, and both years over New Year', () => {
    const span = (from: string, to: string) => pastSpanLabel(from, to, '2030-11-25');
    expect(span('2030-11-12', '2030-11-12')).toBe('Nov 12');
    expect(span('2030-11-12', '2030-11-15')).toBe('Nov 12 – 15');
    expect(span('2029-11-12', '2029-11-12')).toBe('Nov 12, 2029');
    expect(span('2029-11-30', '2029-12-02')).toBe('Nov 30 – Dec 2, 2029');
    expect(span('2029-12-30', '2030-01-03')).toBe('Dec 30, 2029 – Jan 3, 2030');
  });

  it('sums up a city from its first to its last day, with the newest event’s zone', () => {
    const events = [
      { ...on('new', '2030-11-12'), zone: 'UTC+1' },
      { ...on('old', '2029-06-01', 9, '2029-06-04'), zone: 'UTC+2' },
    ];
    expect(pastCitySummary('Lisbon', events)).toEqual({
      city: 'Lisbon',
      eventCount: 2,
      startDay: '2029-06-01',
      endDay: '2030-11-12',
      zone: 'UTC+1',
    });
    expect(pastCitySummary('Lisbon', [])).toBeUndefined();
  });

  it('an event’s year is that of its first day', () => {
    expect(pastYears(mixed)).toEqual(['2030', '2029']);
    expect(pastYears([on('newyear', '2029-12-30', 9, '2030-01-03')])).toEqual(['2029']);
    expect(inYear(mixed, '2029').map((e) => e.uid)).toEqual(['dec-late', 'dec-early', 'newyear']);
    expect(inYear(mixed, '2030').map((e) => e.uid)).toEqual(['jan', 'nov']);
    expect(inYear(mixed, '2019')).toEqual([]);
    expect(inYear(mixed, null)).toBe(mixed);
  });

  it('reads the year in the address, and nothing but four digits', () => {
    expect(readYear(params('year=2029'))).toBe('2029');
    ['', 'year=', 'year=all', 'year=29', 'year=20299', 'year=2029-01', 'year=%202029'].forEach((q) =>
      expect(readYear(params(q))).toBeNull(),
    );
  });

  it('`when` and `year` are no filters, and the embed link carries them after the view', () => {
    const address = params('year=2029&when=past&mode=Online&going=true&event=e1&view=map');
    expect(['when', 'year'].filter(isFilterParam)).toEqual([]);
    expect(countAppliedFilters(address)).toBe(2); // Mode and "Events I'm going to".
    expect(embedQuery(address)).toBe('view=map&when=past&year=2029&mode=Online');
    expect(embedQuery(params('view=map&mode=Online'))).toBe('view=map&mode=Online');
  });
});

describe('pastLandingQuery (LAB-3418)', () => {
  it('is the page’s state on a link to Past, but the open event', () => {
    expect(pastLandingQuery({ when: 'past' })).toBe('when=past');
    expect(
      pastLandingQuery({
        event: 'e1',
        going: 'true',
        year: '2025',
        when: 'past',
        view: 'map',
        search: 'a b',
        other: 'x',
      }),
    ).toBe('view=map&when=past&year=2025&search=a+b&going=true');
  });

  it('takes the first of a repeated key, as the browser’s read does', () => {
    expect(pastLandingQuery({ when: ['past', 'x'], year: ['2025', '2024'] })).toBe('when=past&year=2025');
    expect(pastLandingQuery({ when: ['x', 'past'] })).toBe('');
  });

  it('is empty for any other address, and for the Calendar, which has no Past', () => {
    [{}, { when: undefined }, { when: 'upcoming' }, { year: '2025' }, { when: 'past', view: 'calendar' }].forEach((q) =>
      expect(pastLandingQuery(q)).toBe(''),
    );
  });
});

describe('all-day events', () => {
  const timed = item({ startTime: '9:00 AM', endTime: '6:00 PM', zone: 'UTC+5:30' });
  const oneDay = item({ allDay: true, startTime: '', endTime: '', zone: '' });
  const threeDays = item({
    allDay: true,
    startDay: '2030-07-24',
    endDay: '2030-07-26',
    startTime: '',
    endTime: '',
    zone: '',
  });

  it('prints a timed event with its start, end and zone', () => {
    expect(startLabel(timed)).toBe('9:00 AM UTC+5:30');
    expect(timeRange(timed)).toBe('9:00 AM – 6:00 PM');
    expect(whenLine(timed, '2030-01-01')).toBe('Tue, Dec 3 · 9:00 AM');
  });

  it('prints a one-day all-day event with its day and no time', () => {
    expect(startLabel(oneDay)).toBe('');
    expect(timeRange(oneDay)).toBe('');
    expect(whenLine(oneDay, '2030-01-01')).toBe('Tue, Dec 3');
    expect(whenLine(oneDay, '2030-12-03')).toBe('Today');
  });

  it('prints a three-day all-day event as "Day n of 3" and its span, with no time', () => {
    expect(startLabel(threeDays)).toBe('');
    expect(dayOfSpan(threeDays, '2030-07-24')).toBe('Day 1 of 3');
    expect(whenLine(threeDays, '2030-01-01')).toBe('Wed, Jul 24 – 26');
    expect(spanLabel(threeDays.startDay, threeDays.endDay)).toBe('Jul 24 – 26');
  });

  it('takes a city’s zone from its first event that has a time', () => {
    expect(topCities([oneDay, timed])[0].zone).toBe('UTC+5:30');
    expect(topCities([oneDay])[0].zone).toBe('');
  });

  it('Past: a city’s zone and the shared zone skip the all-day events, which have none (LAB-3418)', () => {
    expect(pastCitySummary('Lisbon', [oneDay, timed])?.zone).toBe('UTC+5:30');
    expect(pastCitySummary('Lisbon', [oneDay])?.zone).toBe('');
    expect(sharedZone([oneDay, timed, threeDays])).toBe('UTC+5:30');
    expect(sharedZone([oneDay])).toBeNull();
  });
});

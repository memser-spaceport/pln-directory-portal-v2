import { eventWhen, eventsAppEventHref, utcZone } from '@/services/events/event-when';
import { agendaDayTitle } from '@/components/page/events/EventDrawer/EventSummary';

describe('eventWhen (LAB-3361)', () => {
  it('one day: the weekday and date, and the hours with the zone, in the event zone', () => {
    // 23:00 UTC is 6 PM in New York (UTC−5 in November).
    expect(eventWhen('2026-11-19T23:00:00.000Z', '2026-11-20T02:00:00.000Z', 'America/New_York')).toEqual({
      month: 'NOV',
      day: '19',
      dayLine: 'Thursday, November 19',
      timeLine: '6:00 PM – 9:00 PM · UTC−5',
    });
  });

  it('across days: both ends, short', () => {
    const when = eventWhen('2030-12-01T09:00:00.000Z', '2030-12-05T18:00:00.000Z', 'Europe/Lisbon');
    expect(when?.dayLine).toBe('Sun, Dec 1 – Thu, Dec 5');
    expect(when?.timeLine).toBe('9:00 AM – 6:00 PM · UTC+0');
  });

  it('reads the day in the event zone, not the viewer one', () => {
    // 01:00 UTC on the 20th is still the 19th in San Francisco.
    expect(eventWhen('2026-11-20T01:00:00.000Z', '2026-11-20T03:00:00.000Z', 'America/Los_Angeles')?.day).toBe('19');
  });

  it('a missing end reads as the start', () => {
    expect(eventWhen('2026-11-19T10:00:00.000Z', '', 'UTC')?.timeLine).toBe('10:00 AM – 10:00 AM · UTC+0');
  });

  describe('an event that has ended (LAB-3418)', () => {
    const NOW = Date.UTC(2026, 10, 25, 12);
    const line = (start: string, end: string, zone = 'UTC', now: number | undefined = NOW) =>
      eventWhen(start, end, zone, false, now)?.dayLine;

    it('last year: the year, on one day and across days of one year', () => {
      expect(line('2025-11-04T18:00:00.000Z', '2025-11-04T20:00:00.000Z')).toBe('Tuesday, November 4, 2025');
      expect(line('2025-06-30T09:00:00.000Z', '2025-07-04T18:00:00.000Z')).toBe('Mon, Jun 30 – Fri, Jul 4, 2025');
    });

    it('this year: as ever', () => {
      expect(line('2026-11-19T18:00:00.000Z', '2026-11-19T20:00:00.000Z')).toBe('Thursday, November 19');
      expect(line('2026-10-01T09:00:00.000Z', '2026-10-05T18:00:00.000Z')).toBe('Thu, Oct 1 – Mon, Oct 5');
    });

    it('over New Year: a year on each end, also when one of them is this year', () => {
      const newYear = ['2024-12-30T09:00:00.000Z', '2025-01-02T18:00:00.000Z'] as const;
      expect(line(...newYear)).toBe('Mon, Dec 30, 2024 – Thu, Jan 2, 2025');
      expect(line(...newYear, 'UTC', Date.UTC(2025, 0, 3))).toBe('Mon, Dec 30, 2024 – Thu, Jan 2, 2025');
    });

    it('reads the event’s year and the current year in the line’s own zone', () => {
      // 02:00 UTC on Jan 1 is still Dec 31, 2025 in New York: for the event…
      expect(line('2026-01-01T02:00:00.000Z', '2026-01-01T03:00:00.000Z', 'America/New_York')).toBe(
        'Wednesday, December 31, 2025',
      );
      expect(line('2026-01-01T02:00:00.000Z', '2026-01-01T03:00:00.000Z')).toBe('Thursday, January 1');
      // …and for the clock: at that moment 2025 is still the current year there.
      const justAfter = Date.UTC(2026, 0, 1, 4);
      const june = ['2025-06-30T15:00:00.000Z', '2025-06-30T16:00:00.000Z'] as const;
      expect(line(...june, 'America/New_York', justAfter)).toBe('Monday, June 30');
      expect(line(...june, 'UTC', justAfter)).toBe('Monday, June 30, 2025');
    });

    it('an event that has not ended has no year, next year’s included', () => {
      expect(eventWhen('2027-01-05T18:00:00.000Z', '2027-01-05T20:00:00.000Z', 'UTC')?.dayLine).toBe(
        'Tuesday, January 5',
      );
    });

    it('an end before its start is on the first day, and no line reads backwards', () => {
      const when = (start: string, end: string, zone = 'UTC') => eventWhen(start, end, zone, false, NOW);
      // As the old rows are: a day in full, whose end lands a minute before it starts.
      expect(when('2025-01-01T00:00:00.000Z', '2024-12-31T23:59:00.000Z')).toMatchObject({
        dayLine: 'Wednesday, January 1, 2025',
        timeLine: '12:00 AM – 11:59 PM · UTC+0',
      });
      expect(when('2025-06-30T18:00:00.000Z', '2025-06-30T17:59:00.000Z')).toMatchObject({
        dayLine: 'Monday, June 30, 2025',
        timeLine: '6:00 PM – 6:00 PM · UTC+0',
      });
      // A New Year range reads forwards, each end with its own year; an evening over midnight keeps its end.
      expect(line('2024-12-31T09:00:00.000Z', '2025-01-02T18:00:00.000Z')).toBe('Tue, Dec 31, 2024 – Thu, Jan 2, 2025');
      expect(when('2025-06-30T22:00:00.000Z', '2025-07-01T01:00:00.000Z')?.timeLine).toBe('10:00 PM – 1:00 AM · UTC+0');
    });

    it('changes the day line only', () => {
      const args = ['2025-11-04T18:00:00.000Z', '2025-11-04T20:00:00.000Z', 'UTC'] as const;
      const { dayLine: _ended, ...ended } = eventWhen(...args, false, NOW) ?? {};
      const { dayLine: _live, ...live } = eventWhen(...args) ?? {};
      expect(ended).toEqual(live);
    });
  });

  it('null for an unreadable start or an unknown zone', () => {
    expect(eventWhen('soon', '', 'UTC')).toBeNull();
    expect(eventWhen('2026-11-19T10:00:00.000Z', '', 'Mars/Olympus')).toBeNull();
  });
});

describe('utcZone', () => {
  it('prints half hours and a real minus sign', () => {
    const date = new Date('2026-11-19T10:00:00.000Z');
    expect(utcZone(date, 'Asia/Kolkata')).toBe('UTC+5:30');
    expect(utcZone(date, 'America/St_Johns')).toBe('UTC−3:30');
    expect(utcZone(date, 'Europe/Berlin')).toBe('UTC+1');
  });
});

describe('eventsAppEventHref', () => {
  const ORIGINAL = process.env.PL_EVENTS_BASE_URL;
  afterEach(() => {
    process.env.PL_EVENTS_BASE_URL = ORIGINAL;
  });

  it('the events app calendar, opened on the event id', () => {
    process.env.PL_EVENTS_BASE_URL = 'https://events.test//';
    expect(eventsAppEventHref('abc 1')).toBe('https://events.test/calendar#abc%201');
  });

  it('null without an id or the app address', () => {
    process.env.PL_EVENTS_BASE_URL = 'https://events.test';
    expect(eventsAppEventHref(null)).toBeNull();
    expect(eventsAppEventHref('')).toBeNull();
    delete process.env.PL_EVENTS_BASE_URL;
    expect(eventsAppEventHref('abc')).toBeNull();
  });
});

describe('agendaDayTitle', () => {
  it('"Day 1 - 1st Dec Sun" → "Sun, 1st Dec"', () => {
    expect(agendaDayTitle('Day 1 - 1st Dec Sun')).toBe('Sun, 1st Dec');
  });

  it('leaves anything else as it is', () => {
    expect(agendaDayTitle('Opening day')).toBe('Opening day');
  });
});

describe('eventWhen, all day (LAB-3339)', () => {
  it('prints an all-day event as its days with "All day", no time or zone', () => {
    expect(eventWhen('2030-07-24', '2030-07-24', 'America/Los_Angeles', true)).toEqual({
      month: 'JUL',
      day: '24',
      dayLine: 'Wednesday, July 24',
      timeLine: 'All day',
    });
    expect(eventWhen('2030-07-24', '2030-07-26', 'UTC', true)?.dayLine).toBe('Wed, Jul 24 – Fri, Jul 26');
  });

  it('an all-day event that ended last year carries its year (LAB-3418)', () => {
    const NOW = Date.UTC(2026, 10, 25, 12);
    expect(eventWhen('2025-07-24', '2025-07-26', 'UTC', true, NOW)).toMatchObject({
      dayLine: 'Thu, Jul 24 – Sat, Jul 26, 2025',
      timeLine: 'All day',
    });
    expect(eventWhen('2026-07-24', '2026-07-24', 'UTC', true, NOW)?.dayLine).toBe('Friday, July 24');
  });
});

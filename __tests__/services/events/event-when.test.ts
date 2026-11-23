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
});

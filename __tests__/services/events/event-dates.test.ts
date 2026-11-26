import { eventClock, eventEndsAt, formatEventDateLine } from '@/services/events/event-dates';

/* How an event's dates read everywhere, with the all-day rule: days only, no time and no UTC offset. */

describe('eventClock', () => {
  it('reads a timed event in its own time zone', () => {
    expect(eventClock('2030-12-03T03:30:00.000Z', '2030-12-04T12:30:00.000Z', 'Asia/Kolkata', false)).toEqual({
      startDay: '2030-12-03',
      endDay: '2030-12-04',
      startTime: '9:00 AM',
      endTime: '6:00 PM',
      zone: 'UTC+5:30',
    });
  });

  it('reads a one-day all-day event as its day, with no time or zone', () => {
    expect(eventClock('2030-07-24', '2030-07-24', 'America/New_York', true)).toEqual({
      startDay: '2030-07-24',
      endDay: '2030-07-24',
      startTime: '',
      endTime: '',
      zone: '',
    });
  });

  it('reads a three-day all-day event as its days, also when the API sends instants', () => {
    expect(eventClock('2030-07-24', '2030-07-26', 'Asia/Tokyo', true)).toMatchObject({
      startDay: '2030-07-24',
      endDay: '2030-07-26',
      startTime: '',
    });
    // Midnight in Tokyo on Jul 24 and Jul 26.
    expect(eventClock('2030-07-23T15:00:00.000Z', '2030-07-25T15:00:00.000Z', 'Asia/Tokyo', true)).toMatchObject({
      startDay: '2030-07-24',
      endDay: '2030-07-26',
      zone: '',
    });
  });

  it('falls back to UTC for an unknown time zone', () => {
    expect(eventClock('2030-12-01T09:00:00.000Z', '2030-12-01T10:00:00.000Z', 'Mars/Base', false).zone).toBe('UTC+0');
  });
});

describe('formatEventDateLine', () => {
  it('prints a timed event with its times and UTC offset', () => {
    expect(formatEventDateLine('2026-11-19T23:00:00.000Z', '2026-11-20T02:00:00.000Z', 'America/New_York')).toBe(
      '19th Nov 2026, 18:00 - 19th Nov 2026, 21:00 (UTC -5:00)',
    );
  });

  it('prints a one-day all-day event as one date', () => {
    expect(formatEventDateLine('2030-07-24', '2030-07-24', 'America/New_York', true)).toBe('24th Jul 2030');
  });

  it('prints a three-day all-day event as a date range with no time or offset', () => {
    expect(formatEventDateLine('2030-07-24', '2030-07-26', 'America/New_York', true)).toBe(
      '24th Jul 2030 - 26th Jul 2030',
    );
  });
});

describe('eventEndsAt', () => {
  it('ends a timed event at its end instant', () => {
    expect(eventEndsAt('2030-12-04T12:30:00.000Z', 'Asia/Kolkata', false).toISOString()).toBe(
      '2030-12-04T12:30:00.000Z',
    );
  });

  it('ends an all-day event at the end of its last day in its time zone', () => {
    expect(eventEndsAt('2030-07-26', 'Asia/Tokyo', true).toISOString()).toBe('2030-07-26T14:59:59.999Z');
  });
});

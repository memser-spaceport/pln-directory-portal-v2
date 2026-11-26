import { isLive } from '@/services/events/event-live';
import { allEventsItem as item } from '@/services/events/all-events.fixtures';

/*
 * LAB-3425: which events carry the Live pill. Clocks are fixed instants. The zones of the "any viewer" cases are at the
 * two ends of the calendar (UTC+14 and UTC−11), so whatever zone the tests run in, at least one differs from it by day.
 */

const at = (iso: string) => new Date(iso).getTime();
type Item = Parameters<typeof isLive>[0];
/** Live at each of these instants. */
const liveAt = (event: Item, ...clocks: string[]) => clocks.map((iso) => isLive(event, at(iso)));

describe('a one-day event', () => {
  // 6:00–9:00 PM in New York (UTC−5).
  const evening = item({
    startDate: '2026-12-03T23:00:00.000Z',
    endDate: '2026-12-04T02:00:00.000Z',
    timezone: 'America/New_York',
    startDay: '2026-12-03',
    endDay: '2026-12-03',
  });

  it('is live from its start, not before', () => {
    expect(liveAt(evening, '2026-12-03T22:59:59.999Z', '2026-12-03T23:00:00.000Z')).toEqual([false, true]);
  });

  it('is live up to its end, not at it', () => {
    expect(liveAt(evening, '2026-12-04T01:59:59.999Z', '2026-12-04T02:00:00.000Z')).toEqual([true, false]);
  });

  it('is not live earlier on its own day, nor the same hours a day later', () => {
    expect(liveAt(evening, '2026-12-03T15:00:00.000Z', '2026-12-05T00:00:00.000Z')).toEqual([false, false]);
  });

  it('is live while the date in UTC, and for most viewers, is already the next day', () => {
    expect(liveAt(evening, '2026-12-04T00:30:00.000Z')).toEqual([true]);
  });

  it.each([
    ['Pacific/Kiritimati', '2026-12-03T22:00:00.000Z', '2026-12-04T01:00:00.000Z', '2026-12-04'],
    ['Pacific/Pago_Pago', '2026-12-03T22:00:00.000Z', '2026-12-04T01:00:00.000Z', '2026-12-03'],
  ])('in %s is live between the same two instants for every viewer', (timezone, startDate, endDate, day) => {
    const event = item({ startDate, endDate, timezone, startDay: day, endDay: day });
    expect(
      liveAt(
        event,
        '2026-12-03T21:59:00.000Z',
        '2026-12-03T22:00:00.000Z',
        '2026-12-04T00:59:00.000Z',
        '2026-12-04T01:00:00.000Z',
      ),
    ).toEqual([false, true, true, false]);
  });

  it('is live through the hour that repeats when clocks go back (1:30 AM EDT to 1:30 AM EST)', () => {
    const repeated = item({
      startDate: '2026-11-01T05:30:00.000Z',
      endDate: '2026-11-01T06:30:00.000Z',
      timezone: 'America/New_York',
      startDay: '2026-11-01',
      endDay: '2026-11-01',
    });
    expect(
      liveAt(repeated, '2026-11-01T05:29:00.000Z', '2026-11-01T06:00:00.000Z', '2026-11-01T06:30:00.000Z'),
    ).toEqual([false, true, false]);
  });
});

describe('an event that crosses midnight but lasts 24 hours or less', () => {
  // New York is UTC−5: 9:00 AM there is 14:00 UTC.
  const nine = '2026-12-03T14:00:00.000Z';
  const newYork = { timezone: 'America/New_York', startDay: '2026-12-03', endDay: '2026-12-04' };

  it.each([
    ['6 PM–12 AM', '2026-12-03T23:00:00.000Z', '2026-12-04T05:00:00.000Z', '2026-12-04T04:59:59.000Z'],
    ['10 PM–1 AM', '2026-12-04T03:00:00.000Z', '2026-12-04T06:00:00.000Z', '2026-12-04T05:59:59.000Z'],
  ])('%s is live from its start to its end, not that morning', (_hours, startDate, endDate, lastSecond) => {
    const event = item({ ...newYork, startDate, endDate });
    const secondBefore = new Date(at(startDate) - 1000).toISOString();
    expect(liveAt(event, '2026-12-03T05:00:00.000Z', nine, secondBefore)).toEqual([false, false, false]);
    expect(liveAt(event, startDate, lastSecond, endDate)).toEqual([true, true, false]);
  });

  it('is live over midnight when its zone is UTC, and not before it starts', () => {
    const late = item({
      startDate: '2026-12-03T22:00:00.000Z',
      endDate: '2026-12-04T01:00:00.000Z',
      startDay: '2026-12-03',
      endDay: '2026-12-04',
    });
    expect(liveAt(late, '2026-12-03T00:00:00.000Z', '2026-12-03T21:59:59.000Z')).toEqual([false, false]);
    expect(liveAt(late, '2026-12-03T22:00:00.000Z', '2026-12-04T00:30:00.000Z', '2026-12-04T01:00:00.000Z')).toEqual([
      true,
      true,
      false,
    ]);
  });

  it('starts at its start at exactly 24 hours, and at midnight there one minute over', () => {
    // From 6:00 PM in New York, 23:00 UTC.
    const day = (endDate: string) => item({ ...newYork, startDate: '2026-12-03T23:00:00.000Z', endDate });
    const clocks = ['2026-12-03T04:59:59.000Z', '2026-12-03T05:00:00.000Z', nine, '2026-12-03T23:00:00.000Z'];
    expect(liveAt(day('2026-12-04T23:00:00.000Z'), ...clocks)).toEqual([false, false, false, true]);
    expect(liveAt(day('2026-12-04T23:01:00.000Z'), ...clocks)).toEqual([false, true, true, true]);
  });
});

describe('an event with no zone of its own, read in UTC', () => {
  const utc = { timezone: 'UTC', startDay: '2026-12-03' };

  it('is live from its start when short', () => {
    // 6 PM–12 AM in New York, whose zone the server could not read.
    const short = item({
      ...utc,
      startDate: '2026-12-03T23:00:00.000Z',
      endDate: '2026-12-04T05:00:00.000Z',
      endDay: '2026-12-04',
    });
    expect(liveAt(short, '2026-12-03T14:00:00.000Z', '2026-12-03T23:00:00.000Z', '2026-12-04T05:00:00.000Z')).toEqual([
      false,
      true,
      false,
    ]);
  });

  it('is live from midnight UTC when longer than 24 hours', () => {
    const long = item({
      ...utc,
      startDate: '2026-12-03T14:00:00.000Z',
      endDate: '2026-12-05T22:00:00.000Z',
      endDay: '2026-12-05',
    });
    expect(liveAt(long, '2026-12-02T23:59:59.000Z', '2026-12-03T00:00:00.000Z')).toEqual([false, true]);
  });
});

it('reads a zone the browser does not know from the start instant, without throwing', () => {
  const unknown = item({
    startDate: '2026-12-03T14:00:00.000Z',
    endDate: '2026-12-05T22:00:00.000Z',
    timezone: 'Mars/Olympus_Mons',
    startDay: '2026-12-03',
    endDay: '2026-12-05',
  });
  expect(
    liveAt(
      unknown,
      '2026-12-03T13:59:59.000Z',
      '2026-12-03T14:00:00.000Z',
      '2026-12-05T21:59:59.000Z',
      '2026-12-05T22:00:00.000Z',
    ),
  ).toEqual([false, true, true, false]);
});

describe('an event longer than 24 hours', () => {
  // Dec 3, 9:00 AM – Dec 5, 6:00 PM in Kolkata (UTC+5:30): Dec 3 begins there at 18:30 UTC on Dec 2.
  const summit = item({
    startDate: '2026-12-03T03:30:00.000Z',
    endDate: '2026-12-05T12:30:00.000Z',
    timezone: 'Asia/Kolkata',
    startDay: '2026-12-03',
    endDay: '2026-12-05',
  });

  it('is live on the whole of its first day, in its own zone, also before it opens', () => {
    expect(liveAt(summit, '2026-12-02T18:29:59.999Z', '2026-12-02T18:30:00.000Z', '2026-12-03T03:00:00.000Z')).toEqual([
      false,
      true,
      true,
    ]);
  });

  it('is live on its middle day, also at night', () => {
    expect(liveAt(summit, '2026-12-03T20:00:00.000Z', '2026-12-04T10:00:00.000Z')).toEqual([true, true]);
  });

  it('is live on its last day until its end, and not for the rest of that day', () => {
    expect(
      liveAt(
        summit,
        '2026-12-04T19:00:00.000Z',
        '2026-12-05T12:29:59.999Z',
        '2026-12-05T12:30:00.000Z',
        '2026-12-05T15:00:00.000Z',
      ),
    ).toEqual([true, true, false, false]);
  });

  it.each([
    // Dec 3 begins at 10:00 UTC on Dec 2 in Kiritimati (UTC+14), at 11:00 UTC on Dec 3 in Pago Pago (UTC−11).
    ['Pacific/Kiritimati', '2026-12-02T23:00:00.000Z', '2026-12-02T09:59:00.000Z', '2026-12-02T10:00:00.000Z'],
    ['Pacific/Pago_Pago', '2026-12-03T20:00:00.000Z', '2026-12-03T10:59:00.000Z', '2026-12-03T11:00:00.000Z'],
  ])('in %s begins at its own midnight for every viewer', (timezone, startDate, before, midnight) => {
    const event = item({
      startDate,
      endDate: '2026-12-05T20:00:00.000Z',
      timezone,
      startDay: '2026-12-03',
      endDay: '2026-12-05',
    });
    expect(liveAt(event, before, midnight)).toEqual([false, true]);
  });

  it('begins at the midnight of a day whose clocks change later that day', () => {
    // Both start at 10:00 AM New York time, after the change; midnight is still on the old offset.
    const fallBack = item({
      startDate: '2026-11-01T15:00:00.000Z',
      endDate: '2026-11-03T22:00:00.000Z',
      timezone: 'America/New_York',
      startDay: '2026-11-01',
      endDay: '2026-11-03',
    });
    expect(liveAt(fallBack, '2026-11-01T03:59:00.000Z', '2026-11-01T04:00:00.000Z')).toEqual([false, true]);
    const springForward = item({
      startDate: '2026-03-08T14:00:00.000Z',
      endDate: '2026-03-10T22:00:00.000Z',
      timezone: 'America/New_York',
      startDay: '2026-03-08',
      endDay: '2026-03-10',
    });
    expect(liveAt(springForward, '2026-03-08T04:30:00.000Z', '2026-03-08T05:00:00.000Z')).toEqual([false, true]);
  });
});

it('is never live with a date that cannot be read', () => {
  const now = '2026-12-03T12:00:00.000Z';
  const day = { startDay: '2026-12-03', endDay: '2026-12-03' };
  expect(liveAt(item({ ...day, startDate: '2026-12-03T09:00:00Z', endDate: 'soon' }), now)).toEqual([false]);
  expect(liveAt(item({ ...day, startDate: 'soon', endDate: '2026-12-03T18:00:00Z' }), now)).toEqual([false]);
});

describe('an all-day event (LAB-3339)', () => {
  // Jul 24 – 26 in Los Angeles (UTC−7): live from 07:00 UTC on Jul 24 to 07:00 UTC on Jul 27.
  const festival = item({
    allDay: true,
    startDate: '2030-07-24',
    endDate: '2030-07-26',
    timezone: 'America/Los_Angeles',
    startDay: '2030-07-24',
    endDay: '2030-07-26',
    startTime: '',
    endTime: '',
    zone: '',
  });
  const oneDay = { ...festival, endDate: '2030-07-24', endDay: '2030-07-24' };

  it('is live from midnight of its first day to the end of its last, in its own zone', () => {
    expect(liveAt(festival, '2030-07-24T06:59:59.000Z', '2030-07-24T07:00:00.000Z')).toEqual([false, true]);
    expect(liveAt(festival, '2030-07-27T06:59:59.000Z', '2030-07-27T07:00:00.000Z')).toEqual([true, false]);
  });

  it('a one-day all-day event is live all that day, and not before or after', () => {
    expect(
      liveAt(
        oneDay,
        '2030-07-24T06:59:59.000Z',
        '2030-07-24T12:00:00.000Z',
        '2030-07-25T06:59:59.000Z',
        '2030-07-25T07:00:00.000Z',
      ),
    ).toEqual([false, true, true, false]);
  });
});

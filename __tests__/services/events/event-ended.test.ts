import { isEventEnded } from '@/services/events/event-ended';

const at = (iso: string) => new Date(iso).getTime();

describe('isEventEnded (LAB-3426)', () => {
  it('has not ended one second before its end time, and has at it', () => {
    expect(isEventEnded('2026-11-25T20:00:00.000Z', at('2026-11-25T19:59:59.000Z'))).toBe(false);
    expect(isEventEnded('2026-11-25T20:00:00.000Z', at('2026-11-25T20:00:00.000Z'))).toBe(true);
  });

  it('has ended later on the same day, not from the next day', () => {
    expect(isEventEnded('2026-11-25T10:00:00.000Z', at('2026-11-25T23:00:00.000Z'))).toBe(true);
  });

  it('a multi-day event has not ended on its last day until its end time', () => {
    const end = '2026-12-05T18:00:00.000Z';
    expect(isEventEnded(end, at('2026-12-04T23:00:00.000Z'))).toBe(false);
    expect(isEventEnded(end, at('2026-12-05T17:59:59.000Z'))).toBe(false);
    expect(isEventEnded(end, at('2026-12-05T18:00:00.000Z'))).toBe(true);
  });

  it('an event in another time zone ends at its own instant, whatever the day is elsewhere', () => {
    // 9 PM in New York on Nov 25 is 2 AM UTC on Nov 26; 1 AM in Tokyo on Nov 26 is 4 PM UTC on Nov 25.
    for (const end of ['2026-11-25T21:00:00-05:00', '2026-11-26T02:00:00.000Z']) {
      expect(isEventEnded(end, at('2026-11-25T22:00:00.000Z'))).toBe(false);
      expect(isEventEnded(end, at('2026-11-26T01:59:59.000Z'))).toBe(false);
      expect(isEventEnded(end, at('2026-11-26T02:00:00.000Z'))).toBe(true);
    }
    expect(isEventEnded('2026-11-26T01:00:00+09:00', at('2026-11-25T15:59:59.000Z'))).toBe(false);
    expect(isEventEnded('2026-11-26T01:00:00+09:00', at('2026-11-25T16:00:00.000Z'))).toBe(true);
  });

  it('never ends on an end that is not a date', () => {
    expect(isEventEnded('', at('2026-11-25T20:00:00.000Z'))).toBe(false);
    expect(isEventEnded('soon', at('2026-11-25T20:00:00.000Z'))).toBe(false);
  });

  it('reads the clock when no time is given', () => {
    jest.useFakeTimers({ now: at('2026-11-25T20:00:00.000Z') });
    try {
      expect(isEventEnded('2026-11-25T20:00:00.000Z')).toBe(true);
      expect(isEventEnded('2026-11-25T20:00:01.000Z')).toBe(false);
    } finally {
      jest.useRealTimers();
    }
  });
});

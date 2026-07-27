import { getCurrentRoundNumber, getRoundDateInfo } from '@/utils/plaa-round.utils';

describe('getCurrentRoundNumber', () => {
  const realDate = Date;

  function freeze(iso: string) {
    const frozen = new realDate(iso);
    // @ts-expect-error — minimal Date stub for the frozen clock
    global.Date = class extends realDate {
      constructor(...args: any[]) {
        super(...((args.length ? args : [frozen]) as []));
        if (!args.length) return frozen as unknown as Date;
      }
      static now() {
        return frozen.getTime();
      }
    };
  }

  afterEach(() => {
    global.Date = realDate;
  });

  it('returns 1 for the first round month (February 2025)', () => {
    freeze('2025-02-14T00:00:00Z');
    expect(getCurrentRoundNumber()).toBe(1);
  });

  it('returns 18 for July 2026', () => {
    freeze('2026-07-24T00:00:00Z');
    expect(getCurrentRoundNumber()).toBe(18);
  });

  it('rolls to the next round at the month boundary', () => {
    freeze('2026-07-31T23:59:00Z');
    const july = getCurrentRoundNumber();
    freeze('2026-08-01T00:01:00Z');
    expect(getCurrentRoundNumber()).toBe(july + 1);
  });

  it('round-trips against getRoundDateInfo', () => {
    freeze('2026-07-24T00:00:00Z');
    expect(getRoundDateInfo(getCurrentRoundNumber()).snapshotPeriod).toBe('2026-07');
  });
});

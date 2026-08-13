import { getCurrentRoundNumber, getRoundDateInfo } from '@/utils/plaa-round.utils';

describe('getCurrentRoundNumber', () => {
  const realDate = Date;

  /**
   * Freezes the clock. Takes an ISO string for an absolute instant, or a Date so
   * a caller can pin *local* calendar components — required whenever the
   * assertion depends on which month the clock lands in, since the functions
   * under test read the local month.
   */
  function freeze(when: string | Date) {
    const frozen = when instanceof realDate ? when : new realDate(when);
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

  // getCurrentRoundNumber reads the LOCAL calendar month, so the boundary has to
  // be expressed in local time. Written as the UTC instants 2026-07-31T23:59Z /
  // 2026-08-01T00:01Z, this straddled the boundary only in UTC: at +03:00 both
  // land in August and at -07:00 both land in July, so it passed in CI and failed
  // on every developer machine outside UTC. Both Dates are built before the first
  // freeze() so they use the real constructor, not the stub installed below.
  it('rolls to the next round at the local month boundary', () => {
    const endOfJuly = new realDate(2026, 6, 31, 23, 59);
    const startOfAugust = new realDate(2026, 7, 1, 0, 1);

    freeze(endOfJuly);
    const july = getCurrentRoundNumber();
    expect(getRoundDateInfo(july).snapshotPeriod).toBe('2026-07');

    freeze(startOfAugust);
    expect(getCurrentRoundNumber()).toBe(july + 1);
    expect(getRoundDateInfo(july + 1).snapshotPeriod).toBe('2026-08');
  });

  it('round-trips against getRoundDateInfo', () => {
    freeze('2026-07-24T00:00:00Z');
    expect(getRoundDateInfo(getCurrentRoundNumber()).snapshotPeriod).toBe('2026-07');
  });
});

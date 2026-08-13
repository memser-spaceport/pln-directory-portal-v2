import {
  getCurrentRoundNumber,
  getRoundDateInfo,
  getSnapshotDatesFromPeriod,
  getSnapshotProgress,
} from '@/utils/plaa-round.utils';

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

describe('getCurrentRoundNumber', () => {
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

describe('getSnapshotDatesFromPeriod', () => {
  it('spans the full calendar month, start of day 1 through end of the last day', () => {
    const { startDate, endDate } = getSnapshotDatesFromPeriod('2026-08');

    expect(startDate.getFullYear()).toBe(2026);
    expect(startDate.getMonth()).toBe(7); // 0-indexed: August
    expect(startDate.getDate()).toBe(1);
    expect(startDate.getHours()).toBe(0);

    expect(endDate.getDate()).toBe(31);
    expect(endDate.getHours()).toBe(23);
    expect(endDate.getMinutes()).toBe(59);
    expect(endDate.getSeconds()).toBe(59);
  });

  it('accepts a YYYY-MM-DD period string, using only the year/month', () => {
    const { startDate, endDate } = getSnapshotDatesFromPeriod('2026-02-01');

    expect(startDate.getDate()).toBe(1);
    expect(endDate.getDate()).toBe(28); // February 2026 is not a leap year
  });
});

describe('getSnapshotProgress', () => {
  it('reports 0% progress before the period starts', () => {
    const { startDate, endDate } = getSnapshotDatesFromPeriod('2026-08');
    const before = new Date(2026, 6, 15); // mid-July, before the August period

    const { progressPercentage, remainingDays } = getSnapshotProgress(startDate, endDate, before);

    expect(progressPercentage).toBe(0);
    // remainingDays isn't clamped to the period length before it starts — it's plain
    // calendar days until `end`, which in real usage never matters (this fn is only
    // ever called for the current, already-open period).
    expect(remainingDays).toBe(48);
  });

  it('reports 100% and 0 days remaining after the period ends', () => {
    const { startDate, endDate } = getSnapshotDatesFromPeriod('2026-08');
    const after = new Date(2026, 8, 5); // early September, after the August period

    const { progressPercentage, remainingDays } = getSnapshotProgress(startDate, endDate, after);

    expect(progressPercentage).toBe(100);
    expect(remainingDays).toBe(0);
  });

  it('reports exactly 100% and 1 day left at the final instant of the period', () => {
    const { startDate, endDate } = getSnapshotDatesFromPeriod('2026-08');

    const { progressPercentage, remainingDays } = getSnapshotProgress(startDate, endDate, endDate);

    expect(progressPercentage).toBe(100);
    expect(remainingDays).toBe(1);
  });

  it('formats a same-month date range as "Month D-D, YYYY"', () => {
    const { startDate, endDate } = getSnapshotDatesFromPeriod('2026-08');
    const { dateRangeLabel } = getSnapshotProgress(startDate, endDate, startDate);

    expect(dateRangeLabel).toBe('August 1-31, 2026');
  });

  it('singularizes "day" when exactly one day remains', () => {
    const { startDate, endDate } = getSnapshotDatesFromPeriod('2026-08');
    const oneDayLeft = new Date(2026, 7, 31, 0, 0, 0);

    const { timeRemainingLabel, remainingDays } = getSnapshotProgress(startDate, endDate, oneDayLeft);

    expect(remainingDays).toBe(1);
    expect(timeRemainingLabel).toBe('1 day remaining in current snapshot period');
  });
});

import { renderHook } from '@testing-library/react';

const mockUseCurrentRoundStats = jest.fn();
jest.mock('@/services/plaa/hooks/useCurrentRoundStats', () => ({
  useCurrentRoundStats: () => mockUseCurrentRoundStats(),
}));

import {
  useCurrentSnapshotStatus,
  MOCK_ACTIVITIES,
  MOCK_POINTS_COLLECTED,
  MOCK_ACTIVITIES_COUNT,
  MOCK_CATEGORIES_COUNT,
} from '@/services/plaa/hooks/useCurrentSnapshotStatus';

describe('useCurrentSnapshotStatus', () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
    // No real round-stats data by default — exercises the calendar-math fallback.
    mockUseCurrentRoundStats.mockReturnValue({ data: null });
  });

  afterEach(() => {
    global.Date = realDate;
  });

  describe('fallback (real round-stats unavailable)', () => {
    it('reports the current period label, mid-period progress, and days left', () => {
      // August 2026 has 31 days. The period spans Aug 1 00:00:00 to Aug 31 23:59:59
      // (getSnapshotProgress's convention — see utils/plaa-round.utils.ts), so at
      // Aug 16 00:00:00 exactly 15 of ~31 elapsed days have passed: round(15/30.9999*100) = 48.
      freeze('2026-08-16T00:00:00');
      const { result } = renderHook(() => useCurrentSnapshotStatus());

      expect(result.current.periodLabel).toBe('August 2026');
      expect(result.current.daysLeft).toBe(16); // 16 through 31, inclusive
      expect(result.current.progressPct).toBe(48);
    });

    it('reports 100% progress and 1 day left at the very end of the period', () => {
      // The period runs through 23:59:59 on the last day (see getSnapshotProgress),
      // so 100% only holds right at that instant, not merely on the last calendar day.
      freeze('2026-08-31T23:59:59');
      const { result } = renderHook(() => useCurrentSnapshotStatus());

      expect(result.current.daysLeft).toBe(1);
      expect(result.current.progressPct).toBe(100);
    });
  });

  describe('real round-stats available', () => {
    it('derives period label, days left, and progress from the same source the round pages use', () => {
      freeze('2026-08-16T00:00:00');
      mockUseCurrentRoundStats.mockReturnValue({
        data: { period: '2026-08-01', month: 'August', year: 2026 },
      });

      const { result } = renderHook(() => useCurrentSnapshotStatus());

      expect(result.current.periodLabel).toBe('August 2026');
      expect(result.current.daysLeft).toBe(16);
      // Same 48% as the fallback path (see comment above) — both derive from
      // getSnapshotDatesFromPeriod + getSnapshotProgress, so they agree exactly.
      expect(result.current.progressPct).toBe(48);
    });

    it('takes the round-stats month/year over the fallback even if they disagree with local calendar math', () => {
      freeze('2026-08-16T00:00:00');
      // A hypothetical backend-declared round that doesn't match plain calendar math —
      // the hook should still trust it, since it's meant to be authoritative.
      mockUseCurrentRoundStats.mockReturnValue({
        data: { period: '2026-09-01', month: 'September', year: 2026 },
      });

      const { result } = renderHook(() => useCurrentSnapshotStatus());

      expect(result.current.periodLabel).toBe('September 2026');
    });
  });

  it('exposes the mock points/activities/categories values pending backend integration', () => {
    freeze('2026-08-16T00:00:00');
    const { result } = renderHook(() => useCurrentSnapshotStatus());

    expect(result.current.pointsCollected).toBe(MOCK_POINTS_COLLECTED);
    expect(result.current.activitiesCount).toBe(MOCK_ACTIVITIES_COUNT);
    expect(result.current.categoriesCount).toBe(MOCK_CATEGORIES_COUNT);
    expect(result.current.activities).toBe(MOCK_ACTIVITIES);
  });

  it('keeps pointsCollected/activitiesCount/categoriesCount consistent with the activity list', () => {
    // Mirrors how the real values must be derived once connected — see the hook's TODO.
    const summedPoints = MOCK_ACTIVITIES.reduce((sum, a) => sum + a.points, 0);
    const distinctCategories = new Set(MOCK_ACTIVITIES.map((a) => a.category)).size;

    expect(MOCK_POINTS_COLLECTED).toBe(summedPoints);
    expect(MOCK_ACTIVITIES_COUNT).toBe(MOCK_ACTIVITIES.length);
    expect(MOCK_CATEGORIES_COUNT).toBe(distinctCategories);
  });
});

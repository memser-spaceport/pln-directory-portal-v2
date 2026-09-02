import { renderHook } from '@testing-library/react';

const mockUseCurrentRoundStats = jest.fn();
jest.mock('@/services/plaa/hooks/useCurrentRoundStats', () => ({
  useCurrentRoundStats: () => mockUseCurrentRoundStats(),
}));

const mockUseSnapshotPoints = jest.fn();
jest.mock('@/services/points/hooks/usePoints', () => ({
  useSnapshotPoints: (snapshotPeriod: string) => mockUseSnapshotPoints(snapshotPeriod),
}));

import { useCurrentSnapshotStatus } from '@/services/plaa/hooks/useCurrentSnapshotStatus';

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
    mockUseSnapshotPoints.mockReturnValue({ data: null, isLoading: false });
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

    it('fetches snapshot points for the calendar-derived period ("YYYY-MM")', () => {
      freeze('2026-08-16T00:00:00');
      renderHook(() => useCurrentSnapshotStatus());

      expect(mockUseSnapshotPoints).toHaveBeenCalledWith('2026-08');
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

    it('fetches snapshot points for the round-stats period, not the calendar fallback, when both exist', () => {
      freeze('2026-08-16T00:00:00');
      mockUseCurrentRoundStats.mockReturnValue({
        data: { period: '2026-09-01', month: 'September', year: 2026 },
      });

      renderHook(() => useCurrentSnapshotStatus());

      expect(mockUseSnapshotPoints).toHaveBeenCalledWith('2026-09');
    });
  });

  describe('real snapshot points data', () => {
    const records = [
      { category: 'Knowledge Sharing', activityName: 'Host Office Hours', description: '', pointsCollectedPerSnapshot: 100 },
      { category: 'Knowledge Sharing', activityName: 'Thoughtful Responder', description: '', pointsCollectedPerSnapshot: 250 },
      { category: 'Programs', activityName: 'Make a Network Introduction', description: '', pointsCollectedPerSnapshot: 500 },
    ];

    beforeEach(() => {
      freeze('2026-08-16T00:00:00');
      mockUseSnapshotPoints.mockReturnValue({
        data: { snapshotPeriod: '2026-08', records },
        isLoading: false,
      });
    });

    it('maps each PointsRecord onto a SnapshotActivityItem (category/activityName/pointsCollectedPerSnapshot -> category/title/points)', () => {
      const { result } = renderHook(() => useCurrentSnapshotStatus());

      expect(result.current.activities).toEqual([
        { category: 'Knowledge Sharing', title: 'Host Office Hours', points: 100 },
        { category: 'Knowledge Sharing', title: 'Thoughtful Responder', points: 250 },
        { category: 'Programs', title: 'Make a Network Introduction', points: 500 },
      ]);
    });

    it('sums pointsCollected across all records', () => {
      const { result } = renderHook(() => useCurrentSnapshotStatus());
      expect(result.current.pointsCollected).toBe(850);
    });

    it('counts activitiesCount as the record count', () => {
      const { result } = renderHook(() => useCurrentSnapshotStatus());
      expect(result.current.activitiesCount).toBe(3);
    });

    it('counts categoriesCount as the distinct category count, not the record count', () => {
      const { result } = renderHook(() => useCurrentSnapshotStatus());
      expect(result.current.categoriesCount).toBe(2); // Knowledge Sharing, Programs
    });

    it('coerces a string-typed pointsCollectedPerSnapshot to a number (Airtable-backed fields can arrive as text)', () => {
      mockUseSnapshotPoints.mockReturnValue({
        data: {
          snapshotPeriod: '2026-08',
          records: [{ category: 'Brand', activityName: 'X', description: '', pointsCollectedPerSnapshot: '75' as unknown as number }],
        },
        isLoading: false,
      });

      const { result } = renderHook(() => useCurrentSnapshotStatus());
      expect(result.current.pointsCollected).toBe(75);
      expect(result.current.activities[0].points).toBe(75);
    });
  });

  describe('no real data yet (loading, unauthenticated, or not-yet-eligible)', () => {
    it('reports zero points/activities/categories and an empty activity list when the query has no data', () => {
      freeze('2026-08-16T00:00:00');
      mockUseSnapshotPoints.mockReturnValue({ data: null, isLoading: false });

      const { result } = renderHook(() => useCurrentSnapshotStatus());

      expect(result.current.pointsCollected).toBe(0);
      expect(result.current.activitiesCount).toBe(0);
      expect(result.current.categoriesCount).toBe(0);
      expect(result.current.activities).toEqual([]);
    });

    it('reports the same empty state while the query is still loading', () => {
      freeze('2026-08-16T00:00:00');
      mockUseSnapshotPoints.mockReturnValue({ data: undefined, isLoading: true });

      const { result } = renderHook(() => useCurrentSnapshotStatus());

      expect(result.current.pointsCollected).toBe(0);
      expect(result.current.activities).toEqual([]);
    });

    it('treats a response with an empty records array the same as no data', () => {
      freeze('2026-08-16T00:00:00');
      mockUseSnapshotPoints.mockReturnValue({
        data: { snapshotPeriod: '2026-08', records: [] },
        isLoading: false,
      });

      const { result } = renderHook(() => useCurrentSnapshotStatus());

      expect(result.current.pointsCollected).toBe(0);
      expect(result.current.activitiesCount).toBe(0);
      expect(result.current.categoriesCount).toBe(0);
    });
  });
});

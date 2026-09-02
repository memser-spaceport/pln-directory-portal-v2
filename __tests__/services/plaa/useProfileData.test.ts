import { renderHook } from '@testing-library/react';

const mockUseCurrentUserStore = jest.fn();
jest.mock('@/services/auth/store', () => ({
  useCurrentUserStore: (selector: (s: any) => any) => selector(mockUseCurrentUserStore()),
}));

const mockUseCurrentSnapshotStatus = jest.fn();
jest.mock('@/services/plaa/hooks/useCurrentSnapshotStatus', () => ({
  useCurrentSnapshotStatus: () => mockUseCurrentSnapshotStatus(),
}));

const mockUseProfileBalance = jest.fn();
jest.mock('@/services/plaa/hooks/useProfileBalance', () => ({
  useProfileBalance: () => mockUseProfileBalance(),
}));

const mockUseProfilePlaaHistory = jest.fn();
jest.mock('@/services/plaa/hooks/useProfilePlaaHistory', () => ({
  useProfilePlaaHistory: () => mockUseProfilePlaaHistory(),
}));

const mockUseSnapshotPointsHistory = jest.fn();
jest.mock('@/services/plaa/hooks/useSnapshotPointsHistory', () => ({
  useSnapshotPointsHistory: (periods: string[]) => mockUseSnapshotPointsHistory(periods),
}));

const mockUseRedemptionHistory = jest.fn();
jest.mock('@/services/plaa/hooks/useRedemptionHistory', () => ({
  useRedemptionHistory: () => mockUseRedemptionHistory(),
}));

const mockUseSnapshotLifecycle = jest.fn();
jest.mock('@/services/plaa/hooks/useSnapshotLifecycle', () => ({
  useSnapshotLifecycle: () => mockUseSnapshotLifecycle(),
}));

import { useProfileData as useProfileDataDefault } from '@/services/plaa/hooks/useProfileData';

const ORIGINAL_NODE_ENV = process.env.NODE_ENV;

// NODE_ENV is typed read-only; defineProperty bypasses that for these tests only.
function setNodeEnv(value: string) {
  Object.defineProperty(process.env, 'NODE_ENV', { value, configurable: true });
}

/** Fresh require so the module's IS_DEV constant re-evaluates against the current NODE_ENV. */
function loadUseProfileData() {
  jest.resetModules();
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('@/services/plaa/hooks/useProfileData').useProfileData;
}

describe('useProfileData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCurrentSnapshotStatus.mockReturnValue({ pointsCollected: 420 });
    mockUseProfileBalance.mockReturnValue({ data: undefined, isLoading: false });
    mockUseProfilePlaaHistory.mockReturnValue({ data: undefined, isLoading: false });
    mockUseSnapshotPointsHistory.mockReturnValue({});
    mockUseRedemptionHistory.mockReturnValue({ data: undefined });
    mockUseSnapshotLifecycle.mockReturnValue({ data: undefined });
  });

  afterEach(() => {
    setNodeEnv(ORIGINAL_NODE_ENV ?? 'test');
  });

  it('is not onboarded and falls back to "Member" in production when there is no current user', () => {
    setNodeEnv('production');
    mockUseCurrentUserStore.mockReturnValue({ currentUser: null });
    const useProfileData = loadUseProfileData();
    const { result } = renderHook(() => useProfileData());

    expect(result.current.identity.isOnboarded).toBe(false);
    expect(result.current.identity.name).toBe('Member');
  });

  it('forces isOnboarded true outside production, even with no current user, for local demos', () => {
    setNodeEnv('development');
    mockUseCurrentUserStore.mockReturnValue({ currentUser: null });
    const useProfileData = loadUseProfileData();
    const { result } = renderHook(() => useProfileData());

    expect(result.current.identity.isOnboarded).toBe(true);
  });

  it('derives name, initials, and avatar from the signed-in user', () => {
    mockUseCurrentUserStore.mockReturnValue({
      currentUser: { name: 'Alex Rivera', profileImageUrl: 'https://example.com/a.png' },
    });
    const { result } = renderHook(() => useProfileDataDefault());

    expect(result.current.identity.isOnboarded).toBe(true);
    expect(result.current.identity.name).toBe('Alex Rivera');
    expect(result.current.identity.initials).toBe('AR');
    expect(result.current.identity.avatarUrl).toBe('https://example.com/a.png');
  });

  it('passes through the current snapshot points collected', () => {
    mockUseCurrentUserStore.mockReturnValue({ currentUser: { name: 'Alex Rivera' } });
    mockUseCurrentSnapshotStatus.mockReturnValue({ pointsCollected: 777 });
    const { result } = renderHook(() => useProfileDataDefault());

    expect(result.current.pointsThisSnapshot).toBe(777);
  });

  it('wires balance from useProfileBalance and reports balanceStatus "ready", independent of history', () => {
    mockUseCurrentUserStore.mockReturnValue({ currentUser: { name: 'Alex Rivera' } });
    mockUseProfileBalance.mockReturnValue({
      data: { plaaBalance: 1200, activities: 500, infraRewards: 700, redeemed: 0 },
      isLoading: false,
    });
    const { result } = renderHook(() => useProfileDataDefault());

    expect(result.current.balance).toEqual({
      plaaBalance: 1200,
      activities: 500,
      infraRewards: 700,
      redeemed: 0,
    });
    expect(result.current.balanceStatus).toBe('ready');
  });

  it('reports balanceStatus "loading" (not "ready" with a fabricated zero) while the query is in flight', () => {
    mockUseCurrentUserStore.mockReturnValue({ currentUser: { name: 'Alex Rivera' } });
    mockUseProfileBalance.mockReturnValue({ data: undefined, isLoading: true });
    const { result } = renderHook(() => useProfileDataDefault());

    expect(result.current.balanceStatus).toBe('loading');
    expect(result.current.balance).toEqual({ plaaBalance: 0, activities: 0, infraRewards: 0, redeemed: 0 });
  });

  it('reports balanceStatus "unavailable" (not "ready") once settled with no data — signed out, no synced row, or a failed request', () => {
    mockUseCurrentUserStore.mockReturnValue({ currentUser: { name: 'Alex Rivera' } });
    mockUseProfileBalance.mockReturnValue({ data: undefined, isLoading: false });
    const { result } = renderHook(() => useProfileDataDefault());

    expect(result.current.balanceStatus).toBe('unavailable');
    expect(result.current.balance).toEqual({ plaaBalance: 0, activities: 0, infraRewards: 0, redeemed: 0 });
  });

  describe('history (real per-period data)', () => {
    const REAL_HISTORY = [
      { period: '2026-05-26', iaPlaa: 100, irPlaa: 900, plaaTotal: 1000 },
      { period: '2026-06-26', iaPlaa: 0, irPlaa: 0, plaaTotal: 0 },
      { period: '2026-07-26', iaPlaa: 50, irPlaa: 0, plaaTotal: 50 },
    ];

    it('reports historyStatus "loading" while the query is in flight, with empty history arrays', () => {
      mockUseCurrentUserStore.mockReturnValue({ currentUser: { name: 'Alex Rivera' } });
      mockUseProfilePlaaHistory.mockReturnValue({ data: undefined, isLoading: true });
      const { result } = renderHook(() => useProfileDataDefault());

      expect(result.current.historyStatus).toBe('loading');
      expect(result.current.snapshotHistory).toEqual([]);
      expect(result.current.contributionHistory).toEqual([]);
    });

    it('reports historyStatus "unavailable" (not "ready") once settled with no data', () => {
      mockUseCurrentUserStore.mockReturnValue({ currentUser: { name: 'Alex Rivera' } });
      mockUseProfilePlaaHistory.mockReturnValue({ data: null, isLoading: false });
      const { result } = renderHook(() => useProfileDataDefault());

      expect(result.current.historyStatus).toBe('unavailable');
      expect(result.current.snapshotHistory).toEqual([]);
    });

    it('reports historyStatus "ready" for a genuinely empty history (a new member with no snapshots yet), distinct from "unavailable"', () => {
      mockUseCurrentUserStore.mockReturnValue({ currentUser: { name: 'Alex Rivera' } });
      mockUseProfilePlaaHistory.mockReturnValue({ data: [], isLoading: false });
      const { result } = renderHook(() => useProfileDataDefault());

      expect(result.current.historyStatus).toBe('ready');
      expect(result.current.snapshotHistory).toEqual([]);
    });

    it('formats each period as "Mon YYYY" and orders snapshotHistory newest-first', () => {
      mockUseCurrentUserStore.mockReturnValue({ currentUser: { name: 'Alex Rivera' } });
      mockUseProfilePlaaHistory.mockReturnValue({ data: REAL_HISTORY, isLoading: false });
      const { result } = renderHook(() => useProfileDataDefault());

      expect(result.current.snapshotHistory.map((e) => e.period)).toEqual(['Jul 2026', 'Jun 2026', 'May 2026']);
    });

    it('maps iaPlaa/irPlaa/plaaTotal onto activityPlaa/infra/plaaTotal, and derives hasInfra as irPlaa > 0', () => {
      mockUseCurrentUserStore.mockReturnValue({ currentUser: { name: 'Alex Rivera' } });
      mockUseProfilePlaaHistory.mockReturnValue({ data: REAL_HISTORY, isLoading: false });
      const { result } = renderHook(() => useProfileDataDefault());

      const may = result.current.snapshotHistory.find((e) => e.period === 'May 2026')!;
      expect(may.activityPlaa).toBe(100);
      expect(may.infra).toBe(900);
      expect(may.plaaTotal).toBe(1000);
      expect(may.hasInfra).toBe(true);

      const jun = result.current.snapshotHistory.find((e) => e.period === 'Jun 2026')!;
      expect(jun.hasInfra).toBe(false);
    });

    it('leaves activities/categories/points/items null when no points query has settled with data', () => {
      mockUseCurrentUserStore.mockReturnValue({ currentUser: { name: 'Alex Rivera' } });
      mockUseProfilePlaaHistory.mockReturnValue({ data: REAL_HISTORY, isLoading: false });
      const { result } = renderHook(() => useProfileDataDefault());

      for (const entry of result.current.snapshotHistory) {
        expect(entry.activities).toBeNull();
        expect(entry.categories).toBeNull();
        expect(entry.points).toBeNull();
        expect(entry.items).toBeNull();
      }
    });

    it('accumulates cum forward oldest-first from real iaPlaa + irPlaa, with redeemed left null (no per-period source)', () => {
      mockUseCurrentUserStore.mockReturnValue({ currentUser: { name: 'Alex Rivera' } });
      mockUseProfilePlaaHistory.mockReturnValue({ data: REAL_HISTORY, isLoading: false });
      const { result } = renderHook(() => useProfileDataDefault());

      expect(result.current.contributionHistory).toEqual([
        { period: 'May 2026', points: null, plaa: 100, infra: 900, redeemed: null, isPending: false, cum: 1000 },
        { period: 'Jun 2026', points: null, plaa: 0, infra: 0, redeemed: null, isPending: false, cum: 1000 },
        { period: 'Jul 2026', points: null, plaa: 50, infra: 0, redeemed: null, isPending: false, cum: 1050 },
      ]);
    });
  });

  describe('activity history (real per-period points, activities, categories)', () => {
    const REAL_HISTORY = [
      { period: '2026-05-26', iaPlaa: 100, irPlaa: 900, plaaTotal: 1000 },
      { period: '2026-06-26', iaPlaa: 0, irPlaa: 0, plaaTotal: 0 },
      { period: '2026-07-26', iaPlaa: 50, irPlaa: 0, plaaTotal: 50 },
    ];

    it("requests points for each period's raw ISO date, not the formatted \"Mon YYYY\" label", () => {
      mockUseCurrentUserStore.mockReturnValue({ currentUser: { name: 'Alex Rivera' } });
      mockUseProfilePlaaHistory.mockReturnValue({ data: REAL_HISTORY, isLoading: false });
      renderHook(() => useProfileDataDefault());

      expect(mockUseSnapshotPointsHistory).toHaveBeenCalledWith(['2026-05-26', '2026-06-26', '2026-07-26']);
    });

    it('merges real per-period points, activity count, category count, and items when available for that period', () => {
      mockUseCurrentUserStore.mockReturnValue({ currentUser: { name: 'Alex Rivera' } });
      mockUseProfilePlaaHistory.mockReturnValue({ data: REAL_HISTORY, isLoading: false });
      mockUseSnapshotPointsHistory.mockReturnValue({
        '2026-07-26': {
          snapshotPeriod: '2026-07-26',
          records: [
            { category: 'Category A', activityName: 'Activity 1', description: '', pointsCollectedPerSnapshot: 100 },
            { category: 'Category A', activityName: 'Activity 2', description: '', pointsCollectedPerSnapshot: 50 },
            { category: 'Category B', activityName: 'Activity 3', description: '', pointsCollectedPerSnapshot: 300 },
          ],
        },
      });
      const { result } = renderHook(() => useProfileDataDefault());

      const jul = result.current.snapshotHistory.find((e) => e.period === 'Jul 2026')!;
      expect(jul.activities).toBe(3);
      expect(jul.categories).toBe(2);
      expect(jul.points).toBe(450);
      expect(jul.items).toEqual([
        { category: 'Category A', title: 'Activity 1', points: 100 },
        { category: 'Category A', title: 'Activity 2', points: 50 },
        { category: 'Category B', title: 'Activity 3', points: 300 },
      ]);
    });

    it('leaves a period null when its points query has no data yet (still loading or settled empty), without affecting other periods', () => {
      mockUseCurrentUserStore.mockReturnValue({ currentUser: { name: 'Alex Rivera' } });
      mockUseProfilePlaaHistory.mockReturnValue({ data: REAL_HISTORY, isLoading: false });
      mockUseSnapshotPointsHistory.mockReturnValue({
        '2026-05-26': undefined, // still loading
        '2026-06-26': null, // settled, no data
        '2026-07-26': { snapshotPeriod: '2026-07-26', records: [{ category: 'Category A', activityName: 'Activity 1', description: '', pointsCollectedPerSnapshot: 10 }] },
      });
      const { result } = renderHook(() => useProfileDataDefault());

      const may = result.current.snapshotHistory.find((e) => e.period === 'May 2026')!;
      const jun = result.current.snapshotHistory.find((e) => e.period === 'Jun 2026')!;
      const jul = result.current.snapshotHistory.find((e) => e.period === 'Jul 2026')!;
      expect(may.items).toBeNull();
      expect(jun.items).toBeNull();
      expect(jul.items).not.toBeNull();
    });

    it('carries the merged per-period points value through to contributionHistory', () => {
      mockUseCurrentUserStore.mockReturnValue({ currentUser: { name: 'Alex Rivera' } });
      mockUseProfilePlaaHistory.mockReturnValue({ data: REAL_HISTORY, isLoading: false });
      mockUseSnapshotPointsHistory.mockReturnValue({
        '2026-07-26': {
          snapshotPeriod: '2026-07-26',
          records: [{ category: 'Category A', activityName: 'Activity 1', description: '', pointsCollectedPerSnapshot: 450 }],
        },
      });
      const { result } = renderHook(() => useProfileDataDefault());

      expect(result.current.contributionHistory.find((e) => e.period === 'Jul 2026')!.points).toBe(450);
      expect(result.current.contributionHistory.find((e) => e.period === 'May 2026')!.points).toBeNull();
    });
  });

  describe('identity (isInfraMember, memberSince)', () => {
    const REAL_HISTORY = [
      { period: '2026-05-26', iaPlaa: 100, irPlaa: 900, plaaTotal: 1000 },
      { period: '2026-06-26', iaPlaa: 0, irPlaa: 0, plaaTotal: 0 },
    ];

    it('reports isInfraMember false — no real RBAC source is wired yet', () => {
      mockUseCurrentUserStore.mockReturnValue({ currentUser: { name: 'Alex Rivera' } });
      const { result } = renderHook(() => useProfileDataDefault());

      expect(result.current.identity.isInfraMember).toBe(false);
    });

    it('derives memberSince from the real "Onboarding" activity record, formatted as "Mon YYYY"', () => {
      mockUseCurrentUserStore.mockReturnValue({ currentUser: { name: 'Alex Rivera' } });
      mockUseProfilePlaaHistory.mockReturnValue({ data: REAL_HISTORY, isLoading: false });
      mockUseSnapshotPointsHistory.mockReturnValue({
        '2026-05-26': {
          snapshotPeriod: '2026-05-01',
          records: [{ category: 'PLAA', activityName: 'Onboarding', description: 'Month Onboarded to PLAA', pointsCollectedPerSnapshot: 0 }],
        },
        '2026-06-26': { snapshotPeriod: '2026-06-01', records: [] },
      });
      const { result } = renderHook(() => useProfileDataDefault());

      expect(result.current.identity.memberSince).toBe('May 2026');
    });

    it('reports memberSince null when no Onboarding record is found — never guesses', () => {
      mockUseCurrentUserStore.mockReturnValue({ currentUser: { name: 'Alex Rivera' } });
      mockUseProfilePlaaHistory.mockReturnValue({ data: REAL_HISTORY, isLoading: false });
      mockUseSnapshotPointsHistory.mockReturnValue({
        '2026-05-26': { snapshotPeriod: '2026-05-01', records: [] },
        '2026-06-26': { snapshotPeriod: '2026-06-01', records: [] },
      });
      const { result } = renderHook(() => useProfileDataDefault());

      expect(result.current.identity.memberSince).toBeNull();
    });

    it('reports memberSince null while history or points are still loading', () => {
      mockUseCurrentUserStore.mockReturnValue({ currentUser: { name: 'Alex Rivera' } });
      mockUseProfilePlaaHistory.mockReturnValue({ data: undefined, isLoading: true });
      const { result } = renderHook(() => useProfileDataDefault());

      expect(result.current.identity.memberSince).toBeNull();
    });
  });

  describe('redemptions and snapshot lifecycle', () => {
    const REAL_HISTORY = [
      { period: '2026-05-26', iaPlaa: 100, irPlaa: 900, plaaTotal: 1000 },
      { period: '2026-06-26', iaPlaa: 0, irPlaa: 0, plaaTotal: 0 },
      { period: '2026-07-26', iaPlaa: 50, irPlaa: 0, plaaTotal: 50 },
    ];

    beforeEach(() => {
      mockUseCurrentUserStore.mockReturnValue({ currentUser: { name: 'Alex Rivera' } });
      mockUseProfilePlaaHistory.mockReturnValue({ data: REAL_HISTORY, isLoading: false });
    });

    it('attributes a redemption to the snapshot month its auction closed in', () => {
      mockUseRedemptionHistory.mockReturnValue({
        data: [{ auctionNumber: 2, plaaRedeemed: 640, roundNumber: 9, period: '2026-06-01' }],
      });
      const { result } = renderHook(() => useProfileDataDefault());

      const byPeriod = Object.fromEntries(
        result.current.contributionHistory.map((e) => [e.period, e.redeemed]),
      );
      expect(byPeriod['Jun 2026']).toBe(640);
      expect(byPeriod['May 2026']).toBeNull();
      expect(byPeriod['Jul 2026']).toBeNull();
    });

    it('sums several redemptions landing in the same month', () => {
      mockUseRedemptionHistory.mockReturnValue({
        data: [
          { auctionNumber: 1, plaaRedeemed: 100, roundNumber: 9, period: '2026-06-01' },
          { auctionNumber: 2, plaaRedeemed: 40, roundNumber: 9, period: '2026-06-01' },
        ],
      });
      const { result } = renderHook(() => useProfileDataDefault());

      const jun = result.current.contributionHistory.find((e) => e.period === 'Jun 2026');
      expect(jun?.redeemed).toBe(140);
    });

    it('ignores a redemption whose period could not be resolved, rather than placing it arbitrarily', () => {
      mockUseRedemptionHistory.mockReturnValue({
        data: [{ auctionNumber: 9, plaaRedeemed: 500, roundNumber: null, period: null }],
      });
      const { result } = renderHook(() => useProfileDataDefault());

      expect(result.current.contributionHistory.every((e) => e.redeemed === null)).toBe(true);
    });

    it('marks a snapshot pending when its round is not closed', () => {
      mockUseSnapshotLifecycle.mockReturnValue({
        data: [
          { roundNumber: 1, period: '2026-05-01', status: 'Snapshot Closed', plaaLocked: true, isClosed: true },
          { roundNumber: 2, period: '2026-06-01', status: 'Snapshot Closed', plaaLocked: true, isClosed: true },
          { roundNumber: 3, period: '2026-07-01', status: 'Appeal Window', plaaLocked: false, isClosed: false },
        ],
      });
      const { result } = renderHook(() => useProfileDataDefault());

      const byPeriod = Object.fromEntries(
        result.current.contributionHistory.map((e) => [e.period, e.isPending]),
      );
      expect(byPeriod['May 2026']).toBe(false);
      expect(byPeriod['Jul 2026']).toBe(true);
    });

    it('marks nothing pending while the lifecycle request has not resolved', () => {
      mockUseSnapshotLifecycle.mockReturnValue({ data: undefined });
      const { result } = renderHook(() => useProfileDataDefault());

      expect(result.current.contributionHistory.every((e) => e.isPending === false)).toBe(true);
    });
  });
});

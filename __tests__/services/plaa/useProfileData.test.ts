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
      data: { plaaBalance: 4854, activities: 2297, infraRewards: 2557, redeemed: 0 },
      isLoading: false,
    });
    const { result } = renderHook(() => useProfileDataDefault());

    expect(result.current.balance).toEqual({
      plaaBalance: 4854,
      activities: 2297,
      infraRewards: 2557,
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
      { period: '2026-05-26', iaPlaa: 304, irPlaa: 4300, plaaTotal: 4604 },
      { period: '2026-06-26', iaPlaa: 0, irPlaa: 0, plaaTotal: 0 },
      { period: '2026-07-26', iaPlaa: 205, irPlaa: 0, plaaTotal: 205 },
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
      expect(may.activityPlaa).toBe(304);
      expect(may.infra).toBe(4300);
      expect(may.plaaTotal).toBe(4604);
      expect(may.hasInfra).toBe(true);

      const jun = result.current.snapshotHistory.find((e) => e.period === 'Jun 2026')!;
      expect(jun.hasInfra).toBe(false);
    });

    it('leaves activities/categories/points/items null — no real per-period source yet', () => {
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
        { period: 'May 2026', points: null, plaa: 304, infra: 4300, redeemed: null, cum: 4604 },
        { period: 'Jun 2026', points: null, plaa: 0, infra: 0, redeemed: null, cum: 4604 },
        { period: 'Jul 2026', points: null, plaa: 205, infra: 0, redeemed: null, cum: 4809 },
      ]);
    });
  });
});

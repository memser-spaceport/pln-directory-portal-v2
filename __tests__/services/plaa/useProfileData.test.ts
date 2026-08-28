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

  it('keeps the mocked contribution history internally consistent', () => {
    mockUseCurrentUserStore.mockReturnValue({ currentUser: { name: 'Alex Rivera' } });
    const { result } = renderHook(() => useProfileDataDefault());
    const { contributionHistory, snapshotHistory } = result.current;

    // Running balance accumulates activityPlaa + infra - redeemed forward, oldest first.
    const oldestFirst = [...snapshotHistory].reverse();
    let expectedCum = 0;
    oldestFirst.forEach((entry, i) => {
      expectedCum += entry.activityPlaa + entry.infra - contributionHistory[i].redeemed;
      expect(contributionHistory[i].cum).toBe(expectedCum);
    });

    // Contribution history is oldest-first, the reverse of snapshot history (newest-first).
    expect(contributionHistory.map((c) => c.period)).toEqual([...snapshotHistory.map((s) => s.period)].reverse());
  });

  it('wires balance from useProfileBalance and reports balanceStatus "ready", independent of the mocked history', () => {
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
});

import { renderHook } from '@testing-library/react';

const mockUseCurrentUserStore = jest.fn();
jest.mock('@/services/auth/store', () => ({
  useCurrentUserStore: (selector: (s: any) => any) => selector(mockUseCurrentUserStore()),
}));

const mockUseCurrentSnapshotStatus = jest.fn();
jest.mock('@/services/plaa/hooks/useCurrentSnapshotStatus', () => ({
  useCurrentSnapshotStatus: () => mockUseCurrentSnapshotStatus(),
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

  it('keeps the PLAA balance and contribution history internally consistent', () => {
    mockUseCurrentUserStore.mockReturnValue({ currentUser: { name: 'Alex Rivera' } });
    const { result } = renderHook(() => useProfileDataDefault());
    const { balance, contributionHistory, snapshotHistory } = result.current;

    // balance = sum(activityPlaa) + sum(infra) - sum(redeemed), matching the design's
    // "PLAA balance = collected - redeemed".
    const activitiesTotal = snapshotHistory.reduce((sum, e) => sum + e.activityPlaa, 0);
    const infraTotal = snapshotHistory.reduce((sum, e) => sum + e.infra, 0);
    expect(balance.activities).toBe(activitiesTotal);
    expect(balance.infraRewards).toBe(infraTotal);
    expect(balance.plaaBalance).toBe(activitiesTotal + infraTotal - balance.redeemed);

    // The running balance's final entry must equal the hero's PLAA balance.
    const lastCum = contributionHistory[contributionHistory.length - 1]?.cum;
    expect(lastCum).toBe(balance.plaaBalance);

    // Contribution history is oldest-first, the reverse of snapshot history (newest-first).
    expect(contributionHistory.map((c) => c.period)).toEqual([...snapshotHistory.map((s) => s.period)].reverse());
  });
});

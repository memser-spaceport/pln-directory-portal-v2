import { act, renderHook } from '@testing-library/react';

import { useFollowDemoDayTeam } from '@/components/page/demo-day/DemodayCompletedView/components/CompletedDemoDayTeamsList/components/hooks/useFollowDemoDayTeam';
import type { DemoDayTeam } from '@/app/actions/demo-day.actions';

const mockMutate = jest.fn();
const mockRefresh = jest.fn();
const mockFollowed = jest.fn();
const mockUnfollowed = jest.fn();
let mockIsPending = false;

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh, push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
}));

jest.mock('@/services/follow/hooks/useFollowTeam', () => ({
  useFollowTeam: () => ({ mutate: mockMutate, isPending: mockIsPending }),
}));

jest.mock('@/analytics/demoday.analytics', () => ({
  useDemoDayAnalytics: () => ({
    onCompletedViewTeamFollowed: (...a: unknown[]) => mockFollowed(...a),
    onCompletedViewTeamUnfollowed: (...a: unknown[]) => mockUnfollowed(...a),
  }),
}));

const team = (overrides: Partial<DemoDayTeam> = {}): DemoDayTeam => ({
  uid: 'team-1',
  name: 'Protocol Labs',
  logoUrl: null,
  newsCount: 0,
  shortDescription: '',
  isFollowing: false,
  ...overrides,
});

/** Drives the mutation the way react-query would: success, then settled. */
const succeed = () => {
  const { onSuccess, onSettled } = mockMutate.mock.calls.at(-1)?.[1] ?? {};
  act(() => {
    onSuccess?.();
    onSettled?.();
  });
};

/** Failure: react-query still calls onSettled, but never onSuccess. */
const fail = () => {
  const { onSettled } = mockMutate.mock.calls.at(-1)?.[1] ?? {};
  act(() => onSettled?.());
};

beforeEach(() => {
  jest.clearAllMocks();
  mockIsPending = false;
});

describe('useFollowDemoDayTeam', () => {
  it('seeds its state from the team the server sent', () => {
    expect(renderHook(() => useFollowDemoDayTeam(team({ isFollowing: true }))).result.current.isFollowing).toBe(true);
    expect(renderHook(() => useFollowDemoDayTeam(team({ isFollowing: false }))).result.current.isFollowing).toBe(false);
  });

  it('asks to follow a team it is not following', () => {
    const { result } = renderHook(() => useFollowDemoDayTeam(team()));

    act(() => result.current.toggleFollow());

    expect(mockMutate).toHaveBeenCalledWith({ teamUid: 'team-1', action: 'follow' }, expect.any(Object));
  });

  it('asks to unfollow a team it is following', () => {
    const { result } = renderHook(() => useFollowDemoDayTeam(team({ isFollowing: true })));

    act(() => result.current.toggleFollow());

    expect(mockMutate).toHaveBeenCalledWith({ teamUid: 'team-1', action: 'unfollow' }, expect.any(Object));
  });

  it('flips the button only once the server agrees', () => {
    const { result } = renderHook(() => useFollowDemoDayTeam(team()));

    act(() => result.current.toggleFollow());
    expect(result.current.isFollowing).toBe(false);

    succeed();
    expect(result.current.isFollowing).toBe(true);
  });

  it('leaves the button as it was when the request fails', () => {
    const { result } = renderHook(() => useFollowDemoDayTeam(team()));

    act(() => result.current.toggleFollow());
    fail();

    expect(result.current.isFollowing).toBe(false);
  });

  it('reports a follow, and a later unfollow, with the team named', () => {
    const { result } = renderHook(() => useFollowDemoDayTeam(team()));

    act(() => result.current.toggleFollow());
    succeed();
    expect(mockFollowed).toHaveBeenCalledWith({ teamUid: 'team-1', teamName: 'Protocol Labs' });
    expect(mockUnfollowed).not.toHaveBeenCalled();

    act(() => result.current.toggleFollow());
    succeed();
    expect(mockUnfollowed).toHaveBeenCalledWith({ teamUid: 'team-1', teamName: 'Protocol Labs' });
  });

  it('reports nothing when the request fails', () => {
    const { result } = renderHook(() => useFollowDemoDayTeam(team()));

    act(() => result.current.toggleFollow());
    fail();

    expect(mockFollowed).not.toHaveBeenCalled();
    expect(mockUnfollowed).not.toHaveBeenCalled();
  });

  it('refreshes the server-rendered list either way, so the page stops disagreeing with the button', () => {
    const { result } = renderHook(() => useFollowDemoDayTeam(team()));

    act(() => result.current.toggleFollow());
    succeed();
    expect(mockRefresh).toHaveBeenCalledTimes(1);

    act(() => result.current.toggleFollow());
    fail();
    expect(mockRefresh).toHaveBeenCalledTimes(2);
  });

  it('passes the mutation pending flag straight through, so the card can disable itself', () => {
    mockIsPending = true;

    expect(renderHook(() => useFollowDemoDayTeam(team())).result.current.isPending).toBe(true);
  });

  it('sends the opposite action on the next click, rather than repeating the last one', () => {
    const { result } = renderHook(() => useFollowDemoDayTeam(team()));

    act(() => result.current.toggleFollow());
    succeed();

    act(() => result.current.toggleFollow());
    expect(mockMutate).toHaveBeenLastCalledWith({ teamUid: 'team-1', action: 'unfollow' }, expect.any(Object));
  });

  it('retries the same action after a failure, since the state never moved', () => {
    const { result } = renderHook(() => useFollowDemoDayTeam(team()));

    act(() => result.current.toggleFollow());
    fail();

    act(() => result.current.toggleFollow());
    expect(mockMutate).toHaveBeenLastCalledWith({ teamUid: 'team-1', action: 'follow' }, expect.any(Object));
  });
});

import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, InfiniteData } from '@tanstack/react-query';
import { renderHook, waitFor, act } from '@testing-library/react';

// jest.setup.js stubs useQuery/useMutation globally; this hook needs the real
// react-query mutation lifecycle (onSuccess/onError) to exercise the optimistic update.
jest.unmock('@tanstack/react-query');

import { useToggleTeamFollowInList } from '@/services/follow/hooks/useToggleTeamFollowInList';
import { FOLLOWING_TEAMS_COUNT_KEY } from '@/services/follow/hooks/useFollowingTeamsCount';
import { TeamsQueryKeys } from '@/services/teams/constants';
import { QueryData } from '@/services/teams/hooks/useInfiniteTeamsList';
import { ITeam, ITeamsSearchParams } from '@/types/teams.types';
import { followTeam, unfollowTeam } from '@/services/follow/follow.service';

jest.mock('@/services/follow/follow.service', () => ({
  followTeam: jest.fn(),
  unfollowTeam: jest.fn(),
}));

jest.mock('@/services/auth/store', () => ({
  useCurrentUserStore: (selector: (state: { currentUser: { uid: string }; isHydrated: boolean }) => unknown) =>
    selector({ currentUser: { uid: 'user-1' }, isHydrated: true }),
}));

jest.mock('@/analytics/follow.analytics', () => ({
  useFollowAnalytics: () => ({ onTeamFollowed: jest.fn(), onTeamUnfollowed: jest.fn() }),
}));

const mockFollowTeam = followTeam as jest.MockedFunction<typeof followTeam>;
const mockUnfollowTeam = unfollowTeam as jest.MockedFunction<typeof unfollowTeam>;

function team(id: string, isFollowed: boolean): ITeam {
  return { id, name: `Team ${id}`, isFollowed } as ITeam;
}

const allTabParams = { searchBy: '' } as unknown as ITeamsSearchParams;
const followingTabParams = { searchBy: '', followingOnly: 'true' } as unknown as ITeamsSearchParams;

function seedListCache(client: QueryClient, searchParams: ITeamsSearchParams, teams: ITeam[]) {
  const data: InfiniteData<QueryData, number> = {
    pages: [{ items: teams, total: teams.length, followingTotal: teams.filter((t) => t.isFollowed).length }],
    pageParams: [1],
  };
  client.setQueryData([TeamsQueryKeys.GET_TEAMS_LIST, searchParams], data);
}

function readItems(client: QueryClient, searchParams: ITeamsSearchParams): ITeam[] {
  const data = client.getQueryData<InfiniteData<QueryData, number>>([TeamsQueryKeys.GET_TEAMS_LIST, searchParams]);
  return data?.pages.flatMap((p) => p.items) ?? [];
}

describe('useToggleTeamFollowInList', () => {
  let client: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  });

  function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }

  it('optimistically flips isFollowed and settles on a successful follow', async () => {
    const teamA = team('a', false);
    seedListCache(client, allTabParams, [teamA]);
    client.setQueryData(FOLLOWING_TEAMS_COUNT_KEY, 0);
    mockFollowTeam.mockResolvedValue({ following: true, followerCount: 1 });

    const { result } = renderHook(() => useToggleTeamFollowInList({ team: teamA, searchParams: allTabParams }), {
      wrapper,
    });

    act(() => result.current.toggleFollow());

    // Optimistic: flips immediately, before the mocked network call resolves.
    expect(readItems(client, allTabParams)[0].isFollowed).toBe(true);
    expect(client.getQueryData(FOLLOWING_TEAMS_COUNT_KEY)).toBe(1);

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(readItems(client, allTabParams)[0].isFollowed).toBe(true);
    expect(client.getQueryData(FOLLOWING_TEAMS_COUNT_KEY)).toBe(1);
  });

  it('removes the card from the Following tab and decrements the badge on unfollow', async () => {
    const teamA = team('a', true);
    seedListCache(client, followingTabParams, [teamA]);
    client.setQueryData(FOLLOWING_TEAMS_COUNT_KEY, 1);
    mockUnfollowTeam.mockResolvedValue({ following: false, followerCount: 0 });

    const { result } = renderHook(
      () => useToggleTeamFollowInList({ team: teamA, searchParams: followingTabParams }),
      { wrapper },
    );

    act(() => result.current.toggleFollow());

    expect(readItems(client, followingTabParams)).toHaveLength(0);
    expect(client.getQueryData(FOLLOWING_TEAMS_COUNT_KEY)).toBe(0);

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(readItems(client, followingTabParams)).toHaveLength(0);
  });

  it('rolls back only the affected card when the API resolves with null (soft failure)', async () => {
    const teamA = team('a', false);
    seedListCache(client, allTabParams, [teamA]);
    client.setQueryData(FOLLOWING_TEAMS_COUNT_KEY, 0);
    mockFollowTeam.mockResolvedValue(null);

    const { result } = renderHook(() => useToggleTeamFollowInList({ team: teamA, searchParams: allTabParams }), {
      wrapper,
    });

    act(() => result.current.toggleFollow());
    expect(readItems(client, allTabParams)[0].isFollowed).toBe(true);

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(readItems(client, allTabParams)[0].isFollowed).toBe(false);
    expect(client.getQueryData(FOLLOWING_TEAMS_COUNT_KEY)).toBe(0);
  });

  it('does not let one card rolling back clobber a sibling card that already succeeded', async () => {
    const teamA = team('a', false);
    const teamB = team('b', false);
    seedListCache(client, allTabParams, [teamA, teamB]);
    client.setQueryData(FOLLOWING_TEAMS_COUNT_KEY, 0);

    mockFollowTeam.mockImplementation((teamUid: string) =>
      teamUid === 'a' ? Promise.resolve(null) : Promise.resolve({ following: true, followerCount: 1 }),
    );

    const { result: resultA } = renderHook(
      () => useToggleTeamFollowInList({ team: teamA, searchParams: allTabParams }),
      { wrapper },
    );
    const { result: resultB } = renderHook(
      () => useToggleTeamFollowInList({ team: teamB, searchParams: allTabParams }),
      { wrapper },
    );

    act(() => {
      resultA.current.toggleFollow();
      resultB.current.toggleFollow();
    });

    await waitFor(() => expect(resultA.current.isPending).toBe(false));
    await waitFor(() => expect(resultB.current.isPending).toBe(false));

    const items = readItems(client, allTabParams);
    expect(items.find((t) => t.id === 'a')?.isFollowed).toBe(false);
    expect(items.find((t) => t.id === 'b')?.isFollowed).toBe(true);
    expect(client.getQueryData(FOLLOWING_TEAMS_COUNT_KEY)).toBe(1);
  });
});

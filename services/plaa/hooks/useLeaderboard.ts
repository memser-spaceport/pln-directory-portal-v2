import { useQuery } from '@tanstack/react-query';
import { getCookiesFromClient } from '@/utils/third-party.helper';
import type { LeaderboardApiResponse, LeaderboardType } from '@/services/plaa/leaderboard.utils';

export const LeaderboardQueryKeys = {
  ROUND: 'plaa-leaderboard-round',
} as const;

async function fetchLeaderboard(
  roundNumber: number,
  leaderboardType?: LeaderboardType
): Promise<LeaderboardApiResponse | null> {
  const { authToken } = getCookiesFromClient();
  if (!authToken) return null;

  try {
    const url = new URL('/api/plaa/leaderboard', window.location.origin);
    url.searchParams.set('roundNumber', roundNumber.toString());
    if (leaderboardType) url.searchParams.set('leaderboardType', leaderboardType);

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (res.status === 401 || res.status === 403 || res.status === 404) return null;
    if (!res.ok) throw new Error(`Leaderboard request failed: ${res.status}`);

    return (await res.json()) as LeaderboardApiResponse;
  } catch (error) {
    console.error('fetchLeaderboard error:', error);
    return null;
  }
}

/** Fetches a round's leaderboard client-side with the user's token (auth-gated API). */
export function useLeaderboard(roundNumber: number, leaderboardType?: LeaderboardType) {
  return useQuery<LeaderboardApiResponse | null>({
    queryKey: [LeaderboardQueryKeys.ROUND, roundNumber, leaderboardType ?? 'all'],
    queryFn: () => fetchLeaderboard(roundNumber, leaderboardType),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

import { cookies } from 'next/headers';

import { getParsedValue } from '@/utils/common.utils';

import type { LeaderboardApiResponse, LeaderboardType } from './leaderboard.utils';

export type { LeaderboardApiResponse, LeaderboardType, ApiLeaderboardEntry, MappedLeaderboardEntry } from './leaderboard.utils';
export { mapEntries, splitLeaderboardEntries, getPastRoundLeaderboardEntries } from './leaderboard.utils';

export const getLeaderboard = async (
  roundNumber: number,
  leaderboardType?: LeaderboardType
): Promise<{ data?: LeaderboardApiResponse; error?: { message: string } }> => {
  try {
    const cookieStore = await cookies();
    const authToken = getParsedValue(cookieStore.get('authToken')?.value);
    const authHeader = authToken ? `Bearer ${authToken}` : undefined;

    const url = new URL(`${process.env.PLAA_API_URL}/api/v1/leaderboard`);
    url.searchParams.set('roundNumber', roundNumber.toString());
    if (leaderboardType) url.searchParams.set('leaderboardType', leaderboardType);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return { error: { message: `API responded with ${response.status}: ${response.statusText}` } };
    }

    const data: LeaderboardApiResponse = await response.json();
    return { data };
  } catch (error) {
    console.error(`[leaderboard.service] Failed to fetch leaderboard for round ${roundNumber}:`, error);
    return { error: { message: 'Failed to fetch leaderboard data' } };
  }
};

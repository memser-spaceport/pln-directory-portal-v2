'use server';

export type LeaderboardType = 'CURRENT_SNAPSHOT' | 'CUMULATIVE' | 'PAST_ROUND';

export interface ApiLeaderboardEntry {
  id: string;
  roundId: string;
  type: LeaderboardType;
  rank: number;
  name: string;
  activities: string | null;
  points: number;
  createdAt: string;
  updatedAt: string;
}

export interface LeaderboardApiResponse {
  roundId: string;
  roundNumber: number;
  isCurrentRound: boolean;
  month: string | null;
  year: number | null;
  entries: ApiLeaderboardEntry[];
}

export interface MappedLeaderboardEntry {
  rank: number;
  name: string;
  activities: string;
  points: number;
}

export const mapEntries = (entries: ApiLeaderboardEntry[]): MappedLeaderboardEntry[] =>
  entries.map((e) => ({
    rank: e.rank,
    name: e.name,
    activities: e.activities ?? '',
    points: e.points,
  }));

export const getLeaderboard = async (
  roundNumber: number,
  leaderboardType?: LeaderboardType
): Promise<{ data?: LeaderboardApiResponse; error?: { message: string } }> => {
  try {
    const url = new URL(`${process.env.PLAA_API_URL}/leaderboard`);
    url.searchParams.set('roundNumber', roundNumber.toString());
    if (leaderboardType) url.searchParams.set('leaderboardType', leaderboardType);

    const response = await fetch(url.toString(), {
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

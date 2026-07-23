/**
 * Current-round aggregate stats from plaa-service (public endpoint, no auth).
 * Replaces the weekly hand-edited numbers in current-round.data.ts: chart
 * per-KPI sums, total points, participants, activity catalog, round meta.
 */

export interface RoundStatsChartEntry {
  name: string;
  value: number;
}

export interface RoundStatsResponse {
  roundId: string;
  roundNumber: number;
  period: string;
  month: string;
  year: number;
  isCurrentRound: boolean;
  lastUpdated: string;
  chart: RoundStatsChartEntry[];
  totalPointsCollected: number;
  onboardedParticipants: number;
  incentivizedActivities: string[];
}

export const getCurrentRoundStats = async (): Promise<{
  data?: RoundStatsResponse;
  error?: { message: string };
}> => {
  try {
    const response = await fetch(`${process.env.PLAA_API_URL}/api/v1/rounds/current/stats`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      // Fresh on every render, matching the leaderboard fetch policy.
      cache: 'no-store',
    });

    if (!response.ok) {
      return { error: { message: `API responded with ${response.status}: ${response.statusText}` } };
    }

    const data: RoundStatsResponse = await response.json();
    return { data };
  } catch (error) {
    console.error('[rounds.service] Failed to fetch current round stats:', error);
    return { error: { message: 'Failed to fetch current round stats' } };
  }
};

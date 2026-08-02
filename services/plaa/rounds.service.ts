/**
 * Current-round aggregate stats from plaa-service (public endpoint, no auth).
 * Replaces the weekly hand-edited numbers in current-round.data.ts: chart
 * per-KPI sums, total points, participants, activity catalog, round meta.
 */

export interface RoundStatsChartEntry {
  name: string;
  value: number;
}

export interface RoundBuybackStats {
  anticipated: boolean;
  simulation: boolean;
  clearingPrice: number | null;
  totalTokensDistributed: number | null;
  totalBuybackPool: number | null;
  poolUsed: number | null;
  cappedAllocation: number | null;
  tokensPurchased: number | null;
  winningBidders: number | null;
  totalFilled: number | null;
  fillRate: number | null;
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
  regionsUnlocked: string[];
  labweek25IncentivizedActivities: string[];
  buyback: RoundBuybackStats | null;
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

/**
 * Stats for an arbitrary round by number. Used by the past-round archive
 * page for rounds that don't have a hand-authored data file (round 18+).
 */
export const getRoundStats = async (
  roundNumber: number,
): Promise<{
  data?: RoundStatsResponse;
  error?: { message: string };
}> => {
  try {
    const response = await fetch(`${process.env.PLAA_API_URL}/api/v1/rounds/${roundNumber}/stats`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) {
      return { error: { message: `API responded with ${response.status}: ${response.statusText}` } };
    }

    const data: RoundStatsResponse = await response.json();
    return { data };
  } catch (error) {
    console.error('[rounds.service] Failed to fetch round stats:', error);
    return { error: { message: 'Failed to fetch round stats' } };
  }
};

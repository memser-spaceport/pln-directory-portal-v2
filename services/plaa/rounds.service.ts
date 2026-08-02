/**
 * Current-round aggregate stats from plaa-service (public endpoint, no auth).
 * Replaces the weekly hand-edited numbers in current-round.data.ts: chart
 * per-KPI sums, total points, participants, activity catalog, round meta.
 */

export interface RoundStatsChartEntry {
  name: string;
  value: number;
}

export interface RoundBuybackBid {
  bidderId: string;
  tokensBid: number;
  tokenPrice: number;
  bidValue: number;
  status: string;
  amtFilled: number | null;
  accepted: number | null;
  aggFill: number;
  percentCapture: number | null;
}

export interface RoundBuybackStats {
  anticipated: boolean;
  simulation: boolean;
  auctionNumber: number | null;
  headerDescription: string | null;
  clearingPrice: number | null;
  totalTokensDistributed: number | null;
  // Raw display strings, stored/formatted exactly as entered — irregular by
  // nature (some rounds show cents, some don't; cappedAllocation can read
  // "n/a" or carry a "(50% cap)" note).
  totalBuybackPool: string | null;
  poolUsed: number | null;
  cappedAllocation: string | null;
  tokensPurchased: number | null;
  winningBidders: number | null;
  totalFilled: string | null;
  bids: RoundBuybackBid[];
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

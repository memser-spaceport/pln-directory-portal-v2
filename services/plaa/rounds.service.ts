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
  // Raw display strings, not numbers (e.g. cappedAllocation can read "n/a"
  // or carry a "(50% cap)" note).
  totalBuybackPool: string | null;
  poolUsed: number | null;
  cappedAllocation: string | null;
  tokensPurchased: number | null;
  winningBidders: number | null;
  totalFilled: string | null;
  bids: RoundBuybackBid[];
}

export interface RoundStatsResponse {
  roundNumber: number;
  period: string;
  month: string;
  year: number;
  isCurrentRound: boolean;
  lastUpdated: string;
  chart: RoundStatsChartEntry[];
  tokenChart: RoundStatsChartEntry[];
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

export interface CompletedBuyback {
  roundNumber: number;
  month: string;
  year: number;
  buyback: RoundBuybackStats;
}

// Sorted by round number, not auctionNumber: auctionNumber is nullable, so
// sorting by it can leave a stale auction at the head. No index endpoint
// exists, so this walks every round and keeps the ones with a real result.
export const getCompletedBuybacks = async (): Promise<CompletedBuyback[]> => {
  const { data: current } = await getCurrentRoundStats();
  if (!current) return [];

  const results = await Promise.all(
    Array.from({ length: current.roundNumber }, (_, i) => getRoundStats(i + 1)),
  );

  return results
    .map((result) => result.data)
    .filter((stats): stats is RoundStatsResponse => Boolean(stats))
    .filter((stats) => stats.buyback && stats.buyback.totalBuybackPool !== null && !stats.buyback.simulation)
    .map((stats) => ({
      roundNumber: stats.roundNumber,
      month: stats.month,
      year: stats.year,
      buyback: stats.buyback as RoundBuybackStats,
    }))
    .sort((a, b) => b.roundNumber - a.roundNumber);
};

// Used by the past-round archive page for rounds without a hand-authored data file.
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

import { notFound, redirect } from 'next/navigation';
import PastRoundComponent from '@/components/page/aligement-assets/rounds/past-round-component';
import { currentRoundData } from '@/components/page/aligement-assets/rounds/data';
import { getRoundStats, RoundBuybackStats, RoundStatsResponse } from '@/services/plaa/rounds.service';
import { IPastRoundData, BuybackSimulationSectionData } from '@/components/page/aligement-assets/rounds/types/current-round.types';
import styles from './page.module.css';

interface PastRoundPageProps {
  params: Promise<{ round: string }>;
}

function formatCurrency(value: number | null): string {
  if (value === null) return 'TBD';
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPercent(value: number | null): string {
  if (value === null) return 'TBD';
  return `${value.toFixed(2)}%`;
}

function formatCount(value: number | null): string {
  if (value === null) return 'TBD';
  return value.toLocaleString('en-US');
}

// A buyback_results row can be just an "anticipated" placeholder (round hasn't
// settled yet) with every number null — only build the section once there's
// an actual result to show.
function buildBuybackSimulation(buyback: RoundBuybackStats): BuybackSimulationSectionData {
  const label = buyback.simulation ? 'Buyback Simulation' : 'Buyback Auction';
  return {
    title: buyback.simulation ? 'Buyback Simulation' : 'Live Buyback Auction',
    headerDescription: `Results from this round's buyback ${buyback.simulation ? 'simulation' : 'auction'}.`,
    totalFilled: formatCurrency(buyback.totalFilled),
    summary: {
      title: `${label} - Key Results`,
      items: [
        { icon: '/icons/rounds/buy_action_results/wallet-01.svg', label: 'Total Buyback Pool', value: formatCurrency(buyback.totalBuybackPool) },
        { icon: '/icons/rounds/buy_action_results/pie-chart.svg', label: 'Pool Used', value: formatPercent(buyback.poolUsed) },
        { icon: '/icons/rounds/buy_action_results/coins-02.svg', label: 'Clearing Price', value: formatCurrency(buyback.clearingPrice) },
        { icon: '/icons/rounds/buy_action_results/analytics-01.svg', label: 'Capped Allocation', value: formatCurrency(buyback.cappedAllocation) },
        { icon: '/icons/rounds/buy_action_results/dollar-02.svg', label: 'Tokens Purchased', value: formatCount(buyback.tokensPurchased) },
        { icon: '/icons/rounds/buy_action_results/user-multiple.svg', label: 'Winning Bidders', value: formatCount(buyback.winningBidders) },
      ],
    },
    bids: [],
  };
}

/**
 * Every past round is rendered entirely from the rounds API — no more
 * round-N.data.ts file per round. Hero copy never varies by round (verified
 * against all 18 archived rounds), so it's read from the current-round data
 * file, which is the one piece of editorial content that's genuinely
 * round-independent.
 */
function mapStatsToPastRoundData(stats: RoundStatsResponse): IPastRoundData {
  const hasSettledBuyback = stats.buyback !== null && stats.buyback.totalBuybackPool !== null;

  return {
    meta: {
      roundId: stats.roundId,
      roundNumber: stats.roundNumber,
      isCurrentRound: stats.isCurrentRound,
      month: stats.month,
      year: stats.year,
      lastUpdated: stats.lastUpdated,
    },
    hero: currentRoundData.hero,
    stats: {
      onboardedParticipants: stats.onboardedParticipants,
      regionsUnlocked: stats.regionsUnlocked,
      incentivizedActivities: stats.incentivizedActivities,
      totalPointsCollected: stats.totalPointsCollected.toLocaleString('en-US'),
      totalTokensDistributed:
        stats.buyback?.totalTokensDistributed != null
          ? stats.buyback.totalTokensDistributed.toLocaleString('en-US')
          : 'TBD',
      numberOfBuybacks: hasSettledBuyback && !stats.buyback!.simulation ? 1 : 0,
    },
    leaderboard: [],
    buybackSimulation: hasSettledBuyback ? buildBuybackSimulation(stats.buyback!) : undefined,
  };
}

export default async function PastRoundPage({ params }: PastRoundPageProps) {
  const { round: roundParam } = await params;
  const roundNumber = parseInt(roundParam, 10);

  // Guard: not a valid integer
  if (isNaN(roundNumber) || roundNumber < 1) notFound();

  const { data: stats } = await getRoundStats(roundNumber);
  if (!stats) notFound();

  // Pointing at the live current round → redirect to the canonical current-round URL
  if (stats.isCurrentRound) redirect('/alignment-asset');

  return (
    <div className={styles.pastRound}>
      <PastRoundComponent pastRoundData={mapStatsToPastRoundData(stats)} />
    </div>
  );
}

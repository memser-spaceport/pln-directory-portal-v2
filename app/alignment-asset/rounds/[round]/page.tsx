import { notFound, redirect } from 'next/navigation';
import PastRoundComponent from '@/components/page/aligement-assets/rounds/past-round-component';
import { currentRoundData } from '@/components/page/aligement-assets/rounds/data';
import { getRoundStats, RoundBuybackBid, RoundBuybackStats, RoundStatsResponse } from '@/services/plaa/rounds.service';
import {
  IPastRoundData,
  BuybackSimulationSectionData,
  BuybackBidEntry,
} from '@/components/page/aligement-assets/rounds/types/current-round.types';
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

// Bid-ledger cells use '' for "not applicable" (unfilled bids), matching the
// original hand-typed table, rather than the summary card's 'TBD'.
//
// tokenPrice/clearingPrice/bidValue forced 2 decimals in a 2-of-3 majority of
// the original rounds (7 and 11; only round 9 didn't). amtFilled/aggFill go
// the other way — natural in a 2-of-3 majority (9 and 11; only round 7
// forced them). Neither is exact for every round (nothing can be, the
// original wasn't systematic), but each follows the majority convention.
function formatBidPrice(value: number | null): string {
  if (value === null) return '';
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatBidAmount(value: number | null): string {
  if (value === null) return '';
  // Whole dollars show no decimals; anything with real cents shows exactly
  // 2, never 1 (a bare float can't distinguish "35312.4" from "35312.40",
  // so pad explicitly rather than leaving it to whatever precision the
  // number happens to carry).
  const decimals = Number.isInteger(value) ? 0 : 2;
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

function formatBidCount(value: number | null): string {
  if (value === null) return '';
  return value.toLocaleString('en-US');
}

function formatBidPercent(value: number | null): string {
  if (value === null) return '';
  return `${value.toFixed(2)}%`;
}

function mapBid(bid: RoundBuybackBid): BuybackBidEntry {
  return {
    bidderId: bid.bidderId,
    tokensBid: formatBidCount(bid.tokensBid),
    tokenPrice: formatBidPrice(bid.tokenPrice),
    bidValue: formatBidPrice(bid.bidValue),
    // Constrained at the Airtable source to the five values this type expects.
    status: bid.status as BuybackBidEntry['status'],
    amtFilled: formatBidAmount(bid.amtFilled),
    accepted: formatBidCount(bid.accepted),
    aggFill: formatBidAmount(bid.aggFill),
    percentCapture: formatBidPercent(bid.percentCapture),
  };
}

// A buyback_results row can be just an "anticipated" placeholder (round hasn't
// settled yet) with every field null — only build the section once there's an
// actual result to show. totalBuybackPool/cappedAllocation/totalFilled come
// back pre-formatted (raw display strings, entered exactly as shown — e.g.
// "n/a" or "$23,811.55 (50% cap)"), not numbers to reformat.
function buildBuybackSimulation(buyback: RoundBuybackStats): BuybackSimulationSectionData {
  const label = buyback.simulation ? 'Buyback Simulation' : 'Buyback Auction';
  const numbered = buyback.auctionNumber != null ? `${label} #${buyback.auctionNumber}` : label;
  return {
    title: buyback.simulation ? 'Buyback Simulation' : 'Live Buyback Auction',
    headerDescription:
      buyback.headerDescription ?? `Results from this round's buyback ${buyback.simulation ? 'simulation' : 'auction'}.`,
    totalFilled: buyback.totalFilled ?? 'TBD',
    summary: {
      title: `${numbered} - Key Results`,
      items: [
        { icon: '/icons/rounds/buy_action_results/wallet-01.svg', label: 'Total Buyback Pool', value: buyback.totalBuybackPool ?? 'TBD' },
        { icon: '/icons/rounds/buy_action_results/pie-chart.svg', label: 'Pool Used', value: formatPercent(buyback.poolUsed) },
        { icon: '/icons/rounds/buy_action_results/coins-02.svg', label: 'Clearing Price', value: formatCurrency(buyback.clearingPrice) },
        { icon: '/icons/rounds/buy_action_results/analytics-01.svg', label: 'Capped Allocation', value: buyback.cappedAllocation ?? 'TBD' },
        { icon: '/icons/rounds/buy_action_results/dollar-02.svg', label: 'Tokens Purchased', value: formatCount(buyback.tokensPurchased) },
        { icon: '/icons/rounds/buy_action_results/user-multiple.svg', label: 'Winning Bidders', value: formatCount(buyback.winningBidders) },
      ],
    },
    bids: buyback.bids.map(mapBid),
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
      // Original data counted any buyback event (simulation or live) as 1 —
      // rounds 7, 9, and 11 all show numberOfBuybacks: 1 regardless of the
      // simulation flag.
      numberOfBuybacks: hasSettledBuyback ? 1 : 0,
      ...(stats.labweek25IncentivizedActivities.length > 0
        ? { labweek25IncentivizedActivities: stats.labweek25IncentivizedActivities }
        : {}),
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

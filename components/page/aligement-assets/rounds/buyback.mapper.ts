/**
 * Maps a round's raw buyback record from the rounds API into the shape the
 * buyback UI renders. Shared so that every surface showing a buyback — the
 * round pages and the Trust & Holdings accordions — derives its figures from
 * one place and cannot drift apart.
 */
import { RoundBuybackBid, RoundBuybackStats } from '@/services/plaa/rounds.service';
import { BuybackBidEntry, BuybackSimulationSectionData } from './types/current-round.types';

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
export function buildBuybackSimulation(buyback: RoundBuybackStats): BuybackSimulationSectionData {
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
        { icon: '/icons/rounds/buy_action_results/dollar-02.svg', label: 'PLAA Redeemed', value: formatCount(buyback.tokensPurchased) },
        { icon: '/icons/rounds/buy_action_results/user-multiple.svg', label: 'Accepted Bidders', value: formatCount(buyback.winningBidders) },
      ],
    },
    bids: buyback.bids.map(mapBid),
  };
}

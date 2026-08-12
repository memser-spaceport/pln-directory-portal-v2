import TrustHoldings, { TrustBuyback } from '@/components/page/aligement-assets/trust-holdings/trust-holdings';
import { getTrustHoldings } from '@/services/plaa/trust-holdings.service';
import { getCompletedBuybacks } from '@/services/plaa/rounds.service';
import { buildBuybackSimulation } from '@/components/page/aligement-assets/rounds/buyback.mapper';

/**
 * The buyback accordions read the same rounds API the round pages do, mapped
 * through the same buildBuybackSimulation, so the figures on this page cannot
 * drift from /alignment-asset/rounds/[round]. Nothing about a buyback is
 * entered here.
 */
async function getBuybackPanels(): Promise<TrustBuyback[]> {
  const completed = await getCompletedBuybacks();
  return completed.map((entry) => ({
    roundNumber: entry.roundNumber,
    monthYear: `${entry.month} ${entry.year}`,
    auctionNumber: entry.buyback.auctionNumber,
    section: buildBuybackSimulation(entry.buyback),
  }));
}

export default async function TrustHoldingsPage() {
  const [{ data, error }, buybacks] = await Promise.all([getTrustHoldings(), getBuybackPanels()]);

  if (!data) {
    return (
      <div style={{ padding: '40px', color: '#64748b', fontSize: '14px' }}>
        {error?.message ?? 'Trust & Holdings data is currently unavailable. Please try again later.'}
      </div>
    );
  }

  return <TrustHoldings data={data} buybacks={buybacks} />;
}

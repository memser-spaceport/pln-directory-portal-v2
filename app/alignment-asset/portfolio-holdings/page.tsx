import TrustHoldings, { TrustBuyback } from '@/components/page/aligement-assets/trust-holdings/trust-holdings';
import { getTrustHoldings } from '@/services/plaa/trust-holdings.service';
import { getCompletedBuybacks } from '@/services/plaa/rounds.service';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { buildBuybackSimulation } from '@/components/page/aligement-assets/rounds/buyback.mapper';

// Same source and mapper as the round pages — figures here cannot drift
// from /alignment-asset/rounds/[round].
async function getBuybackPanels(authToken?: string): Promise<TrustBuyback[]> {
  const completed = await getCompletedBuybacks(authToken);
  return completed.map((entry) => ({
    roundNumber: entry.roundNumber,
    monthYear: `${entry.month} ${entry.year}`,
    auctionNumber: entry.buyback.auctionNumber,
    section: buildBuybackSimulation(entry.buyback),
  }));
}

export default async function TrustHoldingsPage() {
  const { authToken } = await getCookiesFromHeaders();
  const [{ data, error }, buybacks] = await Promise.all([getTrustHoldings(authToken), getBuybackPanels(authToken)]);

  if (!data) {
    return (
      <div style={{ padding: '40px', color: '#64748b', fontSize: '14px' }}>
        {error?.message ?? 'Portfolio & Holdings data is currently unavailable. Please try again later.'}
      </div>
    );
  }

  return <TrustHoldings data={data} buybacks={buybacks} />;
}

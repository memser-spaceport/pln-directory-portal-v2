import TrustHoldings from '@/components/page/aligement-assets/trust-holdings/trust-holdings';
import { getTrustHoldings } from '@/services/plaa/trust-holdings.service';

export default async function TrustHoldingsPage() {
  const { data, error } = await getTrustHoldings();

  if (!data) {
    return (
      <div style={{ padding: '40px', color: '#64748b', fontSize: '14px' }}>
        {error?.message ?? 'Trust & Holdings data is currently unavailable. Please try again later.'}
      </div>
    );
  }

  return <TrustHoldings data={data} />;
}

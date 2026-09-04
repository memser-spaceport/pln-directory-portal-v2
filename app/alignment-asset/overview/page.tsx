import OverviewPage from '@/components/page/aligement-assets/overview/overview-page';
import { getKpiWeights } from '@/services/plaa/kpi-weights.service';
import { getCurrentRoundStats } from '@/services/plaa/rounds.service';
import { getTrustHoldings } from '@/services/plaa/trust-holdings.service';

export default async function OverviewRoutePage() {
  const [{ data: kpiWeights }, { data: roundStats }, { data: trustHoldings }] = await Promise.all([
    getKpiWeights(),
    getCurrentRoundStats(),
    getTrustHoldings(),
  ]);

  return <OverviewPage kpiWeights={kpiWeights?.items} roundStats={roundStats} trustHoldings={trustHoldings} />;
}

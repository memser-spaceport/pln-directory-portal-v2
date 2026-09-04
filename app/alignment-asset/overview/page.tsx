import OverviewPage from '@/components/page/aligement-assets/overview/overview-page';
import type { RoundHistoryEntry } from '@/components/page/aligement-assets/overview/active-member-overview';
import { getKpiWeights } from '@/services/plaa/kpi-weights.service';
import { getCurrentRoundStats, getRoundStats, RoundStatsResponse } from '@/services/plaa/rounds.service';
import { getTrustHoldings } from '@/services/plaa/trust-holdings.service';

function toCategoryStats(data: RoundStatsResponse | undefined, categories: string[]) {
  const points = data?.chart ?? [];
  const plaa = data?.tokenChart ?? [];
  return categories.map((name) => ({
    name,
    points: points.find((entry) => entry.name === name)?.value ?? 0,
    plaa: plaa.find((entry) => entry.name === name)?.value ?? 0,
  }));
}

// One request per round, no cache — same tradeoff the old Incentive Model
// page made: self-maintaining as new rounds appear, at the cost of a
// request per round.
async function getRoundHistory(totalRounds: number): Promise<RoundHistoryEntry[]> {
  const results = await Promise.all(Array.from({ length: totalRounds }, (_, i) => getRoundStats(i + 1)));

  const categoryNames = new Set<string>();
  results.forEach(({ data }) => {
    data?.chart.forEach((entry) => categoryNames.add(entry.name));
    data?.tokenChart.forEach((entry) => categoryNames.add(entry.name));
  });
  const categories = Array.from(categoryNames).sort();

  return results
    .map(({ data }) =>
      data
        ? {
            roundNumber: data.roundNumber,
            label: `${data.month} ${data.year}`,
            categories: toCategoryStats(data, categories),
          }
        : null,
    )
    .filter((entry): entry is RoundHistoryEntry => entry !== null)
    .sort((a, b) => b.roundNumber - a.roundNumber);
}

export default async function OverviewRoutePage() {
  const [{ data: kpiWeights }, { data: roundStats }, { data: trustHoldings }] = await Promise.all([
    getKpiWeights(),
    getCurrentRoundStats(),
    getTrustHoldings(),
  ]);

  const roundHistory = roundStats ? await getRoundHistory(roundStats.roundNumber) : [];

  return (
    <OverviewPage
      kpiWeights={kpiWeights?.items}
      roundStats={roundStats}
      trustHoldings={trustHoldings}
      roundHistory={roundHistory}
    />
  );
}

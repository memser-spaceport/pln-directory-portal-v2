import OverviewPage from '@/components/page/aligement-assets/overview/overview-page';
import type { RoundHistoryEntry } from '@/components/page/aligement-assets/overview/active-member-overview';
import { getKpiWeights } from '@/services/plaa/kpi-weights.service';
import { getAllRoundStats, RoundStatsResponse } from '@/services/plaa/rounds.service';
import { getTrustHoldings } from '@/services/plaa/trust-holdings.service';
import { getCookiesFromHeaders } from '@/utils/next-helpers';

function toCategoryStats(data: RoundStatsResponse | undefined, categories: string[]) {
  const points = data?.chart ?? [];
  const plaa = data?.tokenChart ?? [];
  return categories.map((name) => ({
    name,
    points: points.find((entry) => entry.name === name)?.value ?? 0,
    plaa: plaa.find((entry) => entry.name === name)?.value ?? 0,
  }));
}

function getRoundHistory(rounds: RoundStatsResponse[]): RoundHistoryEntry[] {
  const categoryNames = new Set<string>();
  rounds.forEach((data) => {
    data.chart.forEach((entry) => categoryNames.add(entry.name));
    data.tokenChart.forEach((entry) => categoryNames.add(entry.name));
  });
  const categories = Array.from(categoryNames).sort();

  return rounds
    .map((data) => ({
      roundNumber: data.roundNumber,
      label: `${data.month} ${data.year}`,
      categories: toCategoryStats(data, categories),
    }))
    .sort((a, b) => b.roundNumber - a.roundNumber);
}

export default async function OverviewRoutePage() {
  const { authToken } = await getCookiesFromHeaders();
  const [{ data: kpiWeights }, { data: rounds = [] }, { data: trustHoldings }] = await Promise.all([
    getKpiWeights(),
    getAllRoundStats(authToken),
    getTrustHoldings(authToken),
  ]);

  const roundStats = rounds.find((round) => round.isCurrentRound);
  const roundHistory = roundStats
    ? getRoundHistory(rounds.filter((round) => round.roundNumber <= roundStats.roundNumber))
    : [];

  return (
    <OverviewPage
      kpiWeights={kpiWeights?.items}
      roundStats={roundStats}
      trustHoldings={trustHoldings}
      roundHistory={roundHistory}
    />
  );
}

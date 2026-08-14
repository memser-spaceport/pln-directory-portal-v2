import { notFound } from "next/navigation";
import IncentiveModel, { RoundCategoryEntry, RoundOption } from "@/components/page/aligement-assets/incentive-model/incentive-model";
import { getCurrentRoundStats, getRoundStats, RoundStatsResponse } from "@/services/plaa/rounds.service";

function toCategoryEntries(data: RoundStatsResponse | undefined, categories: string[]): RoundCategoryEntry[] {
  const points = data?.chart ?? [];
  const tokens = data?.tokenChart ?? [];
  return categories.map((category) => ({
    category,
    points: points.find((entry) => entry.name === category)?.value ?? 0,
    tokens: tokens.find((entry) => entry.name === category)?.value ?? 0,
  }));
}

export default async function IncentiveModelPage() {
  const { data: current } = await getCurrentRoundStats();
  if (!current) notFound();
  const totalRounds = current.roundNumber;

  // One request per round, no cache: self-maintaining as new rounds appear,
  // at the cost of a request per round.
  const results = await Promise.all(
    Array.from({ length: totalRounds }, (_, i) => getRoundStats(i + 1)),
  );

  // Category axis is the union of whatever the fetched rounds actually
  // contain, not a hand-typed list.
  const categories = new Set<string>();
  results.forEach(({ data }) => {
    data?.chart.forEach((entry) => categories.add(entry.name));
    data?.tokenChart.forEach((entry) => categories.add(entry.name));
  });
  const CATEGORIES = Array.from(categories).sort();

  const categoryDataByRound: Record<number, RoundCategoryEntry[]> = {};
  const allRounds: RoundOption[] = [];
  results.forEach(({ data }, i) => {
    const roundNumber = i + 1;
    categoryDataByRound[roundNumber] = toCategoryEntries(data, CATEGORIES);
    // A failed fetch still gets a nav entry, round number standing in for month.
    allRounds.push({ id: roundNumber, month: data ? `${data.month} ${data.year}` : `Round ${roundNumber}` });
  });

  return (
    <>
      <IncentiveModel
        categoryDataByRound={categoryDataByRound}
        allRounds={allRounds}
        currentRound={totalRounds}
        totalRounds={totalRounds}
      />
    </>
  );
}

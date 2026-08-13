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
  // No fallback: the whole page depends on knowing the current round number,
  // so if the live fetch fails there's nothing meaningful to render.
  const { data: current } = await getCurrentRoundStats();
  if (!current) notFound();
  const totalRounds = current.roundNumber;

  // One request per round, no cache — same tradeoff rounds.service.ts's
  // getCompletedBuybacks documents: self-maintaining (a new round appears
  // with no code change) at the cost of a request per round. Fine at
  // current round counts; the fix if it ever matters is a batch endpoint,
  // not a client-side workaround.
  const results = await Promise.all(
    Array.from({ length: totalRounds }, (_, i) => getRoundStats(i + 1)),
  );

  // Category axis is whatever the live data actually contains, unioned
  // across every round fetched — not a hand-typed guess. A category shows
  // up here as soon as it's ever appeared in chart or tokenChart; nothing
  // is assumed to exist that the API hasn't actually returned.
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
    // A round that failed to fetch still gets a nav entry (round number
    // stands in for the month) rather than leaving a gap in the dropdown.
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

import LeaderboardComponent from '@/components/page/aligement-assets/leaderboard/leaderboard-component';
import { toCategoryWeights, toRows, toSnapshot } from '@/components/page/aligement-assets/leaderboard/leaderboard.mapper';
import type {
  LeaderboardSnapshot,
  LeaderboardViewData,
} from '@/components/page/aligement-assets/leaderboard/leaderboard.types';
import { getKpiWeights } from '@/services/plaa/kpi-weights.service';
import { getLeaderboard, splitLeaderboardEntries } from '@/services/plaa/leaderboard.service';
import { getCurrentRoundStats, getRoundStats } from '@/services/plaa/rounds.service';

interface LeaderboardPageProps {
  searchParams: Promise<{ round?: string }>;
}

export default async function LeaderboardPage({ searchParams }: LeaderboardPageProps) {
  const { round: roundParam } = await searchParams;
  const requestedRound = roundParam ? parseInt(roundParam, 10) : NaN;

  const [{ data: current }, { data: weights }] = await Promise.all([getCurrentRoundStats(), getKpiWeights()]);

  if (!current) {
    return (
      <div style={{ padding: '40px', color: '#64748b', fontSize: '14px' }}>
        Leaderboard data is currently unavailable. Please try again later.
      </div>
    );
  }

  // Snapshot navigation walks the real rounds; there is no rounds index
  // endpoint, so rounds 1..current are resolved individually (same approach as
  // getCompletedBuybacks). The current round is already in hand.
  const [olderRounds, leaderboardResult] = await Promise.all([
    Promise.all(Array.from({ length: current.roundNumber - 1 }, (_, i) => getRoundStats(i + 1))),
    getLeaderboard(current.roundNumber),
  ]);

  const snapshots: LeaderboardSnapshot[] = [current, ...olderRounds.flatMap((result) => (result.data ? [result.data] : []))]
    .map(toSnapshot)
    .sort((a, b) => b.roundNumber - a.roundNumber);

  const categories = weights?.items.map((item) => item.category) ?? [];
  const entries = leaderboardResult.data?.entries ?? [];
  const { currentSnapshotData, cumulativeData } = splitLeaderboardEntries(entries);

  // A 401 here is the signed-out case, which the table renders as its own
  // state rather than as empty rows.
  const leaderboard: LeaderboardViewData = {
    currentSnapshot: toRows(currentSnapshotData, categories),
    cumulative: toRows(cumulativeData, categories),
    error: leaderboardResult.error?.message ?? null,
  };

  return (
    <LeaderboardComponent
      leaderboard={leaderboard}
      snapshots={snapshots}
      categoryWeights={toCategoryWeights(weights?.items ?? [])}
      initialRound={Number.isNaN(requestedRound) ? undefined : requestedRound}
    />
  );
}

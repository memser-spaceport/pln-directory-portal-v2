import LeaderboardComponent from '@/components/page/aligement-assets/leaderboard/leaderboard-component';
import {
  toCategoryWeights,
  toRows,
  toSnapshot,
} from '@/components/page/aligement-assets/leaderboard/leaderboard.mapper';
import type {
  LeaderboardSnapshot,
  LeaderboardViewData,
} from '@/components/page/aligement-assets/leaderboard/leaderboard.types';
import { getKpiWeights } from '@/services/plaa/kpi-weights.service';
import { getLeaderboard, splitLeaderboardEntries } from '@/services/plaa/leaderboard.service';
import { getAllRoundStats } from '@/services/plaa/rounds.service';
import { getCookiesFromHeaders } from '@/utils/next-helpers';

interface LeaderboardPageProps {
  searchParams: Promise<{ round?: string }>;
}

export default async function LeaderboardPage({ searchParams }: LeaderboardPageProps) {
  const { round: roundParam } = await searchParams;
  const requestedRound = roundParam ? parseInt(roundParam, 10) : NaN;

  const { authToken } = await getCookiesFromHeaders();
  const [{ data: rounds = [] }, { data: weights }] = await Promise.all([getAllRoundStats(authToken), getKpiWeights()]);
  const current = rounds.find((round) => round.isCurrentRound);

  if (!current) {
    return (
      <div style={{ padding: '40px', color: '#64748b', fontSize: '14px' }}>
        Leaderboard data is currently unavailable. Please try again later.
      </div>
    );
  }

  const olderRounds = rounds.filter((round) => round.roundNumber < current.roundNumber);
  const leaderboardResult = await getLeaderboard(current.roundNumber);

  const snapshots: LeaderboardSnapshot[] = [current, ...olderRounds]
    .map(toSnapshot)
    .sort((a, b) => b.roundNumber - a.roundNumber);

  const categories = weights?.items.map((item) => item.category) ?? [];
  const entries = leaderboardResult.data?.entries ?? [];
  const { currentSnapshotData, cumulativeData } = splitLeaderboardEntries(entries);

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

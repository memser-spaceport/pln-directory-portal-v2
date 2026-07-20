import CurrentRoundComponent from '@/components/page/aligement-assets/rounds/current-round-component';
import styles from './plaa.module.css';
import { currentRoundData } from '@/components/page/aligement-assets/rounds/data';
import { getLeaderboard } from '@/services/plaa/leaderboard.service';
import { getCurrentRoundStats, RoundStatsResponse } from '@/services/plaa/rounds.service';
import { CurrentRoundData } from '@/components/page/aligement-assets/rounds/types/current-round.types';

/**
 * Everything derivable comes from the API (round meta, KPI chart, totals,
 * participants, activity catalog); the data file keeps only editorial content
 * (hero copy, descriptions, regions, token/buyback figures) and acts as the
 * fallback when the API is unreachable.
 */
function mergeRoundStats(stats?: RoundStatsResponse): CurrentRoundData {
  if (!stats) return currentRoundData;
  return {
    ...currentRoundData,
    meta: {
      ...currentRoundData.meta,
      roundId: stats.roundId,
      roundNumber: stats.roundNumber,
      isCurrentRound: stats.isCurrentRound,
      lastUpdated: stats.lastUpdated,
    },
    chart: {
      ...currentRoundData.chart,
      chartData: stats.chart,
      maxValue: Math.max(...stats.chart.map((c) => c.value), 0),
    },
    stats: {
      ...currentRoundData.stats,
      onboardedParticipants: stats.onboardedParticipants,
      incentivizedActivities: stats.incentivizedActivities,
      totalPointsCollected: stats.totalPointsCollected.toLocaleString('en-US'),
    },
  };
}

export default async function PlaaPage() {
  const { data: stats } = await getCurrentRoundStats();
  const data = mergeRoundStats(stats);
  const { data: leaderboardResponse } = await getLeaderboard(data.meta.roundNumber);

  return (
    <div className={styles.rounds}>
      <CurrentRoundComponent data={data} leaderboardResponse={leaderboardResponse} />
    </div>
  );
}

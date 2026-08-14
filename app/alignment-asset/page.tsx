import { notFound } from 'next/navigation';
import CurrentRoundComponent from '@/components/page/aligement-assets/rounds/current-round-component';
import styles from './plaa.module.css';
import { currentRoundData } from '@/components/page/aligement-assets/rounds/data';
import { getLeaderboard } from '@/services/plaa/leaderboard.service';
import { getCurrentRoundStats, RoundStatsResponse } from '@/services/plaa/rounds.service';
import { CurrentRoundData } from '@/components/page/aligement-assets/rounds/types/current-round.types';

// The data file keeps only editorial content that never varies by round —
// it's a template, not a fallback: this page 404s if the API has nothing,
// rather than rendering stale numbers as if live.
function mergeRoundStats(stats: RoundStatsResponse): CurrentRoundData {
  // stats.period is 'YYYY-MM-DD', the first of the round's calendar month.
  const [year, month] = stats.period.split('-').map(Number);
  const lastDayOfMonth = new Date(year, month, 0).getDate();
  const pad = (n: number) => String(n).padStart(2, '0');
  const startDate = `${stats.period}T00:00:00`;
  const endDate = `${year}-${pad(month)}-${pad(lastDayOfMonth)}T23:59:59`;

  return {
    ...currentRoundData,
    meta: {
      ...currentRoundData.meta,
      roundNumber: stats.roundNumber,
      isCurrentRound: stats.isCurrentRound,
      lastUpdated: stats.lastUpdated,
    },
    roundDescription: {
      ...currentRoundData.roundDescription,
      roundNumber: stats.roundNumber,
      monthYear: `${stats.month} ${stats.year}`,
    },
    snapshotProgress: {
      ...currentRoundData.snapshotProgress,
      startDate,
      endDate,
      tipContent: {
        ...currentRoundData.snapshotProgress.tipContent,
        bottomLink: {
          ...currentRoundData.snapshotProgress.tipContent.bottomLink,
          text: `See what happened in the last round (Round ${stats.roundNumber - 1})`,
          url: `/alignment-asset/rounds/${stats.roundNumber - 1}`,
        },
      },
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
      regionsUnlocked: stats.regionsUnlocked,
      totalPointsCollected: stats.totalPointsCollected.toLocaleString('en-US'),
    },
  };
}

export default async function PlaaPage() {
  const { data: stats } = await getCurrentRoundStats();
  if (!stats) notFound();
  const data = mergeRoundStats(stats);
  const { data: leaderboardResponse } = await getLeaderboard(data.meta.roundNumber);

  return (
    <div className={styles.rounds}>
      <CurrentRoundComponent data={data} leaderboardResponse={leaderboardResponse} />
    </div>
  );
}

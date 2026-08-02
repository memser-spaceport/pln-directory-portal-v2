import CurrentRoundComponent from '@/components/page/aligement-assets/rounds/current-round-component';
import styles from './plaa.module.css';
import { currentRoundData } from '@/components/page/aligement-assets/rounds/data';
import { getLeaderboard } from '@/services/plaa/leaderboard.service';
import { getCurrentRoundStats, RoundStatsResponse } from '@/services/plaa/rounds.service';
import { CurrentRoundData } from '@/components/page/aligement-assets/rounds/types/current-round.types';

/**
 * Everything derivable comes from the API (round meta, month/period, KPI
 * chart, totals, participants, activity catalog); the data file keeps only
 * editorial content (hero copy, descriptions, regions, token/buyback
 * figures) and acts as the fallback when the API is unreachable.
 */
function mergeRoundStats(stats?: RoundStatsResponse): CurrentRoundData {
  if (!stats) return currentRoundData;

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
      roundId: stats.roundId,
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
      // incentivizedActivities stays hand-curated: the API's activityName set
      // mixes awards (e.g. "5 Highest Points per Snapshot") with submittable
      // activities, and the catalog changes per round. Needs an Airtable
      // activity-catalog table before it can be derived.
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

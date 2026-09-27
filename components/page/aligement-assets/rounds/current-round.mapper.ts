import { currentRoundData } from './data';
import type { RoundStatsResponse } from '@/services/plaa/rounds.service';
import type { CurrentRoundData } from './types/current-round.types';

/**
 * The data file keeps only editorial content that never varies by round —
 * it's a template, not a fallback: the caller 404s if the API has nothing,
 * rather than rendering stale numbers as if live.
 *
 * Extracted from app/alignment-asset/page.tsx when /alignment-asset became the
 * home page; the current round now renders at /alignment-asset/rounds/[round].
 */
export function mergeRoundStats(stats: RoundStatsResponse): CurrentRoundData {
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

import { useCurrentRoundStats } from '@/services/plaa/hooks/useCurrentRoundStats';
import { useSnapshotPoints } from '@/services/points/hooks/usePoints';
import {
  getCurrentRoundNumber,
  getRoundDateInfo,
  getSnapshotDatesFromPeriod,
  getSnapshotProgress,
} from '@/utils/plaa-round.utils';

export interface SnapshotActivityItem {
  category: string;
  title: string;
  points: number;
}

export interface CurrentSnapshotStatus {
  periodLabel: string;
  /** Inclusive of today. */
  daysLeft: number;
  /** 0-100. */
  progressPct: number;
  pointsCollected: number;
  /**
   * False when the points call returned nothing — signed out, or the request
   * failed. `pointsCollected` is 0 in that case, which is indistinguishable
   * from a real zero, so anything user-facing must check this before printing
   * the number. A signed-out visitor has no points concept at all.
   */
  hasPointsData: boolean;
  activitiesCount: number;
  categoriesCount: number;
  activities: SnapshotActivityItem[];
}

/** Falls back to calendar-math (round 1 = Feb 2025) while useCurrentRoundStats() is loading or unreachable. */
function usePeriodStatus() {
  const { data: roundStats } = useCurrentRoundStats();

  // `period` is the only field this branch needs, and the response is consumed
  // unvalidated (`res.json()`), so a payload without it must fall through to the
  // calendar path rather than throwing — the bar renders in the site header on
  // every PLAA route, so a bad shape would take the whole header down.
  if (roundStats?.period) {
    // roundStats.period is "YYYY-MM-DD"; useSnapshotPoints wants "YYYY-MM".
    const snapshotPeriod = roundStats.period.slice(0, 7);
    const { startDate, endDate } = getSnapshotDatesFromPeriod(roundStats.period);
    const { progressPercentage, remainingDays } = getSnapshotProgress(startDate, endDate);
    return {
      periodLabel: `${roundStats.month} ${roundStats.year}`,
      daysLeft: remainingDays,
      progressPct: Math.round(progressPercentage),
      snapshotPeriod,
    };
  }

  const currentRound = getCurrentRoundNumber();
  const { snapshotPeriod, label } = getRoundDateInfo(currentRound);
  const { startDate, endDate } = getSnapshotDatesFromPeriod(snapshotPeriod);
  const { progressPercentage, remainingDays } = getSnapshotProgress(startDate, endDate);
  return {
    periodLabel: label,
    daysLeft: remainingDays,
    progressPct: Math.round(progressPercentage),
    snapshotPeriod,
  };
}

/**
 * No PLAA estimate here by design: an open snapshot only shows points collected so
 * far, PLAA is issued at close at whatever conversion rate is in effect then.
 */
export function useCurrentSnapshotStatus(): CurrentSnapshotStatus {
  const { periodLabel, daysLeft, progressPct, snapshotPeriod } = usePeriodStatus();
  const { data: snapshotData } = useSnapshotPoints(snapshotPeriod);

  const activities: SnapshotActivityItem[] = (snapshotData?.records ?? []).map((record) => ({
    category: record.category,
    title: record.activityName,
    points: Number(record.pointsCollectedPerSnapshot) || 0,
  }));
  const pointsCollected = activities.reduce((sum, a) => sum + a.points, 0);
  const categoriesCount = new Set(activities.map((a) => a.category)).size;

  return {
    periodLabel,
    daysLeft,
    progressPct,
    pointsCollected,
    hasPointsData: Array.isArray(snapshotData?.records),
    activitiesCount: activities.length,
    categoriesCount,
    activities,
  };
}

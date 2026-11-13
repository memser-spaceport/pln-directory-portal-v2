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
  /** Activity card id (e.g. host-office-hours); null when not from a card, undefined when the API predates the field. */
  siteActivityId?: string | null;
}

export type SnapshotActivitiesStatus = 'loading' | 'ready' | 'unavailable';

export interface CurrentSnapshotStatus {
  periodLabel: string;
  /** Inclusive of today. */
  daysLeft: number;
  /** 0-100. */
  progressPct: number;
  pointsCollected: number;
  activitiesCount: number;
  categoriesCount: number;
  activities: SnapshotActivityItem[];
  /** Whether `activities` reflects the member's real records yet. */
  activitiesStatus: SnapshotActivitiesStatus;
}

/** Falls back to calendar-math (round 1 = Feb 2025) while useCurrentRoundStats() is loading or unreachable. */
function usePeriodStatus() {
  const { data: roundStats } = useCurrentRoundStats();

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
  const { data: snapshotData, isLoading } = useSnapshotPoints(snapshotPeriod);

  const activities: SnapshotActivityItem[] = (snapshotData?.records ?? []).map((record) => ({
    category: record.category,
    title: record.activityName,
    points: Number(record.pointsCollectedPerSnapshot) || 0,
    siteActivityId: record.siteActivityId,
  }));
  const pointsCollected = activities.reduce((sum, a) => sum + a.points, 0);
  const categoriesCount = new Set(activities.map((a) => a.category)).size;

  return {
    periodLabel,
    daysLeft,
    progressPct,
    pointsCollected,
    activitiesCount: activities.length,
    categoriesCount,
    activities,
    activitiesStatus: isLoading ? 'loading' : snapshotData ? 'ready' : 'unavailable',
  };
}

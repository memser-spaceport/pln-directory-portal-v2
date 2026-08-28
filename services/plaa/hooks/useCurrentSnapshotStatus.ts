import { useCurrentRoundStats } from '@/services/plaa/hooks/useCurrentRoundStats';
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
  activitiesCount: number;
  categoriesCount: number;
  activities: SnapshotActivityItem[];
}

/**
 * TODO(backend): mocked. Wire via useSnapshotPoints(snapshotPeriod) from
 * '@/services/points/hooks/usePoints' — map each PointsRecord's
 * category/activityName/pointsCollectedPerSnapshot onto SnapshotActivityItem, then
 * pointsCollected = sum of pointsCollectedPerSnapshot, activitiesCount = records.length,
 * categoriesCount = distinct categories. See points-dashboard.tsx for the same summation.
 *
 * No PLAA estimate here by design: an open snapshot only shows points collected so
 * far, PLAA is issued at close at whatever conversion rate is in effect then.
 */
export const MOCK_ACTIVITIES: SnapshotActivityItem[] = [
  { category: 'Knowledge Sharing', title: 'Thoughtful Responder', points: 60 },
  { category: 'Knowledge Sharing', title: 'Host Office Hours', points: 100 },
  { category: 'Programs', title: 'Make a Network Introduction', points: 50 },
  { category: 'Programs', title: 'Complete a PLAA Survey', points: 50 },
  { category: 'Projects', title: 'Give Excellent Survey Feedback', points: 60 },
  { category: 'Projects', title: 'Complete a Survey', points: 50 },
  { category: 'People/Talent', title: 'Refer New Alignment Asset Participants', points: 50 },
];
export const MOCK_POINTS_COLLECTED = MOCK_ACTIVITIES.reduce((sum, a) => sum + a.points, 0);
export const MOCK_ACTIVITIES_COUNT = MOCK_ACTIVITIES.length;
export const MOCK_CATEGORIES_COUNT = new Set(MOCK_ACTIVITIES.map((a) => a.category)).size;

/** Falls back to calendar-math (round 1 = Feb 2025) while useCurrentRoundStats() is loading or unreachable. */
function usePeriodStatus() {
  const { data: roundStats } = useCurrentRoundStats();

  if (roundStats) {
    const { startDate, endDate } = getSnapshotDatesFromPeriod(roundStats.period);
    const { progressPercentage, remainingDays } = getSnapshotProgress(startDate, endDate);
    return {
      periodLabel: `${roundStats.month} ${roundStats.year}`,
      daysLeft: remainingDays,
      progressPct: Math.round(progressPercentage),
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
  };
}

export function useCurrentSnapshotStatus(): CurrentSnapshotStatus {
  const { periodLabel, daysLeft, progressPct } = usePeriodStatus();

  return {
    periodLabel,
    daysLeft,
    progressPct,
    pointsCollected: MOCK_POINTS_COLLECTED,
    activitiesCount: MOCK_ACTIVITIES_COUNT,
    categoriesCount: MOCK_CATEGORIES_COUNT,
    activities: MOCK_ACTIVITIES,
  };
}

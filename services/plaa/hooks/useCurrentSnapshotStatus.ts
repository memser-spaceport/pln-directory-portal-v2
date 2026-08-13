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
  /** Human-readable current snapshot period, e.g. "August 2026". */
  periodLabel: string;
  /** Days remaining (inclusive of today) until the current snapshot closes. */
  daysLeft: number;
  /** How far through the current snapshot period we are, 0-100. */
  progressPct: number;
  /** The signed-in user's points collected so far this snapshot. */
  pointsCollected: number;
  /** Number of distinct activities the user has logged this snapshot. */
  activitiesCount: number;
  /** Number of distinct activity categories touched this snapshot. */
  categoriesCount: number;
  /** Line-item breakdown backing pointsCollected — one row per logged activity. */
  activities: SnapshotActivityItem[];
}

/**
 * TODO(backend): activities / pointsCollected / activitiesCount / categoriesCount are
 * mocked below, derived from MOCK_ACTIVITIES so the shape mirrors exactly how the real
 * values should be derived once connected: call `useSnapshotPoints(snapshotPeriod)`
 * from '@/services/points/hooks/usePoints'. `data.records` is a `PointsRecord[]`; map
 * each record's `category`/`activityName`/`pointsCollectedPerSnapshot` onto
 * `SnapshotActivityItem`, same as MOCK_ACTIVITIES below, then derive:
 *   pointsCollected  = sum of records[].pointsCollectedPerSnapshot
 *   activitiesCount  = records.length
 *   categoriesCount  = new Set(records.map(r => r.category)).size
 * See components/page/aligement-assets/points-dashboard/points-dashboard.tsx for the
 * same summation already done for the points value. That hook needs a signed-in
 * `authToken` cookie and a reachable DIRECTORY_API_URL backend — neither is available
 * in every local environment, which is why this hook mocks the values instead.
 *
 * There's no PLAA/points-conversion estimate here by design — per Profile.dc.html,
 * an open snapshot only ever shows points collected so far. PLAA is issued at close,
 * based on whatever conversion rate is in effect at that time; showing an estimate
 * before then was explicitly cut from the design.
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

/**
 * Period label, days-left, and progress% for the current snapshot — sourced from
 * `useCurrentRoundStats()` (the same real, public `getCurrentRoundStats()` call and
 * `getSnapshotProgress()` formula the round pages' "Current Snapshot Period" /
 * "X days remaining" section uses), so the two never drift apart. Falls back to pure
 * calendar-math (round 1 = Feb 2025) only while that request is loading or unreachable.
 */
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

/**
 * Everything a "current snapshot" status bar / summary needs to render. Points/
 * activities are placeholders — see the TODO above for how a backend dev wires in
 * real values.
 */
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

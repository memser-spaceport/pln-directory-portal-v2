import type { MappedLeaderboardEntry } from '@/services/plaa/leaderboard.utils';

/** One real round, resolved from GET /api/v1/rounds/{n}/stats. */
export interface LeaderboardSnapshot {
  roundNumber: number;
  /** "Round 20" */
  label: string;
  /** "September 1–30, 2026", derived from period + month + year. */
  period: string;
  isCurrentRound: boolean;
  /** totalPointsCollected */
  points: number;
  /** onboardedParticipants */
  participants: number;
  /** chart: points collected per category this snapshot */
  categories: Array<{ name: string; value: number }>;
}

/** Category reference data from GET /api/v1/kpi-weights. */
export interface LeaderboardCategoryWeight {
  category: string;
  percentOfTotal: number | null;
  emissionsPerSnapshot: number | null;
}

export interface LeaderboardRow extends MappedLeaderboardEntry {
  /**
   * Only set when the entry's `activities` string matches a real category from
   * kpi-weights. The API has no per-contributor category field, so an unmatched
   * entry carries no category rather than a placeholder.
   */
  topCategory: string | null;
}

export interface LeaderboardViewData {
  currentSnapshot: LeaderboardRow[];
  cumulative: LeaderboardRow[];
  /** Set when the leaderboard endpoint failed (401 for signed-out visitors). */
  error: string | null;
}

import type { MappedLeaderboardEntry } from '@/services/plaa/leaderboard.utils';

export interface LeaderboardSnapshot {
  roundNumber: number;
  label: string;
  period: string;
  isCurrentRound: boolean;
  points: number;
  participants: number;
  /** Total PLAA the snapshot's points converted into; 0 until the snapshot closes. */
  plaaDistributed: number;
  /** `value` = points collected, `plaa` = PLAA distributed, per category. */
  categories: Array<{ name: string; value: number; plaa: number }>;
}

export interface LeaderboardCategoryWeight {
  category: string;
  percentOfTotal: number | null;
  emissionsPerSnapshot: number | null;
}

export interface LeaderboardRow extends MappedLeaderboardEntry {
  topCategory: string | null;
}

export interface LeaderboardViewData {
  currentSnapshot: LeaderboardRow[];
  cumulative: LeaderboardRow[];
  error: string | null;
}

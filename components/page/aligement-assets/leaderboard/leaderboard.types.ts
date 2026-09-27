import type { MappedLeaderboardEntry } from '@/services/plaa/leaderboard.utils';

export interface LeaderboardSnapshot {
  roundNumber: number;
  label: string;
  period: string;
  isCurrentRound: boolean;
  points: number;
  participants: number;
  categories: Array<{ name: string; value: number }>;
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

import type { RoundStatsResponse } from '@/services/plaa/rounds.service';
import type { MappedLeaderboardEntry } from '@/services/plaa/leaderboard.utils';
import type { LeaderboardCategoryWeight, LeaderboardRow, LeaderboardSnapshot } from './leaderboard.types';

/** "People/Talent" and "People / Talent" are the same category to a reader. */
const normalizeCategory = (value: string) => value.toLowerCase().replace(/[^a-z]/g, '');

/**
 * Renders the round's calendar month as the design's period line
 * ("September 1–30, 2026"). `period` is the first of the month, so the end day
 * is that month's length — no separate end date is published.
 */
export const formatSnapshotPeriod = (stats: RoundStatsResponse): string => {
  const [year, month] = stats.period.split('-').map(Number);
  if (!year || !month) return `${stats.month} ${stats.year}`;
  const lastDay = new Date(year, month, 0).getDate();
  return `${stats.month} 1–${lastDay}, ${stats.year}`;
};

export const toSnapshot = (stats: RoundStatsResponse): LeaderboardSnapshot => ({
  roundNumber: stats.roundNumber,
  label: `Round ${stats.roundNumber}`,
  period: formatSnapshotPeriod(stats),
  isCurrentRound: stats.isCurrentRound,
  points: stats.totalPointsCollected,
  participants: stats.onboardedParticipants,
  categories: stats.chart.map((entry) => ({ name: entry.name, value: entry.value })),
});

/**
 * The leaderboard API has no category field. `activities` is free text, so a
 * category is only claimed when that text actually names one from kpi-weights;
 * anything else resolves to null and the column is dropped by the table.
 */
export const resolveTopCategory = (entry: MappedLeaderboardEntry, categories: string[]): string | null => {
  const haystack = normalizeCategory(entry.activities);
  if (!haystack) return null;
  return categories.find((category) => haystack.includes(normalizeCategory(category))) ?? null;
};

export const toRows = (entries: MappedLeaderboardEntry[], categories: string[]): LeaderboardRow[] =>
  entries.map((entry) => ({ ...entry, topCategory: resolveTopCategory(entry, categories) }));

export const toCategoryWeights = (
  items: Array<{ category: string; percentOfTotal: number | null; emissionsPerSnapshot: number | null }>,
): LeaderboardCategoryWeight[] =>
  items.map((item) => ({
    category: item.category,
    percentOfTotal: item.percentOfTotal,
    emissionsPerSnapshot: item.emissionsPerSnapshot,
  }));

/**
 * The prototype hard-coded "under 100 points" against a fixed 340 max. Live
 * category totals are not on that scale, so the same *relative* cut is used:
 * a category is underutilized when it holds less than 30% of the busiest
 * category this snapshot (100/340 ≈ 0.29 in the design).
 */
export const UNDERUTILIZED_RATIO = 0.3;

export const getInitials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

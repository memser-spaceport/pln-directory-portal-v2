import type { RoundStatsResponse } from '@/services/plaa/rounds.service';
import type { MappedLeaderboardEntry } from '@/services/plaa/leaderboard.utils';
import type { LeaderboardCategoryWeight, LeaderboardRow, LeaderboardSnapshot } from './leaderboard.types';

const normalizeCategory = (value: string) => value.toLowerCase().replace(/[^a-z]/g, '');

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

export const UNDERUTILIZED_RATIO = 0.3;

export const getInitials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

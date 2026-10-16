import type { RoundStatsResponse } from '@/services/plaa/rounds.service';
import type { MappedLeaderboardEntry } from '@/services/plaa/leaderboard.utils';
import type { LeaderboardCategoryWeight, LeaderboardRow, LeaderboardSnapshot } from './leaderboard.types';

export const normalizeCategory = (value: string) => value.toLowerCase().replace(/[^a-z]/g, '');

export const formatSnapshotPeriod = (stats: RoundStatsResponse): string => {
  const [year, month] = stats.period.split('-').map(Number);
  if (!year || !month) return `${stats.month} ${stats.year}`;
  const lastDay = new Date(year, month, 0).getDate();
  return `${stats.month} 1–${lastDay}, ${stats.year}`;
};

/**
 * `scheduled` = the categories in the KPI emissions schedule. The stats also carry categories that
 * exist only in the token tables (e.g. Capital); like Overview, those are left off the chart.
 */
export const toSnapshot = (stats: RoundStatsResponse, scheduled: string[] = []): LeaderboardSnapshot => {
  const tokenChart = stats.tokenChart ?? [];
  const inSchedule = new Set(scheduled.map(normalizeCategory));
  const isScheduled = (name: string) => inSchedule.size === 0 || inSchedule.has(normalizeCategory(name));
  const plaaFor = (name: string) =>
    tokenChart.find((entry) => normalizeCategory(entry.name) === normalizeCategory(name))?.value ?? 0;
  return {
    roundNumber: stats.roundNumber,
    label: `Round ${stats.roundNumber}`,
    period: formatSnapshotPeriod(stats),
    isCurrentRound: stats.isCurrentRound,
    points: stats.totalPointsCollected,
    participants: stats.onboardedParticipants,
    plaaDistributed: tokenChart.reduce((total, entry) => total + entry.value, 0),
    categories: stats.chart
      .filter((entry) => isScheduled(entry.name))
      .map((entry) => ({ name: entry.name, value: entry.value, plaa: plaaFor(entry.name) })),
  };
};

export const resolveTopCategory = (entry: MappedLeaderboardEntry, categories: string[]): string | null => {
  const haystack = normalizeCategory(entry.activities);
  if (!haystack) return null;
  return categories.find((category) => haystack.includes(normalizeCategory(category))) ?? null;
};

export const LEADERBOARD_SIZE = 10;

export const toRows = (entries: MappedLeaderboardEntry[], categories: string[]): LeaderboardRow[] =>
  entries
    .filter((entry) => entry.points > 0)
    .slice(0, LEADERBOARD_SIZE)
    .map((entry) => ({ ...entry, topCategory: resolveTopCategory(entry, categories) }));

export const toCategoryWeights = (
  items: Array<{ category: string; percentOfTotal: number | null; emissionsPerSnapshot: number | null }>,
): LeaderboardCategoryWeight[] =>
  items.map((item) => ({
    category: item.category,
    percentOfTotal: item.percentOfTotal,
    emissionsPerSnapshot: item.emissionsPerSnapshot,
  }));

export const UNDERUTILIZED_RATIO = 0.3;

export const isUnderutilized = (value: number, max: number) => max > 0 && value < max * UNDERUTILIZED_RATIO;

export const getInitials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

import { useCurrentUserStore } from '@/services/auth/store';
import { useCurrentSnapshotStatus } from '@/services/plaa/hooks/useCurrentSnapshotStatus';
import { useProfileBalance } from '@/services/plaa/hooks/useProfileBalance';
import { useProfilePlaaHistory, type ProfilePlaaHistoryEntry } from '@/services/plaa/hooks/useProfilePlaaHistory';
import { useSnapshotPointsHistory, type SnapshotPointsByPeriod } from '@/services/plaa/hooks/useSnapshotPointsHistory';
import type { SnapshotPointsResponse } from '@/services/points/hooks/usePoints';

export interface ProfileActivityItem {
  category: string;
  title: string;
  points: number;
}

export interface SnapshotHistoryEntry {
  period: string;
  activities: number | null;
  categories: number | null;
  points: number | null;
  activityPlaa: number;
  hasInfra: boolean;
  infra: number;
  plaaTotal: number;
  items: ProfileActivityItem[] | null;
}

export interface ContributionHistoryEntry {
  period: string;
  points: number | null;
  plaa: number;
  infra: number;
  redeemed: number | null;
  cum: number;
}

export interface ProfileIdentity {
  name: string;
  initials: string;
  avatarUrl?: string;
  memberSince: string;
  isOnboarded: boolean;
  isInfraMember: boolean;
}

export interface ProfileBalance {
  plaaBalance: number;
  activities: number;
  infraRewards: number;
  redeemed: number;
}

export type ProfileBalanceStatus = 'loading' | 'ready' | 'unavailable';

export type ProfileHistoryStatus = 'loading' | 'ready' | 'unavailable';

export interface ProfileData {
  identity: ProfileIdentity;
  balance: ProfileBalance;
  balanceStatus: ProfileBalanceStatus;
  pointsThisSnapshot: number;
  historyStatus: ProfileHistoryStatus;
  snapshotHistory: SnapshotHistoryEntry[];
  contributionHistory: ContributionHistoryEntry[];
}

const IS_DEV = process.env.NODE_ENV !== 'production';

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

function formatPeriodLabel(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function activityItemsFrom(response: SnapshotPointsResponse): ProfileActivityItem[] {
  return response.records.map((r) => ({ category: r.category, title: r.activityName, points: r.pointsCollectedPerSnapshot }));
}

function toSnapshotHistory(history: ProfilePlaaHistoryEntry[], pointsByPeriod: SnapshotPointsByPeriod): SnapshotHistoryEntry[] {
  return [...history].reverse().map((entry) => {
    const pointsResponse = pointsByPeriod[entry.period];
    const items = pointsResponse ? activityItemsFrom(pointsResponse) : null;
    return {
      period: formatPeriodLabel(entry.period),
      activities: items ? items.length : null,
      categories: items ? new Set(items.map((i) => i.category)).size : null,
      points: items ? items.reduce((sum, i) => sum + i.points, 0) : null,
      activityPlaa: entry.iaPlaa,
      hasInfra: entry.irPlaa > 0,
      infra: entry.irPlaa,
      plaaTotal: entry.plaaTotal,
      items,
    };
  });
}

function buildContributionHistory(snapshotHistory: SnapshotHistoryEntry[]): ContributionHistoryEntry[] {
  const oldestFirst = [...snapshotHistory].reverse();
  let cum = 0;
  return oldestFirst.map((entry) => {
    cum += entry.activityPlaa + entry.infra;
    return {
      period: entry.period,
      points: entry.points,
      plaa: entry.activityPlaa,
      infra: entry.infra,
      redeemed: null,
      cum,
    };
  });
}

export function useProfileData(): ProfileData {
  const currentUser = useCurrentUserStore((s) => s.currentUser);
  const { pointsCollected } = useCurrentSnapshotStatus();
  const { data: balanceData, isLoading: isBalanceLoading } = useProfileBalance();
  const balanceStatus: ProfileBalanceStatus = isBalanceLoading ? 'loading' : balanceData ? 'ready' : 'unavailable';
  const { data: historyData, isLoading: isHistoryLoading } = useProfilePlaaHistory();
  const historyStatus: ProfileHistoryStatus = isHistoryLoading ? 'loading' : historyData ? 'ready' : 'unavailable';
  const pointsByPeriod = useSnapshotPointsHistory(historyData?.map((e) => e.period) ?? []);

  const name = currentUser?.name || 'Member';
  const snapshotHistory = historyData ? toSnapshotHistory(historyData, pointsByPeriod) : [];
  const contributionHistory = buildContributionHistory(snapshotHistory);

  return {
    identity: {
      name,
      initials: initialsFrom(name),
      avatarUrl: currentUser?.profileImageUrl,
      memberSince: 'January 2025',
      isOnboarded: Boolean(currentUser) || IS_DEV,
      isInfraMember: true, // TODO(backend): hardcoded, needs a real RBAC-based check.
    },
    balanceStatus,
    balance: {
      plaaBalance: balanceData?.plaaBalance ?? 0,
      activities: balanceData?.activities ?? 0,
      infraRewards: balanceData?.infraRewards ?? 0,
      redeemed: balanceData?.redeemed ?? 0,
    },
    pointsThisSnapshot: pointsCollected,
    historyStatus,
    snapshotHistory,
    contributionHistory,
  };
}

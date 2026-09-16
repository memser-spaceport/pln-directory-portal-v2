import { useCurrentUserStore } from '@/services/auth/store';
import { useCurrentSnapshotStatus } from '@/services/plaa/hooks/useCurrentSnapshotStatus';
import { useIsInfraMember } from '@/services/plaa/hooks/useIsInfraMember';
import { useProfileBalance } from '@/services/plaa/hooks/useProfileBalance';
import { useProfilePlaaHistory, type ProfilePlaaHistoryEntry } from '@/services/plaa/hooks/useProfilePlaaHistory';
import { useRedemptionHistory } from '@/services/plaa/hooks/useRedemptionHistory';
import { useSnapshotLifecycle, type SnapshotLifecycleEntry } from '@/services/plaa/hooks/useSnapshotLifecycle';
import { useSnapshotPointsHistory, type SnapshotPointsByPeriod } from '@/services/plaa/hooks/useSnapshotPointsHistory';
import type { SnapshotPointsResponse } from '@/services/points/hooks/usePoints';

export interface ProfileActivityItem {
  category: string;
  title: string;
  points: number;
}

export interface SnapshotHistoryEntry {
  period: string;
  /** Raw ISO period, kept for matching against sources keyed by calendar month. */
  periodIso: string;
  activities: number | null;
  categories: number | null;
  points: number | null;
  activityPlaa: number;
  hasInfra: boolean;
  infra: number;
  plaaTotal: number;
  items: ProfileActivityItem[] | null;
  /** The snapshot is not closed yet, so its own figures are provisional. */
  isPending: boolean;
}

export interface ContributionHistoryEntry {
  period: string;
  points: number | null;
  plaa: number;
  infra: number;
  redeemed: number | null;
  /** The snapshot is not closed yet, so its own figures are provisional. */
  isPending: boolean;
  cum: number;
}

export interface ProfileIdentity {
  name: string;
  initials: string;
  avatarUrl?: string;
  memberSince: string | null;
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
  /** Month of the open snapshot, e.g. "September 2026". */
  currentSnapshotLabel: string;
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

function findMemberSince(historyData: ProfilePlaaHistoryEntry[] | null | undefined, pointsByPeriod: SnapshotPointsByPeriod): string | null {
  if (!historyData) return null;
  for (const entry of historyData) {
    const points = pointsByPeriod[entry.period];
    if (points?.records.some((r) => r.activityName === 'Onboarding')) {
      return formatPeriodLabel(entry.period);
    }
  }
  return null;
}

function toSnapshotHistory(
  history: ProfilePlaaHistoryEntry[],
  pointsByPeriod: SnapshotPointsByPeriod,
  closedByMonth: Record<string, boolean>,
): SnapshotHistoryEntry[] {
  return [...history].reverse().map((entry) => {
    const pointsResponse = pointsByPeriod[entry.period];
    const items = pointsResponse ? activityItemsFrom(pointsResponse) : null;
    return {
      period: formatPeriodLabel(entry.period),
      periodIso: entry.period,
      activities: items ? items.length : null,
      categories: items ? new Set(items.map((i) => i.category)).size : null,
      points: items ? items.reduce((sum, i) => sum + i.points, 0) : null,
      activityPlaa: entry.iaPlaa,
      hasInfra: entry.irPlaa > 0,
      infra: entry.irPlaa,
      plaaTotal: entry.plaaTotal,
      items,
      isPending: isPendingMonth(entry.period, closedByMonth),
    };
  });
}

/** Snapshot rows carry a day-of-month; auctions and lifecycle rows land on the first. */
function monthKey(isoDate: string): string {
  return isoDate.slice(0, 7);
}

// Absent lifecycle data means unknown, not provisional: without it the figures
// are shown as they always were rather than every row marked pending.
function isPendingMonth(isoDate: string, closedByMonth: Record<string, boolean>): boolean {
  const closed = closedByMonth[monthKey(isoDate)];
  return closed === undefined ? false : !closed;
}

/**
 * A member's PLAA history only gains a row once that snapshot's PLAA is calculated, so a
 * snapshot can be missing from it: the open one always, and a closed one whose row has not
 * been written. Either way the month is shown, with zero PLAA — an open snapshot reads
 * Pending, a closed one reads zero, which is what a month with no PLAA means.
 *
 * Two months are never invented: one staged ahead of its own month, and anything before the
 * member's first snapshot, which predates them.
 */
function withMissingSnapshots(
  history: ProfilePlaaHistoryEntry[],
  lifecycle: SnapshotLifecycleEntry[],
  now: Date,
): ProfilePlaaHistoryEntry[] {
  const months = new Set(history.map((e) => monthKey(e.period)));
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const firstMonth = history.length > 0 ? monthKey(history[0].period) : null;
  const missing = lifecycle
    .filter((e): e is SnapshotLifecycleEntry & { period: string } => e.period !== null)
    .filter((e) => {
      const month = monthKey(e.period);
      if (month > thisMonth || months.has(month)) return false;
      return firstMonth === null || month >= firstMonth;
    })
    .map((e) => ({ period: e.period, iaPlaa: 0, irPlaa: 0, plaaTotal: 0 }));
  return [...history, ...missing].sort((a, b) => a.period.localeCompare(b.period));
}

export function buildContributionHistory(
  snapshotHistory: SnapshotHistoryEntry[],
  redeemedByMonth: Record<string, number>,
  closedByMonth: Record<string, boolean>,
): ContributionHistoryEntry[] {
  const oldestFirst = [...snapshotHistory].reverse();
  let cum = 0;
  return oldestFirst.map((entry) => {
    const month = monthKey(entry.periodIso);
    const closed = closedByMonth[month];
    // An open snapshot's PLAA joins the balance only once the snapshot closes.
    if (closed !== false) cum += entry.activityPlaa + entry.infra;
    // The balance is net: a redemption leaves it from the month its auction closed in.
    cum -= redeemedByMonth[month] ?? 0;
    return {
      period: entry.period,
      points: entry.points,
      plaa: entry.activityPlaa,
      infra: entry.infra,
      redeemed: redeemedByMonth[month] ?? null,
      isPending: closed === undefined ? false : !closed,
      cum,
    };
  });
}

export function useProfileData(): ProfileData {
  const currentUser = useCurrentUserStore((s) => s.currentUser);
  const { pointsCollected, periodLabel } = useCurrentSnapshotStatus();
  const { data: balanceData, isLoading: isBalanceLoading } = useProfileBalance();
  const balanceStatus: ProfileBalanceStatus = isBalanceLoading ? 'loading' : balanceData ? 'ready' : 'unavailable';
  const { data: historyData, isLoading: isHistoryLoading } = useProfilePlaaHistory();
  const historyStatus: ProfileHistoryStatus = isHistoryLoading ? 'loading' : historyData ? 'ready' : 'unavailable';
  const { data: redemptionData } = useRedemptionHistory();
  const { data: lifecycleData } = useSnapshotLifecycle();
  const candidateHistory = historyData ? withMissingSnapshots(historyData, lifecycleData ?? [], new Date()) : null;
  const pointsByPeriod = useSnapshotPointsHistory(candidateHistory?.map((e) => e.period) ?? []);
  // A member with no history yet only gets an open-snapshot row once they have points in it.
  const fullHistory =
    historyData && historyData.length === 0
      ? candidateHistory?.filter((e) => pointsByPeriod[e.period]) ?? null
      : candidateHistory;
  const isInfraMember = useIsInfraMember();

  const name = currentUser?.name || 'Member';
  const redeemedByMonth: Record<string, number> = {};
  for (const entry of redemptionData ?? []) {
    if (entry.period === null || entry.plaaRedeemed === null) continue;
    const month = monthKey(entry.period);
    redeemedByMonth[month] = (redeemedByMonth[month] ?? 0) + entry.plaaRedeemed;
  }

  const closedByMonth: Record<string, boolean> = {};
  for (const entry of lifecycleData ?? []) {
    if (entry.period === null) continue;
    closedByMonth[monthKey(entry.period)] = entry.isClosed;
  }

  const snapshotHistory = fullHistory ? toSnapshotHistory(fullHistory, pointsByPeriod, closedByMonth) : [];
  const contributionHistory = buildContributionHistory(snapshotHistory, redeemedByMonth, closedByMonth);

  return {
    identity: {
      name,
      initials: initialsFrom(name),
      avatarUrl: currentUser?.profileImageUrl,
      memberSince: findMemberSince(fullHistory, pointsByPeriod),
      isOnboarded: Boolean(currentUser) || IS_DEV,
      isInfraMember,
    },
    balanceStatus,
    balance: {
      plaaBalance: balanceData?.plaaBalance ?? 0,
      activities: balanceData?.activities ?? 0,
      infraRewards: balanceData?.infraRewards ?? 0,
      redeemed: balanceData?.redeemed ?? 0,
    },
    pointsThisSnapshot: pointsCollected,
    currentSnapshotLabel: periodLabel,
    historyStatus,
    snapshotHistory,
    contributionHistory,
  };
}

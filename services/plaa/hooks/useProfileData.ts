import { useCurrentUserStore } from '@/services/auth/store';
import { useCurrentSnapshotStatus } from '@/services/plaa/hooks/useCurrentSnapshotStatus';
import { useIsInfraMember } from '@/services/plaa/hooks/useIsInfraMember';
import { useProfileBalance } from '@/services/plaa/hooks/useProfileBalance';
import { useProfilePlaaHistory, type ProfilePlaaHistoryEntry } from '@/services/plaa/hooks/useProfilePlaaHistory';
import { useBuybackPrices, type BuybackPrice } from '@/services/plaa/hooks/useBuybackPrices';
import { useRedemptionHistory, type RedemptionHistoryEntry } from '@/services/plaa/hooks/useRedemptionHistory';
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
  /** What the redeemed PLAA fetched, null when any of the month's auctions has no price. */
  redeemedUsd: number | null;
  /** Price per PLAA behind redeemedUsd. */
  redeemedPrice: number | null;
  /** The month spans auctions that cleared at different prices, so the price is a blend. */
  redeemedPriceIsAverage: boolean;
  /** The snapshot is not closed yet, so its own figures are provisional. */
  isPending: boolean;
  cum: number;
}

/** What a month's redemptions came to, once priced at the auctions that cleared them. */
export interface MonthRedemption {
  plaa: number;
  usd: number | null;
  price: number | null;
  isAverage: boolean;
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

/** A history row is only written once a snapshot's PLAA is calculated; without one the month showed nothing at all. */
function withMissingSnapshots(
  history: ProfilePlaaHistoryEntry[],
  lifecycle: SnapshotLifecycleEntry[],
  now: Date,
): ProfilePlaaHistoryEntry[] {
  const months = new Set(history.map((e) => monthKey(e.period)));
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const firstMonth = months.size > 0 ? [...months].sort()[0] : null;
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

/**
 * Prices each month's redemptions at the auction that cleared them.
 *
 * A redemption is matched on auction number, falling back to round number,
 * since auctionNumber is nullable on both sides. A month whose redemptions are
 * not all priced carries no dollar figure at all: a partial total read as a
 * full one would understate what the member gave up.
 */
export function summarizeRedemptions(
  redemptions: RedemptionHistoryEntry[] | null | undefined,
  prices: BuybackPrice[] | null | undefined,
): Record<string, MonthRedemption> {
  const byAuction = new Map<number, number>();
  const byRound = new Map<number, number>();
  for (const price of prices ?? []) {
    if (price.auctionNumber !== null) byAuction.set(price.auctionNumber, price.clearingPrice);
    byRound.set(price.roundNumber, price.clearingPrice);
  }

  const months: Record<string, { plaa: number; usd: number; priced: number; prices: Set<number> }> = {};
  for (const entry of redemptions ?? []) {
    if (entry.period === null || entry.plaaRedeemed === null) continue;
    const month = monthKey(entry.period);
    const price =
      (entry.auctionNumber !== null ? byAuction.get(entry.auctionNumber) : undefined) ??
      (entry.roundNumber !== null ? byRound.get(entry.roundNumber) : undefined) ??
      null;

    const bucket = (months[month] ??= { plaa: 0, usd: 0, priced: 0, prices: new Set() });
    bucket.plaa += entry.plaaRedeemed;
    if (price !== null) {
      bucket.usd += entry.plaaRedeemed * price;
      bucket.priced += entry.plaaRedeemed;
      bucket.prices.add(price);
    }
  }

  const summary: Record<string, MonthRedemption> = {};
  for (const [month, bucket] of Object.entries(months)) {
    const fullyPriced = bucket.priced === bucket.plaa && bucket.plaa > 0;
    summary[month] = {
      plaa: bucket.plaa,
      usd: fullyPriced ? bucket.usd : null,
      price: fullyPriced ? bucket.usd / bucket.plaa : null,
      isAverage: bucket.prices.size > 1,
    };
  }
  return summary;
}

export function buildContributionHistory(
  snapshotHistory: SnapshotHistoryEntry[],
  redeemedByMonth: Record<string, MonthRedemption>,
  closedByMonth: Record<string, boolean>,
): ContributionHistoryEntry[] {
  const oldestFirst = [...snapshotHistory].reverse();
  let cum = 0;
  return oldestFirst.map((entry) => {
    const month = monthKey(entry.periodIso);
    const closed = closedByMonth[month];
    // An open snapshot's PLAA joins the balance only once the snapshot closes.
    if (closed !== false) cum += entry.activityPlaa + entry.infra;
    const redemption = redeemedByMonth[month] ?? null;
    // The balance is net: a redemption leaves it from the month its auction closed in.
    cum -= redemption?.plaa ?? 0;
    return {
      period: entry.period,
      points: entry.points,
      plaa: entry.activityPlaa,
      infra: entry.infra,
      redeemed: redemption?.plaa ?? null,
      redeemedUsd: redemption?.usd ?? null,
      redeemedPrice: redemption?.price ?? null,
      redeemedPriceIsAverage: redemption?.isAverage ?? false,
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
  const { data: buybackPrices } = useBuybackPrices();
  const { data: lifecycleData } = useSnapshotLifecycle();
  const candidateHistory = historyData ? withMissingSnapshots(historyData, lifecycleData ?? [], new Date()) : null;
  const pointsByPeriod = useSnapshotPointsHistory(candidateHistory?.map((e) => e.period) ?? []);
  // Someone with no history at all only gets a month once they have points in it.
  const fullHistory =
    historyData && historyData.length === 0
      ? candidateHistory?.filter((e) => pointsByPeriod[e.period]) ?? null
      : candidateHistory;
  const isInfraMember = useIsInfraMember();

  const name = currentUser?.name || 'Member';
  const redeemedByMonth = summarizeRedemptions(redemptionData, buybackPrices);

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

import { useCurrentUserStore } from '@/services/auth/store';
import { useCurrentSnapshotStatus } from '@/services/plaa/hooks/useCurrentSnapshotStatus';
import { useProfileBalance } from '@/services/plaa/hooks/useProfileBalance';

export interface ProfileActivityItem {
  category: string;
  title: string;
  points: number;
}

export interface SnapshotHistoryEntry {
  period: string;
  activities: number;
  categories: number;
  points: number;
  activityPlaa: number;
  hasInfra: boolean;
  infra: number;
  /** activityPlaa + infra. */
  plaaTotal: number;
  items: ProfileActivityItem[];
}

export interface ContributionHistoryEntry {
  period: string;
  points: number;
  /** Matches this period's SnapshotHistoryEntry.activityPlaa. */
  plaa: number;
  infra: number;
  redeemed: number;
  /** Running balance after this period. */
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

/** 'unavailable' covers signed-out, no synced row yet, or a failed request — kept
 * distinct from 'ready' so a consumer never renders balance's zeroed fields as confirmed. */
export type ProfileBalanceStatus = 'loading' | 'ready' | 'unavailable';

export interface ProfileData {
  identity: ProfileIdentity;
  balance: ProfileBalance;
  balanceStatus: ProfileBalanceStatus;
  pointsThisSnapshot: number;
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

/**
 * TODO(backend): snapshotHistory/contributionHistory are still mocked — no per-user
 * history endpoint yet (PLAA-59). identity.isInfraMember is also mocked (true); wire it
 * to currentUser.rbac.policies checked for code === 'pl_infra_team_pl_internal', the
 * same check detectUserGroup() does in
 * components/page/home/QuickActions/utils/detectUserGroup.ts — confirm with
 * backend/design that team membership is meant to gate infra rewards before wiring it.
 */
const MOCK_SNAPSHOT_HISTORY: SnapshotHistoryEntry[] = [
  {
    period: 'Jul 2026',
    activities: 3,
    categories: 3,
    points: 450,
    activityPlaa: 45,
    hasInfra: true,
    infra: 30,
    plaaTotal: 75,
    items: [
      { category: 'Programs', title: 'Make a Network Introduction', points: 300 },
      { category: 'Knowledge Sharing', title: 'Host Office Hours', points: 100 },
      { category: 'Projects', title: 'Complete a Survey', points: 50 },
    ],
  },
  {
    period: 'Jun 2026',
    activities: 4,
    categories: 4,
    points: 220,
    activityPlaa: 22,
    hasInfra: true,
    infra: 30,
    plaaTotal: 52,
    items: [
      { category: 'Knowledge Sharing', title: 'Thoughtful Responder', points: 60 },
      { category: 'Programs', title: 'Complete a PLAA Survey', points: 50 },
      { category: 'Projects', title: 'Give Excellent Survey Feedback', points: 60 },
      { category: 'People/Talent', title: 'Refer New Alignment Asset Participants', points: 50 },
    ],
  },
  {
    period: 'May 2026',
    activities: 2,
    categories: 2,
    points: 350,
    activityPlaa: 35,
    hasInfra: false,
    infra: 0,
    plaaTotal: 35,
    items: [
      { category: 'Programs', title: 'Make a Network Introduction', points: 300 },
      { category: 'Projects', title: 'Complete a Survey', points: 50 },
    ],
  },
];

const MOCK_REDEMPTIONS_BY_PERIOD: Record<string, number> = { 'Jul 2026': 50 };

function buildContributionHistory(snapshotHistory: SnapshotHistoryEntry[]): ContributionHistoryEntry[] {
  const oldestFirst = [...snapshotHistory].reverse();
  let cum = 0;
  return oldestFirst.map((entry) => {
    const redeemed = MOCK_REDEMPTIONS_BY_PERIOD[entry.period] ?? 0;
    cum += entry.activityPlaa + entry.infra - redeemed;
    return {
      period: entry.period,
      points: entry.points,
      plaa: entry.activityPlaa,
      infra: entry.infra,
      redeemed,
      cum,
    };
  });
}

export function useProfileData(): ProfileData {
  const currentUser = useCurrentUserStore((s) => s.currentUser);
  const { pointsCollected } = useCurrentSnapshotStatus();
  const { data: balanceData, isLoading: isBalanceLoading } = useProfileBalance();
  const balanceStatus: ProfileBalanceStatus = isBalanceLoading ? 'loading' : balanceData ? 'ready' : 'unavailable';

  const name = currentUser?.name || 'Member';
  const snapshotHistory = MOCK_SNAPSHOT_HISTORY;
  const contributionHistory = buildContributionHistory(snapshotHistory);

  return {
    identity: {
      name,
      initials: initialsFrom(name),
      avatarUrl: currentUser?.profileImageUrl,
      memberSince: 'January 2025',
      // IS_DEV-only override, never true in a production build.
      isOnboarded: Boolean(currentUser) || IS_DEV,
      isInfraMember: true, // TODO(backend): mocked, see module doc above.
    },
    balanceStatus,
    balance: {
      plaaBalance: balanceData?.plaaBalance ?? 0,
      activities: balanceData?.activities ?? 0,
      infraRewards: balanceData?.infraRewards ?? 0,
      redeemed: balanceData?.redeemed ?? 0,
    },
    pointsThisSnapshot: pointsCollected,
    snapshotHistory,
    contributionHistory,
  };
}

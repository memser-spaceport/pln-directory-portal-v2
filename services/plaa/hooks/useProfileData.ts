import { useCurrentUserStore } from '@/services/auth/store';
import { useCurrentSnapshotStatus } from '@/services/plaa/hooks/useCurrentSnapshotStatus';

export interface ProfileActivityItem {
  category: string;
  title: string;
  points: number;
}

export interface SnapshotHistoryEntry {
  /** e.g. "Jul 2026" */
  period: string;
  activities: number;
  categories: number;
  points: number;
  /** PLAA the period's points converted to at close. */
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
  /** Activity-derived PLAA for this period alone (matches the same period's SnapshotHistoryEntry.activityPlaa). */
  plaa: number;
  infra: number;
  redeemed: number;
  /** Running PLAA balance after this period. */
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

export interface ProfileData {
  identity: ProfileIdentity;
  balance: ProfileBalance;
  /** Points collected so far in the current (open) snapshot — same source as PlaaSnapshotBar. */
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
 * TODO(backend): the entire snapshot/contribution history and PLAA balance breakdown
 * below is mocked — there's no per-user history endpoint yet. Real, wireable pieces:
 *   - identity.name / identity.avatarUrl: already available from `useCurrentUserStore()`
 *     (`currentUser.name` / `currentUser.profileImageUrl`), wired below.
 *   - identity.isOnboarded: proxy for "has a LabOS session" — wired to `currentUser` below;
 *     replace with a real PLAA-onboarding flag once one exists. Locally/in preview builds
 *     it's also forced true (IS_DEV) so the page is demoable without logging in — that
 *     override never applies in a production build.
 *   - pointsThisSnapshot: already real via useCurrentSnapshotStatus(), which itself has
 *     its own TODO for connecting to useSnapshotPoints().
 *   - identity.isInfraMember: reuse `currentUser.rbac.policies` checked for
 *     `code === 'pl_infra_team_pl_internal'` — the same PL Infra team check
 *     `detectUserGroup()` already does in
 *     `components/page/home/QuickActions/utils/detectUserGroup.ts`. That's team
 *     membership, not a PLAA-specific "infra rewards eligible" flag, so confirm
 *     with backend/design that the two are meant to be the same thing before
 *     wiring it — there's no dedicated field for the latter today.
 * Everything else (member-since date, PLAA balance breakdown, snapshotHistory,
 * contributionHistory) needs new backend endpoints — there's no existing
 * per-user PLAA ledger to derive them from.
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

/** Redemptions aren't tied to a specific snapshot's activities, so they're mocked per-period here. */
const MOCK_REDEMPTIONS_BY_PERIOD: Record<string, number> = { 'Jul 2026': 50 };

function buildContributionHistory(snapshotHistory: SnapshotHistoryEntry[]): ContributionHistoryEntry[] {
  // Oldest first, so the running balance accumulates forward.
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

  const name = currentUser?.name || 'Member';
  const snapshotHistory = MOCK_SNAPSHOT_HISTORY;
  const contributionHistory = buildContributionHistory(snapshotHistory);

  const activitiesTotal = contributionHistory.reduce((sum, p) => sum + p.plaa, 0);
  const infraTotal = contributionHistory.reduce((sum, p) => sum + p.infra, 0);
  const redeemedTotal = contributionHistory.reduce((sum, p) => sum + p.redeemed, 0);

  return {
    identity: {
      name,
      initials: initialsFrom(name),
      avatarUrl: currentUser?.profileImageUrl,
      memberSince: 'January 2025',
      // DEMO: shows the full onboarded profile locally without requiring login.
      // IS_DEV is always false in a production build, so this never applies there.
      isOnboarded: Boolean(currentUser) || IS_DEV,
      // TODO(backend): reuse currentUser.rbac.policies (code === 'pl_infra_team_pl_internal'),
      // the same PL Infra team check detectUserGroup() does — see module doc comment above —
      // instead of this hardcoded mock. Do not introduce a separate PLAA-specific infra flag.
      isInfraMember: true,
    },
    balance: {
      plaaBalance: activitiesTotal + infraTotal - redeemedTotal,
      activities: activitiesTotal,
      infraRewards: infraTotal,
      redeemed: redeemedTotal,
    },
    pointsThisSnapshot: pointsCollected,
    snapshotHistory,
    contributionHistory,
  };
}

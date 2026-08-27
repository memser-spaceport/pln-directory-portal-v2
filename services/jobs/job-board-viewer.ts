import { IUserInfo } from '@/types/shared.types';
import { USE_ACCESS_CONTROL_V2 } from '@/utils/feature-flags';

/**
 * Who is looking at the job board, and whether they can apply from it.
 *
 * Pure functions only — no hooks, no fetches. `useJobBoardViewer` composes the
 * client queries and calls these, so the whole decision table is unit-testable
 * without mocking React Query.
 */

/**
 * The one dual-system read of "is this member approved".
 *
 * Three-valued on purpose: a boolean cannot distinguish pending from rejected,
 * and the board treats them very differently (pending gets the stepper banner,
 * rejected gets plain browsing — never a "we'll notify you" that isn't true).
 */
export type JobsAccessVerdict = 'approved' | 'pending' | 'rejected';

type RbacStatus = NonNullable<IUserInfo['rbac']>['status'];
type AccessLevel = NonNullable<IUserInfo['accessLevel']>;

/* Record maps, not if-chains: a new status on either system fails to compile
   here instead of falling through to the wrong banner. */
const RBAC_VERDICTS: Record<RbacStatus, JobsAccessVerdict> = {
  PENDING: 'pending', // identity not yet verified — still "wait", never "apply"
  VERIFIED: 'pending', // verified, under review
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

/* L2–L6 = the levels getAccessLevel() calls 'advanced' (utils/auth.utils.ts). */
const ACCESS_LEVEL_VERDICTS: Record<AccessLevel, JobsAccessVerdict> = {
  L0: 'pending',
  L1: 'pending',
  L2: 'approved',
  L3: 'approved',
  L4: 'approved',
  L5: 'approved',
  L6: 'approved',
  Rejected: 'rejected',
};

/**
 * `useV2` is injectable so tests can exercise both branches — the env const is
 * baked at module load and can't be varied per test case.
 */
export function getJobsAccessVerdict(
  userInfo: IUserInfo | null,
  useV2: boolean = USE_ACCESS_CONTROL_V2,
): JobsAccessVerdict {
  if (!userInfo) return 'pending';
  if (useV2) {
    const status = userInfo.rbac?.status;
    return status ? RBAC_VERDICTS[status] : 'pending';
  }
  const level = userInfo.accessLevel;
  return level ? ACCESS_LEVEL_VERDICTS[level] : 'pending';
}

export const canApplyToJobs = (userInfo: IUserInfo | null, useV2?: boolean): boolean =>
  getJobsAccessVerdict(userInfo, useV2) === 'approved';

/** Marker assigned on Job Board sign-up, including unapproved members. */
export const JOB_ASPIRANT_POLICY_CODE = 'job_aspirant';

/** `signUpSource` written by Job Board sign-up. The login cookie carries this
 *  even when `rbac.policies` is missing (auth's userInfo omits policies). */
export const JOB_BOARD_SIGN_UP_SOURCE = 'job-board';

export const isJobAspirant = (userInfo: IUserInfo | null): boolean =>
  userInfo?.rbac?.policies?.some((policy) => policy.code === JOB_ASPIRANT_POLICY_CODE) ||
  userInfo?.signUpSource === JOB_BOARD_SIGN_UP_SOURCE;

/**
 * Whether this viewer is offered the way out to the hiring team's own posting.
 *
 * Two people are not: someone with no account, and a **Job Aspirant** — a member
 * who arrived through the job board itself. Both came here to apply, and this
 * board can take an application in three steps without them leaving; a link to
 * the company's careers page at that moment is an exit from the one flow that
 * works for them, into a form that will ask for everything again.
 *
 * Everyone else keeps it. For an established member the posting is reference
 * material next to an application they can make either way, and reading the ad
 * has never been the same act as applying.
 *
 * Takes `isLoggedIn` separately rather than inferring it from `userInfo`,
 * because the two disagree in both directions during first paint — the cookie
 * can carry a user the store has not hydrated, and vice versa. The caller knows
 * which is authoritative on its surface; this does not.
 */
export const canSeeOriginalPosting = (args: { isLoggedIn: boolean; userInfo: IUserInfo | null | undefined }): boolean =>
  args.isLoggedIn && !isJobAspirant(args.userInfo ?? null);

/**
 * Where someone is in their search.
 *
 * **Private — PL Team only.** Never rendered on the public profile, never in the
 * apply read-back, never in analytics payloads. Deliberately NOT
 * `member.openToWork`, which is public and means "open to collaborate".
 *
 * Wire values are unagreed with BE; the union is derived from this array so
 * there is exactly one place to change them.
 */
export const JOB_SEARCH_STATUS_OPTIONS = [
  {
    value: 'actively-looking',
    label: 'Actively looking',
    hint: "You're searching now and want to hear about roles that fit.",
  },
  {
    value: 'open-to-right-role',
    label: 'Open to the right role',
    hint: "You're not searching, but you'd take the right conversation.",
  },
  {
    value: 'not-looking',
    label: 'Not looking',
    hint: "You don't want to hear about roles right now.",
  },
] as const;

export type JobSearchStatus = (typeof JOB_SEARCH_STATUS_OPTIONS)[number]['value'];

/**
 * The same three values without their presentation, for the places that need a
 * plain list — `z.enum` on the sign-up wire schema, principally.
 *
 * Derived rather than restated, so the list above stays the one place these
 * change. The assertion says only that the array is non-empty, which `z.enum`
 * requires and which is evident three lines up; the member type is inferred.
 */
export const JOB_SEARCH_STATUS_VALUES = JOB_SEARCH_STATUS_OPTIONS.map((option) => option.value) as [
  JobSearchStatus,
  ...JobSearchStatus[],
];

export const isJobSearchStatus = (v: unknown): v is JobSearchStatus =>
  JOB_SEARCH_STATUS_OPTIONS.some((o) => o.value === v);

/** Unknown wire values degrade to themselves, never crash — values are unagreed with BE. */
export const jobSearchStatusDisplayLabel = (raw: string): string =>
  JOB_SEARCH_STATUS_OPTIONS.find((o) => o.value === raw)?.label ?? raw;

/** The member fields that gate Apply — structural so tests pass two-field literals. */
export interface JobProfileFields {
  role?: string | null;
  mainTeam?: { role?: string | null } | null;
}

/**
 * The gate on Apply: current role + an answered job search status. Everything
 * else on the profile is optional — adding a section never adds a requirement.
 *
 * `null` means unanswered. Both role sources are trim-checked individually:
 * `??` alone would not fall back past an empty-string `mainTeam.role`, and
 * empty-string roles exist in this data model.
 */
export function isJobProfileComplete(
  member: JobProfileFields | null,
  jobSearchStatus: JobSearchStatus | null,
): boolean {
  const role = (member?.mainTeam?.role ?? '').trim() || (member?.role ?? '').trim();
  return role !== '' && jobSearchStatus !== null;
}

export const BOARD_VIEWER_STATES = [
  'resolving',
  'logged-out',
  'pending-approval',
  'rejected',
  'profile-incomplete',
  'profile-ready',
] as const;

/**
 * The board's entry states.
 *
 * `resolving` exists because the logged-in sub-states are client-query-derived
 * and settle after first paint — without it, a complete profile derives as
 * `profile-incomplete` for the query round-trip and the "update your profile"
 * banner flashes on every visit. While resolving, the banner slot renders
 * nothing (banner-absence is already the `profile-ready` presentation).
 *
 * `rejected` is browse-only with no banner: the pending copy promises an
 * approval that will not come, and showing it forever would be a lie.
 */
export type BoardViewerState = (typeof BOARD_VIEWER_STATES)[number];

export function deriveBoardViewer(input: {
  isLoggedIn: boolean;
  userInfo: IUserInfo | null;
  /** True once the client queries behind the verdict + completeness have settled. */
  isResolved: boolean;
  profileComplete: boolean;
  useV2?: boolean;
}): BoardViewerState {
  if (!input.isLoggedIn) return 'logged-out';
  if (!input.isResolved) return 'resolving';
  const verdict = getJobsAccessVerdict(input.userInfo, input.useV2);
  switch (verdict) {
    case 'rejected':
      return 'rejected';
    case 'pending':
      // Job Aspirants may stay unapproved; the pending-approval banner promises
      // a review they are not in. They get the same banner split as approved
      // members. Access itself stays pending — Apply still goes external.
      if (isJobAspirant(input.userInfo)) {
        return input.profileComplete ? 'profile-ready' : 'profile-incomplete';
      }
      return 'pending-approval';
    case 'approved':
      return input.profileComplete ? 'profile-ready' : 'profile-incomplete';
  }
}

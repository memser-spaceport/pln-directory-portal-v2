import { IUserInfo } from '@/types/shared.types';
import { USE_ACCESS_CONTROL_V2 } from '@/utils/feature-flags';
import { isBlankHtml } from '@/utils/html';

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
 *  even when `rbac.policies` is missing (auth's userInfo omits policies).
 *  Team Job Board sign-ups share this source, so it only counts as Job Aspirant
 *  when there is no main team. */
export const JOB_BOARD_SIGN_UP_SOURCE = 'job-board';

export const isJobAspirant = (userInfo: IUserInfo | null): boolean =>
  Boolean(userInfo?.rbac?.policies?.some((policy) => policy.code === JOB_ASPIRANT_POLICY_CODE)) ||
  (userInfo?.signUpSource === JOB_BOARD_SIGN_UP_SOURCE && !userInfo?.mainTeamName);

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
 * Whether this viewer is offered the "I'm interested" light signal.
 *
 * It exists to capture intent before someone has a real application in — a
 * **Job Aspirant**'s problem, and only theirs. An established member already
 * has full Apply available, with the profile it needs to be used right, and a
 * signed-out visitor has no account to attach the signal to; both are
 * withheld it entirely rather than shown a control they cannot meaningfully
 * use.
 */
export const canShowJobInterest = (args: { isLoggedIn: boolean; userInfo: IUserInfo | null | undefined }): boolean =>
  args.isLoggedIn && isJobAspirant(args.userInfo ?? null);

/**
 * Where someone is in their search.
 *
 * **Private.** Rendered on the member's OWN profile and nowhere else: the API
 * omits the field for every other viewer, and the two surfaces that show it —
 * `JobSearchStatusDetails` on /members/[id] and the job-board profile drawer —
 * both gate on the viewer being the member. Never on anyone else's view of that
 * profile, never in the apply read-back, and never as a *value* in an analytics
 * payload (`onJobSearchStatusChanged` counts the act, not the answer).
 * Deliberately NOT `member.openToWork`, which is public and means "open to
 * collaborate".
 *
 * The two hosts deliberately offer different subsets. The drawer hides
 * "Not looking" mid-application; the profile card offers all three, because it
 * is the only place a member can turn themselves off.
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

/**
 * The Job Aspirant banner stays up until each fillable profile section has
 * something in it — stricter than `isJobProfileComplete`, which only gates
 * Apply.
 *
 * Role + job search status are the two Apply answers. Skills, bio and
 * experience are the optional set the profile drawer names ("Experience, skills
 * and bio are optional"). A JA who can already apply still sees the nudge
 * until those are filled too. Contact is skipped: sign-up always writes an
 * email, so the card would never read empty.
 */
export interface JobProfileSectionFields extends JobProfileFields {
  skills?: unknown[] | null;
  bio?: string | null;
}

export function areAllJobProfileSectionsFilled(
  member: JobProfileSectionFields | null,
  jobSearchStatus: JobSearchStatus | null,
  experienceCount: number,
): boolean {
  if (!isJobProfileComplete(member, jobSearchStatus)) return false;
  if (!Array.isArray(member?.skills) || member.skills.length === 0) return false;
  const bio = member?.bio ?? '';
  if (!bio.trim() || (isBlankHtml(bio) && !/<img\b/i.test(bio))) return false;
  return experienceCount >= 1;
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

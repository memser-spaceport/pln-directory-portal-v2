export enum JobsQueryKey {
  List = 'jobs-list',
  Filters = 'jobs-filters',
  BaseFilters = 'jobs-base-filters',
  ReferralDraft = 'jobs-referral-draft',
  /** Name search inside the refer modal's two people pickers. */
  ReferralMemberSearch = 'jobs-referral-member-search',
  /** The hiring team behind a role — prefilled recipients, and the menu's first group. */
  ReferralTeamMembers = 'jobs-referral-team-members',
  /** The viewer's complete applied-roles list — one whole-map key, scoped by member uid. */
  ApplicationStatuses = 'job-application-statuses',
  /** The viewer's own (PL-Team-only) job search status. */
  JobSearchStatus = 'job-search-status',
}

/**
 * In-app apply on the job board: sign-up banner, apply/applied slot on rows,
 * profile drawer, apply modal.
 *
 * Per-environment, so dev can exercise the flow while production stays dark —
 * the backend contract hasn't landed, and until it does applications and the
 * job search status live in `job-applications.mock.ts` (session-scoped, never
 * persisted server-side). Nothing reaches a hiring team; see that file's
 * cutover note. Unset means off, so an environment that never heard of this
 * variable does not ship a mocked apply flow.
 *
 * NEXT_PUBLIC_ because the board is a client component — the value is inlined
 * at build time, which is also what keeps the guards below foldable. That makes
 * it a BUILD-time flag: changing it in the dashboard needs a redeploy, not just
 * a restart.
 *
 * Gate the WORK, not the render: the flag is imported ONLY by the board host
 * (`JobsContent`) — leaf components receive props or don't, and the new query
 * hooks take it via `enabled:`. Write it literal-first in `&&` guards so the
 * bundler folds the branch.
 */
export const SHOW_JOB_BOARD_APPLY: boolean = process.env.NEXT_PUBLIC_SHOW_JOB_BOARD_APPLY === 'true';

export const JOBS_SORT_OPTIONS = [
  { value: 'company_az', label: 'A-Z (Ascending)' },
  { value: 'company_za', label: 'Z-A (Descending)' },
  { value: 'newest', label: 'Newest' },
] as const;

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

/**
 * "Fill my Experience section from a CV" inside the profile drawer: the drop
 * area in the section's empty state, the "Update from CV" header control, and
 * the review card that follows a parse.
 *
 * Separate from `SHOW_JOB_BOARD_APPLY` and nested inside it — the drawer only
 * opens when that one is on, so this gates a feature *within* an already-gated
 * flow. Two flags because the two cut over on different days: apply waits on the
 * applications contract, the importer waits on `/cv-import/parse` and
 * `/cv-import/apply`, which are a different team's work and do not exist yet.
 * Until they do, an environment with this on would offer a door that 404s.
 *
 * **It lives in `services/jobs/` because there is exactly one host today.** The
 * components it gates are `member-details/`, not job-board, and are written to
 * be mounted by the member profile page and onboarding as well. The day a second
 * host wants them, this constant moves somewhere neutral and the drawer's
 * `enableCvImport` prop stays exactly as it is — the prop, not the flag, is what
 * keeps the section flag-free.
 *
 * Read only by `JobProfileDrawer`, literal-first in `&&`, so the bundler folds
 * the branch. Same BUILD-time caveat as above: a dashboard change needs a
 * redeploy.
 */
export const SHOW_CV_IMPORT: boolean = process.env.NEXT_PUBLIC_SHOW_CV_IMPORT === 'true';

export const JOBS_SORT_OPTIONS = [
  { value: 'company_az', label: 'A-Z (Ascending)' },
  { value: 'company_za', label: 'Z-A (Descending)' },
  { value: 'newest', label: 'Newest' },
] as const;

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
 * flow. Two flags because the two cut over on different days.
 *
 * **The endpoints exist now.** `POST /v1/members/:uid/cv-imports` (202),
 * `GET .../cv-imports/latest` and `POST .../cv-imports/apply` shipped in the
 * backend's `member-cv-imports` module, and `cv-import.service.ts` is written
 * against them rather than against the handoff spec. What remains before this
 * flips in a deployed environment is confirming the module is actually deployed
 * there and that its AI provider is configured — the parse runs an LLM call, so
 * an environment with the routes but no model answers `PARSE_FAILED` for every
 * document.
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

/**
 * Read the job in the app before applying to it: the row's button becomes
 * **View job**, and Apply moves to the bottom of the description it applies to.
 *
 * **Dark, and for a reason that is not "unfinished".** The layout is done and
 * the drawer now renders `IJobRole.descriptionHtml` — the content exists. What
 * does not exist is *coverage*: the ingest only carries a body for the teams
 * whose careers sites it can read, and on dev that was 11 of 91 roles (12%),
 * from two teams, with every Protocol Labs and manually-added role null.
 *
 * So flipping this on today would insert a reading step in front of Apply and
 * still give most people nothing to read — a strictly worse funnel than the
 * direct Apply it replaces. It flips on coverage, not on FE work.
 *
 * The number that decides it is already instrumented: `job-detail-opened`
 * against `job-apply-clicked`. Read them together with the null-body share —
 * opens that never reach an apply are people the row used to send straight into
 * the flow.
 *
 * Nested inside `SHOW_JOB_BOARD_APPLY`: the drawer's whole footer is the apply
 * hand-off, so there is nothing for it to do while that one is down.
 *
 * Same BUILD-time caveat as the two above — a dashboard change needs a redeploy.
 */
export const SHOW_JOB_DETAIL: boolean = process.env.NEXT_PUBLIC_SHOW_JOB_DETAIL === 'true';

export const JOBS_SORT_OPTIONS = [
  { value: 'company_az', label: 'A-Z (Ascending)' },
  { value: 'company_za', label: 'Z-A (Descending)' },
  { value: 'newest', label: 'Newest' },
] as const;

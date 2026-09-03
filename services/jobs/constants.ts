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
  /** The viewer's complete interested-roles list. Same whole-map shape as
   *  `ApplicationStatuses`, scoped by member uid for the same reason. */
  InterestStatuses = 'job-interest-statuses',
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
 * The "I'm interested" banner in the job detail drawer — a light signal
 * alongside Apply, not a replacement for it.
 *
 * The endpoints exist now — `POST`/`DELETE /v1/job-openings/:uid/interest` and
 * `GET /v1/job-openings/interests` — and `schema/job-interests` is written
 * against the real contract rather than a guess. What still keeps this dark is
 * the second gate below, plus the usual per-environment rollout: a 404 from a
 * hook the drawer renders unconditionally would degrade the drawer for
 * everyone, so nothing requests anything until an environment says so.
 *
 * Separate from `SHOW_JOB_BOARD_APPLY` rather than folded into it: the apply
 * flow is live and this is not, and one flag that means two things cannot be
 * turned on by halves.
 *
 * The second gate is not technical: the logged-out composition this introduces
 * (the banner stacked above `JobUnlockBanner`) is not drawn in any Figma frame.
 * See the plan's D1. That review is now the only thing left before the flip.
 *
 * Same convention as above: imported ONLY by the board hosts, passed down as
 * `interestEnabled`, and written literal-first in `&&` so the bundler folds it.
 */
export const SHOW_JOB_BOARD_INTEREST: boolean = process.env.NEXT_PUBLIC_SHOW_JOB_BOARD_INTEREST === 'true';

/* (`SHOW_CV_IMPORT` lived here, "because there is exactly one host today". The
    member profile page is the second, so it moved somewhere neutral —
    `services/members/constants` — which is where the components it gates live.
    Its own note called this move in advance. */

/* (`SHOW_JOB_DETAIL` lived here. It gated the reading step in front of Apply,
    and it was dark for one reason: coverage. The ingest only carried a body for
    the teams whose careers sites it could read — 11 of 91 roles on dev — so
    turning it on would have inserted a reading step that gave most people
    nothing to read, a strictly worse funnel than the direct Apply it replaced.
    Its own note said it flips on coverage, not on FE work.

    Coverage arrived: 83 of 92 roles on dev carry `descriptionHtml`. The nine
    that don't get the empty state, which names where the posting actually is and
    links to it. So the flag has answered its question and the reading step is
    now step 1 of the apply flow rather than an alternative to it. */

export const JOBS_SORT_OPTIONS = [
  { value: 'company_az', label: 'A-Z (Ascending)' },
  { value: 'company_za', label: 'Z-A (Descending)' },
  { value: 'newest', label: 'Newest' },
] as const;

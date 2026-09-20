import type { JobSurface } from '@/analytics/jobs.analytics';

/**
 * UTM params appended to every outbound apply/share link, so the hiring company can
 * see where the click came from. The medium tracks the surface: the same role card
 * renders on the job board, on a team profile and in the home feed, and a fixed
 * `job_board` would report all of it as board traffic to the employer.
 *
 * A Record rather than a ternary: the ternary's `else` silently labelled every
 * surface but one as `job_board`, so adding a third meant a wrong number rather
 * than a compile error. This way an unmapped surface does not build.
 */
const UTM_MEDIUM_BY_SURFACE: Record<JobSurface, string> = {
  'job-board': 'job_board',
  'team-profile': 'team_profile',
  'home-feed': 'home_feed',
};

export const jobApplyQueryParams = (source: JobSurface) =>
  `utm_source=os.pl.xyz&utm_medium=${UTM_MEDIUM_BY_SURFACE[source]}`;

export const jobApplyHref = (applyUrl: string | null | undefined, source: JobSurface): string | null =>
  applyUrl ? `${applyUrl}?${jobApplyQueryParams(source)}` : null;

/**
 * Apply by leaving: open the hiring team's own posting in a new tab.
 *
 * **This came back.** It was removed when approval stopped gating applying, on
 * the reading that every Apply was in-app from then on. That is true of Protocol
 * Labs roles and false of the rest: an account still awaiting approval applies
 * on the employer's site everywhere else, which is the behaviour the board had
 * before and the one it has again. See `useJobApplyFlow`.
 *
 * `interceptPrimaryApplyClick` has NOT come back with it. That existed so the
 * row's Apply could be a real `<a>` — middle-click native, left-click caught to
 * recheck access first — and the row's Apply is a `<button>` now, because on the
 * board it opens the reading step rather than the posting. The decision is made
 * one screen later, where there is no anchor to intercept.
 */
export const openExternalApply = (applyUrl: string | null | undefined, source: JobSurface) => {
  const href = jobApplyHref(applyUrl, source);
  if (href) window.open(href, '_blank', 'noopener,noreferrer');
};

/**
 * The board's params, kept as a constant for the surfaces that link to a role without
 * rendering the full card (the prototypes).
 *
 * No longer used by the home feed: its roll-ups render the real `ReferRoleRow` now
 * and pass `source: 'home-feed'`, so feed traffic is attributed as itself rather
 * than mislabelled as the board's.
 */
export const JOB_QUERY_PARAMS = jobApplyQueryParams('job-board');

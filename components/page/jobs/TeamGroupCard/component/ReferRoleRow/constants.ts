import type { JobSurface } from '@/analytics/jobs.analytics';

/**
 * UTM params appended to every outbound apply/share link, so the hiring company can
 * see where the click came from. The medium tracks the surface: the same role card
 * renders on the job board and on a team profile, and a fixed `job_board` would
 * report team-profile traffic as board traffic to the employer.
 */
export const jobApplyQueryParams = (source: JobSurface) =>
  `utm_source=os.pl.xyz&utm_medium=${source === 'team-profile' ? 'team_profile' : 'job_board'}`;

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
 * rendering the full card (the home feed's HiringCard, the prototypes). Those still
 * report as `job_board`, which is only accurate for the board itself — worth revisiting
 * if the home feed's hiring links ever need attributing separately.
 */
export const JOB_QUERY_PARAMS = jobApplyQueryParams('job-board');

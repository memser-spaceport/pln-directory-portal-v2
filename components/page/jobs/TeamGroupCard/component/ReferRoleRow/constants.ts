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

export const openExternalApply = (applyUrl: string | null | undefined, source: JobSurface) => {
  const href = jobApplyHref(applyUrl, source);
  if (href) window.open(href, '_blank', 'noopener,noreferrer');
};

/** Left-click is intercepted so Apply can recheck access and either open
 *  in-app or `window.open` the posting. Modifier/middle-click keeps the native
 *  `<a>` so the posting still opens in a new tab. */
export function interceptPrimaryApplyClick(
  event: Pick<MouseEvent, 'metaKey' | 'ctrlKey' | 'shiftKey' | 'altKey'> & { preventDefault: () => void },
  apply: () => void,
) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  apply();
}

/**
 * The board's params, kept as a constant for the surfaces that link to a role without
 * rendering the full card (the home feed's HiringCard, the prototypes). Those still
 * report as `job_board`, which is only accurate for the board itself — worth revisiting
 * if the home feed's hiring links ever need attributing separately.
 */
export const JOB_QUERY_PARAMS = jobApplyQueryParams('job-board');

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

/* (`openExternalApply` and `interceptPrimaryApplyClick` lived here. Both existed
    for one case: an unapproved member, whose Apply sent them to the hiring
    team's own posting instead of the in-app letter. `interceptPrimaryApplyClick`
    was what let that control still be a real `<a>` — modifier and middle click
    kept the native navigation, left click was caught so access could be
    rechecked first.

    Approval no longer gates applying, so every Apply on the board is in-app and
    neither has a caller. The outbound link to the posting is still here and
    still wanted — `jobApplyHref` above, rendered as "Read the original posting"
    in the detail drawer — because reading the ad and applying were always two
    different acts. What went is the version of Apply that *was* that link.) */

/**
 * The board's params, kept as a constant for the surfaces that link to a role without
 * rendering the full card (the home feed's HiringCard, the prototypes). Those still
 * report as `job_board`, which is only accurate for the board itself — worth revisiting
 * if the home feed's hiring links ever need attributing separately.
 */
export const JOB_QUERY_PARAMS = jobApplyQueryParams('job-board');

/**
 * The role whose in-app description drawer is open, carried in the URL so a
 * shared or emailed link reopens that drawer rather than bouncing to the
 * company's own posting.
 *
 * Named `job` to match `/home?news=` — a short, public identifier, not an
 * internal field name. Distinct from `applyTo`, which is a one-shot resume
 * instruction for the apply flow and is stripped as soon as it is acted on.
 */

import type { JobReferShareNetwork } from '@/analytics/jobs.analytics';
import type { IJobRole, IJobTeam, IJobTeamGroup } from '@/types/jobs.types';

export const JOB_DETAIL_PARAM = 'job';

/** `utm_source` stamped on a link copied or shared from the refer menu, read
 *  back on arrival by `useJobDetailDeepLink` so a shared open can be told apart
 *  from a click on the board. */
export const JOB_SHARE_UTM_SOURCE = 'job_refer_share';

export function jobDetailPath(jobUid: string): string {
  return `/jobs?${JOB_DETAIL_PARAM}=${encodeURIComponent(jobUid)}`;
}

/** Canonical share/email URL. Never `location.href` — the current page may
 *  carry filters, UTMs, or a different role's uid.
 *
 *  `channel` is optional because the attribution UTMs are only right for a link
 *  a person is about to hand to someone else. */
export function jobDetailShareUrl(jobUid: string, channel?: JobReferShareNetwork): string {
  const path = channel
    ? `${jobDetailPath(jobUid)}&utm_source=${JOB_SHARE_UTM_SOURCE}&utm_medium=${channel}`
    : jobDetailPath(jobUid);
  if (typeof window === 'undefined') return path;
  return `${window.location.origin}${path}`;
}

export function findJobInGroups(groups: IJobTeamGroup[], jobUid: string): { role: IJobRole; team: IJobTeam } | null {
  for (const group of groups) {
    const role = group.roles.find((item) => item.uid === jobUid);
    if (role) return { role, team: group.team };
  }
  return null;
}

/**
 * Write or clear `?job=` on the current URL without a navigation.
 *
 * `replaceState` rather than `router.replace` so the board underneath does not
 * refetch — same idiom as `stripResumeParamsFromUrl` and `useNewsDeepLink`.
 * Other params (filters, UTMs) are preserved so opening a role does not undo
 * a narrowed rail.
 */
export function writeJobDetailParam(jobUid: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    if (jobUid) {
      url.searchParams.set(JOB_DETAIL_PARAM, jobUid);
    } else {
      url.searchParams.delete(JOB_DETAIL_PARAM);
    }
    const search = url.searchParams.toString();
    window.history.replaceState(window.history.state, '', `${url.pathname}${search ? `?${search}` : ''}${url.hash}`);
  } catch {
    // A URL we cannot rewrite is not worth failing the drawer over.
  }
}

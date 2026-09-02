/**
 * The role someone pressed Apply on, carried across the Privy round trip.
 *
 * Signing up navigates away and comes back: without this, a person who pressed
 * Apply, filled in the sign-up form and authenticated lands on a plain board
 * and has to find their row again. Losing the thread there is the difference
 * between a gate and a dead end.
 *
 * **Why the URL and not storage.** `AuthInfo` — the component `#login` mounts —
 * calls `localStorage.clear()` before doing anything else, so localStorage is
 * out (that trap silently broke the email prefill). sessionStorage looked like
 * the answer, but it did not reliably survive the trip in practice, and a
 * resume that works most of the time is worse than one that works. The query
 * string demonstrably makes it through — it is how `prefillEmail` reaches
 * Privy — and unlike an email, a job uid is public data already in the page, so
 * putting it in the URL costs nothing.
 *
 * Only the uid travels. A serialised role is a snapshot that can outlive the
 * listing it describes; the uid is re-resolved against the freshly loaded
 * board, so a role that closed mid-signup simply doesn't resume rather than
 * resuming as stale data.
 *
 * Banner / modal sign-up has no job. That path uses `viewNewest` instead, so
 * they land on the newest open role — see `withPendingNewestRole`.
 */

import type { IJobRole, IJobTeam, IJobTeamGroup } from '@/types/jobs.types';
import { getJobDate } from '@/utils/jobs.utils';

export const PENDING_APPLY_PARAM = 'applyTo';
/**
 * "Open the newest role" — the job-less sign-up's landing.
 *
 * A flag rather than a uid, and that is the point: which role is newest is a
 * question about the board as it loads *after* the round trip, not as it was
 * when the form was submitted. Resolving it at sign-up time would name a role
 * that a fresher posting could displace while Privy was on screen.
 */
export const PENDING_NEWEST_PARAM = 'viewNewest';

/**
 * Not ours to define — several flows write it — but it rides along with the two
 * above on the jobs round trip, and nobody removes it: `AuthInfo` copies it into
 * localStorage and leaves it, and `clearPrivyParams` only strips `privy_*`. So
 * it is ours to clean up when we clean up after ourselves. It matters more since
 * the flow reached team profiles: `/teams/<uid>?prefillEmail=someone%40x.com` is
 * the kind of URL people paste into Slack.
 */
const PREFILL_EMAIL_PARAM = 'prefillEmail';

const toSearch = (params: URLSearchParams): string => {
  const next = params.toString();
  return next ? `?${next}` : '';
};

/**
 * Declare the pending role on a search string — or declare there isn't one,
 * which REMOVES any role already sitting there.
 *
 * The removal is the load-bearing half. Only signing up resumes an
 * application; signing in must not. But a person who signs up and then
 * abandons the Privy modal leaves `applyTo` in the URL, and every later
 * navigation carries the whole search string along — so a sign-in that merely
 * declined to add the parameter would still inherit the stale one and resume a
 * role the person didn't just act on. Passing no uid says "nothing is pending"
 * and makes that true.
 *
 * Also clears `completeProfile`: the two instructions are mutually exclusive,
 * and a sign-in must not inherit either.
 *
 * Everything else on the search string is preserved: the filters someone
 * narrowed before signing up should still be narrowed when they land back.
 */
export function withPendingApply(search: string, roleUid: string | undefined): string {
  const params = new URLSearchParams(search);
  params.delete(PENDING_NEWEST_PARAM);
  if (roleUid) {
    params.set(PENDING_APPLY_PARAM, roleUid);
  } else {
    params.delete(PENDING_APPLY_PARAM);
  }
  return toSearch(params);
}

/**
 * After a job-less sign-up (the banner / header modal), land on the newest open
 * role rather than a plain board.
 *
 * **What this replaced, and why it is a real trade.** It used to be
 * `completeProfile`, which opened the standalone profile drawer — defensible,
 * because an account made at that door is not `isJobProfileComplete` and the
 * profile is what the banner's promise ("founders reach out when your profile
 * matches an open role") actually rests on.
 *
 * The case for a role is that the person pressed Sign up on a *job board*, and
 * the shortest honest answer to that is a job. The profile is not skipped, only
 * deferred: pressing Apply from here lands on the profile step, which asks for
 * the same two answers with an application waiting on them.
 */
export function withPendingNewestRole(search: string): string {
  const params = new URLSearchParams(search);
  params.delete(PENDING_APPLY_PARAM);
  params.set(PENDING_NEWEST_PARAM, '1');
  return toSearch(params);
}

/**
 * The newest role the board is currently showing, across every team group.
 *
 * **`Date.parse`, not string comparison.** `getJobDate` falls back through three
 * fields (`postedDate ?? detectionDate ?? lastUpdated`) that are not guaranteed
 * to share a format, and comparing them as strings only happens to work while
 * they do. This is the same comparator the team profile's role list already
 * sorts with, so "newest" means one thing on both surfaces.
 *
 * An unparseable date sorts last rather than winning: `NaN` loses every
 * comparison, so a role with a broken date can never be picked over a role with
 * a good one — but a board of nothing but broken dates still yields its first
 * role instead of null, which is the right failure. Returns null only for a
 * genuinely empty board.
 *
 * Returns the role and its team rather than a `JobDetailTarget`, so this file
 * depends on the job types alone and the caller composes what its flow wants.
 */
export function pickNewestRole(groups: IJobTeamGroup[]): { role: IJobRole; team: IJobTeam } | null {
  let best: { role: IJobRole; team: IJobTeam } | null = null;
  let bestAt = -Infinity;

  for (const group of groups) {
    for (const role of group.roles) {
      const at = Date.parse(getJobDate(role));
      if (best === null || (!Number.isNaN(at) && at > bestAt)) {
        best = { role, team: group.team };
        bestAt = Number.isNaN(at) ? bestAt : at;
      }
    }
  }

  return best;
}

/**
 * Drop the resume parameters from the address bar once they have been acted
 * on, without a navigation — a one-time instruction must not replay on every
 * reload. `replaceState` rather than `router.replace` so the page underneath
 * doesn't re-render mid-flow.
 *
 * `prefillEmail` goes with them: it is written by the same round trip and read
 * before this runs, so leaving it behind only publishes an address.
 */
export function stripPendingApplyFromUrl(): void {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    const carried = [PENDING_APPLY_PARAM, PENDING_NEWEST_PARAM, PREFILL_EMAIL_PARAM];
    if (!carried.some((param) => url.searchParams.has(param))) return;
    carried.forEach((param) => url.searchParams.delete(param));
    const search = url.searchParams.toString();
    window.history.replaceState(window.history.state, '', `${url.pathname}${search ? `?${search}` : ''}${url.hash}`);
  } catch {
    // A URL we can't rewrite is not worth failing the resume over — the worst
    // case is a stale parameter, and the effect that reads it runs once.
  }
}

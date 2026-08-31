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
 * Banner / modal sign-up has no job. That path uses `completeProfile` instead,
 * so they land in the standalone profile drawer — the same one the
 * "Update your profile to apply" banner opens.
 */

export const PENDING_APPLY_PARAM = 'applyTo';
export const PENDING_PROFILE_PARAM = 'completeProfile';

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
  params.delete(PENDING_PROFILE_PARAM);
  if (roleUid) {
    params.set(PENDING_APPLY_PARAM, roleUid);
  } else {
    params.delete(PENDING_APPLY_PARAM);
  }
  return toSearch(params);
}

/**
 * After a job-less sign-up (the banner / header modal), land on the
 * standalone profile drawer instead of a plain board.
 */
export function withPendingProfile(search: string): string {
  const params = new URLSearchParams(search);
  params.delete(PENDING_APPLY_PARAM);
  params.set(PENDING_PROFILE_PARAM, '1');
  return toSearch(params);
}

/**
 * Drop the resume parameters from the address bar once they have been acted
 * on, without a navigation — a one-time instruction must not replay on every
 * reload. `replaceState` rather than `router.replace` so the board underneath
 * doesn't re-render mid-flow.
 */
export function stripPendingApplyFromUrl(): void {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has(PENDING_APPLY_PARAM) && !url.searchParams.has(PENDING_PROFILE_PARAM)) return;
    url.searchParams.delete(PENDING_APPLY_PARAM);
    url.searchParams.delete(PENDING_PROFILE_PARAM);
    const search = url.searchParams.toString();
    window.history.replaceState(window.history.state, '', `${url.pathname}${search ? `?${search}` : ''}${url.hash}`);
  } catch {
    // A URL we can't rewrite is not worth failing the resume over — the worst
    // case is a stale parameter, and the effect that reads it runs once.
  }
}

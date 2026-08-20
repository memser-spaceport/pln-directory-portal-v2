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
 */

export const PENDING_APPLY_PARAM = 'applyTo';

/** Add the pending role to a search string, preserving whatever else is on it
 *  (the filters someone narrowed before signing up should still be narrowed
 *  when they land back). */
export function withPendingApply(search: string, roleUid: string | undefined): string {
  const params = new URLSearchParams(search);
  if (roleUid) {
    params.set(PENDING_APPLY_PARAM, roleUid);
  }
  const next = params.toString();
  return next ? `?${next}` : '';
}

/**
 * Drop the parameter from the address bar once it has been acted on, without
 * a navigation — the resume is a one-time instruction, and leaving it in the
 * URL would replay it on every reload and follow the person into any link they
 * copy. `replaceState` rather than `router.replace` so the board underneath
 * doesn't re-render mid-flow.
 */
export function stripPendingApplyFromUrl(): void {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has(PENDING_APPLY_PARAM)) return;
    url.searchParams.delete(PENDING_APPLY_PARAM);
    const search = url.searchParams.toString();
    window.history.replaceState(
      window.history.state,
      '',
      `${url.pathname}${search ? `?${search}` : ''}${url.hash}`,
    );
  } catch {
    // A URL we can't rewrite is not worth failing the resume over — the worst
    // case is a stale parameter, and the effect that reads it runs once.
  }
}

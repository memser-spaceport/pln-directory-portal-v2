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
 * **Banner / modal sign-up has no job, and now carries no instruction either.**
 * It used to set `completeProfile`, landing the person in the standalone profile
 * drawer. Two different landings were tried there — that one, and the newest open
 * role — and both were wrong in the same way: nothing was interrupted, so there
 * is nothing to resume. Someone who pressed Sign up on a banner asked to have an
 * account, not to be handed a screen. They land on the board, signed in, and pick
 * their own way in.
 *
 * This file is for picking up a thread that *was* dropped. A door with no job
 * behind it never had one.
 */

export const PENDING_APPLY_PARAM = 'applyTo';

/**
 * The role someone pressed "I'm interested" on before they had an account.
 *
 * A second parameter rather than a reuse of `applyTo`, for two reasons that both
 * bite. They resume onto different steps — an application resumes wherever the
 * gate says, an interest always resumes on the reading step, because that is
 * where the banner it belongs to lives. And they have to be able to CLEAR
 * independently: a person who pressed Apply, backed out, then pressed "I'm
 * interested" means the second thing, and one parameter carrying both intents
 * cannot say so.
 *
 * **It resumes after signing IN as well as signing up, which `applyTo` does
 * not.** That asymmetry is deliberate. `applyTo` is for picking up an
 * interrupted application, and someone who merely signs in did not interrupt
 * one — having a drawer open itself at them is an interruption rather than a
 * continuation. A press of "I'm interested" is not an interruption: it is a
 * completed intent that needed an account to land, and it means the same thing
 * whichever door they took to get one.
 */
export const PENDING_INTEREST_PARAM = 'interestIn';

/**
 * Not ours to define — several flows write it — but it rides along with the one
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
 * Everything else on the search string is preserved: the filters someone
 * narrowed before signing up should still be narrowed when they land back.
 */
export function withPendingApply(search: string, roleUid: string | undefined): string {
  const params = new URLSearchParams(search);
  if (roleUid) {
    params.set(PENDING_APPLY_PARAM, roleUid);
  } else {
    params.delete(PENDING_APPLY_PARAM);
  }
  return toSearch(params);
}

/**
 * The same for the interest signal, and the removal half is load-bearing for the
 * same reason — more so, in fact.
 *
 * A stale `applyTo` reopens a drawer, which is merely wrong. A stale
 * `interestIn` would WRITE: someone who pressed the button, abandoned the Privy
 * modal, browsed on and signed in an hour later would silently signal interest
 * in a role they walked away from. So every door through `pushLogin` calls this,
 * and the ones that mean nothing pass no uid and thereby clear it.

 * The residual risk — a sign-in that never goes through `pushLogin` at all,
 * such as the navbar's — is answered by where the resume lands rather than by
 * this function: the person arrives on the confirmed banner with Undo under
 * their cursor. A visible, reversible write is a different thing from a silent
 * one.
 */
export function withPendingInterest(search: string, roleUid: string | undefined): string {
  const params = new URLSearchParams(search);
  if (roleUid) {
    params.set(PENDING_INTEREST_PARAM, roleUid);
  } else {
    params.delete(PENDING_INTEREST_PARAM);
  }
  return toSearch(params);
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
export function stripResumeParamsFromUrl(): void {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    const carried = [PENDING_APPLY_PARAM, PENDING_INTEREST_PARAM, PREFILL_EMAIL_PARAM];
    if (!carried.some((param) => url.searchParams.has(param))) return;
    carried.forEach((param) => url.searchParams.delete(param));
    const search = url.searchParams.toString();
    window.history.replaceState(window.history.state, '', `${url.pathname}${search ? `?${search}` : ''}${url.hash}`);
  } catch {
    // A URL we can't rewrite is not worth failing the resume over — the worst
    // case is a stale parameter, and the effect that reads it runs once.
  }
}

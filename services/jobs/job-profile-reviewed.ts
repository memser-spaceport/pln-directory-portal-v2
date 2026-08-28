/**
 * Whether this member has confirmed their profile with the apply flow's
 * "I've reviewed my profile" tick — remembered across visits, so it is asked
 * once rather than on every application.
 *
 * **Keyed by member uid, and that is not optional.** localStorage belongs to the
 * browser, not the account. One laptop can sign in as two people, and a bare
 * `reviewed: true` would hand the second of them a confirmation the first one
 * made about a different profile — which is exactly the claim this tick exists
 * to prevent anyone making on someone else's behalf. One record per uid, in a
 * single JSON object, the same shape `forumPostLikeStorage` uses for the same
 * kind of per-entity flag.
 *
 * **Best-effort by design.** Private browsing, a full quota or a blocked origin
 * all fail silently and leave the tick unremembered, which costs one click. A
 * throw here would take the whole apply flow down instead, so every path
 * swallows.
 *
 * **It does not survive signing in again.** `AuthInfo`, `PrivyModals` and
 * `BroadcastChannel` each call `localStorage.clear()` on the login round trip —
 * the same trap documented in `job-apply-resume.ts`, which is why the pending
 * role travels in the URL instead. Nothing here needs to survive that: a fresh
 * sign-in re-asking once is the honest outcome, and the alternative would be
 * fighting three call sites for a single click.
 */

const STORAGE_KEY = 'directory:jobProfileReviewed';

function readStore(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    /* A hand-edited or half-written entry must not become a confirmation.
       `JSON.parse('"true"')` is a string, `JSON.parse('[]')` is an array, and
       either would sail through a bare truthiness check on the lookup below. */
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

/** Whether this member has already confirmed. Anything that is not a stored
 *  `true` reads as "not yet", so a missing, corrupt or foreign entry asks. */
export function getJobProfileReviewed(memberUid: string | undefined): boolean {
  if (!memberUid) return false;
  return readStore()[memberUid] === true;
}

/**
 * Record the answer — including `false`, which is what unticking writes.
 *
 * The tick is asked once, not made permanent: someone who unticks is telling the
 * flow they no longer stand behind the profile, and a store that only ever
 * remembered `true` would keep answering for them on the next visit.
 */
export function setJobProfileReviewed(memberUid: string | undefined, reviewed: boolean): void {
  if (!memberUid || typeof window === 'undefined') return;

  try {
    const store = readStore();
    store[memberUid] = reviewed;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Unavailable (private browsing, quota) — the tick just isn't remembered.
  }
}

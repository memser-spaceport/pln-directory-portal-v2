'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useCurrentUserStore } from '@/services/auth/store';
import { useDismissUiFlag, useUiFlags } from '@/services/members/hooks/useUiFlags';
import { getUiFlag, setUiFlag } from '@/utils/uiFlags';

/**
 * The local (IndexedDB) key for a callout.
 *
 * Every callout that shipped before the flags moved server-side used
 * `${key}_dismissed_${uid}`, and this keeps writing exactly that, so the
 * upgrade write below can still find what a member dismissed months ago.
 *
 * The uid suffix stays on the *local* key — a shared browser must not leak one
 * member's dismissals to the next — even though the server key drops it,
 * because there the uid is in the URL path.
 */
const localKeyFor = (key: string, uid?: string) => `${key}_dismissed_${uid ?? 'anon'}`;

type Answer = boolean | 'pending' | 'unavailable';

interface OneTimeCallout {
  /** Whether the callout should currently be on screen. */
  open: boolean;
  /** Records the dismissal locally and, for a signed-in member, server-side. */
  dismiss: () => void;
}

/**
 * "Show this callout once per member" — across devices, and across a cleared
 * cache.
 *
 * The record lives on the member row (`GET`/`PATCH /v1/members/:uid/ui-flags`)
 * with IndexedDB kept in front of it as a local cache. That split is what makes
 * the common path free: a member who dismissed the tip last week gets an
 * instant, network-free "no" on every subsequent page load.
 *
 * ## Why it waits
 *
 * The subtle half is what happens when the *local* answer is "not dismissed".
 * Opening on that alone would be local-first in the naive sense, and it would
 * flash: a member who dismissed the callout on their laptop opens their phone,
 * sees the tip appear, then sees it vanish when the server answer lands. So:
 *
 * - local says dismissed  → closed immediately, no network wait
 * - local says otherwise  → **wait for the server** before opening
 * - server errored, or signed out → fall back to the local answer
 *
 * The wait costs a signed-in member on a genuinely new device one round trip
 * before a tooltip they have never seen appears, which is not a cost worth
 * flashing to avoid.
 *
 * ## Reconciliation
 *
 * Both directions resolve to "dismissed wins", so a flag can never be cleared
 * from the UI. That is deliberate; QA resets one with
 * `UPDATE "Member" SET "uiFlags" = "uiFlags" - 'help_callout' WHERE uid = '…';`
 *
 * The upgrade write (local dismissed, server not) is what carries members over
 * the cutover so nobody sees a callout twice — and it doubles as the retry for
 * a dismissal whose PATCH failed, since that leaves exactly the same state.
 * It can be deleted once every active member has been seen post-cutover;
 * after that, local is a pure cache. Target: 2026-12.
 *
 * @param key - The server-side callout key, e.g. `help_callout`.
 */
export function useOneTimeCallout(key: string): OneTimeCallout {
  const { currentUser, isHydrated } = useCurrentUserStore();
  const uid = currentUser?.uid;

  // `currentUser` is `null` before the store hydrates, which is NOT the same as
  // signed out. Reading either answer early would tell a signed-in member they
  // are anonymous: the local read would use the `_anon` key and the server read
  // would be skipped entirely.
  const { data: serverFlags, isError } = useUiFlags(isHydrated ? uid : undefined);
  const { mutate: pushFlag } = useDismissUiFlag();

  const [localAnswer, setLocalAnswer] = useState<Answer>('pending');
  const [dismissedHere, setDismissedHere] = useState(false);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    let cancelled = false;
    getUiFlag(localKeyFor(key, uid)).then((dismissed) => {
      if (!cancelled) {
        setLocalAnswer(dismissed);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isHydrated, key, uid]);

  let serverAnswer: Answer = 'pending';
  if (!isHydrated) {
    serverAnswer = 'pending';
  } else if (!uid || isError) {
    // Signed out, or the flags call failed: there is no server truth to defer
    // to, so the local answer stands on its own.
    serverAnswer = 'unavailable';
  } else if (serverFlags) {
    serverAnswer = !!serverFlags[key];
  }

  // Upgrade write: dismissed on this browser but not yet on the member's
  // record. Fires once per member per callout — the ref, not the mutation's own
  // state, is what stops a re-render mid-flight from sending it twice.
  const upgradedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!uid || localAnswer !== true || serverAnswer !== false) {
      return;
    }
    const token = `${uid}:${key}`;
    if (upgradedRef.current === token) {
      return;
    }
    upgradedRef.current = token;
    pushFlag({ uid, keys: [key] });
  }, [key, localAnswer, pushFlag, serverAnswer, uid]);

  // Write-down: dismissed on another device. Caching it locally is what makes
  // every later load on *this* device free of the wait described above.
  useEffect(() => {
    if (localAnswer === false && serverAnswer === true) {
      void setUiFlag(localKeyFor(key, uid));
    }
  }, [key, localAnswer, serverAnswer, uid]);

  const dismiss = useCallback(() => {
    setDismissedHere(true);
    // Local first and unconditionally: this is the write that must not fail,
    // and it is the one that works signed out.
    void setUiFlag(localKeyFor(key, uid));
    if (uid) {
      // No error handling on purpose. A dismissal must never raise a toast; if
      // this never lands, the upgrade write above re-sends it next visit.
      pushFlag({ uid, keys: [key] });
    }
  }, [key, pushFlag, uid]);

  const open = !dismissedHere && localAnswer === false && (serverAnswer === false || serverAnswer === 'unavailable');

  return { open, dismiss };
}

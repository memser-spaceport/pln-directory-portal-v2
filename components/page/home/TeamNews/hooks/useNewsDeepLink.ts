'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const NEWS_PARAM = 'news';

/** Owns the ?news=<uid> ↔ modal-state sync for the /home Team News feed.
 *
 *  All URL writes go through window.history.replaceState, NOT router.replace:
 *  - replaceState is synchronous, so anything reading location.search right
 *    after an open (the anonymous #login gate) sees the param immediately;
 *  - router.replace with changed search params is a real navigation — it
 *    refetches the whole dynamic /home RSC payload (7 backend calls) on every
 *    modal open/close and can swap the groups prop mid-session. Next syncs
 *    useSearchParams with native history calls (SPA guide, ≥14.1), so nothing
 *    is lost. Same idiom as ContactSupportUrlSync.
 *
 *  History model: replace-only on open and close — Back never toggles the
 *  modal, it leaves the page. Deliberate (a URL-derived open would silently
 *  reopen on Back after a deep-linked visit).
 */
export function useNewsDeepLink({ isValidUid }: { isValidUid: (uid: string) => boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Mount-time read (setter-less lazy init — this file's established idiom):
  // a valid param opens the modal on first render; post-login reloads re-enter
  // here, which is what makes the guest Like round-trip work.
  const [activeNewsUid, setActiveNewsUid] = useState<string | null>(() => {
    const uid = searchParams.get(NEWS_PARAM);
    return uid && isValidUid(uid) ? uid : null;
  });
  const [openedViaDeepLink] = useState<boolean>(() => activeNewsUid !== null);

  const writeUrl = useCallback(
    (uid: string | null) => {
      // Copy the LIVE params (not the mount-time snapshot) and touch only
      // `news` — shared links carry utm_* etc. that must survive open/close.
      const params = new URLSearchParams(window.location.search);
      if (uid === null) params.delete(NEWS_PARAM);
      else params.set(NEWS_PARAM, uid);
      const qs = params.toString();
      window.history.replaceState(null, '', `${pathname || '/home'}${qs ? `?${qs}` : ''}`);
    },
    [pathname],
  );

  const openNews = useCallback(
    (uid: string) => {
      setActiveNewsUid(uid);
      writeUrl(uid);
    },
    [writeUrl],
  );

  const closeNews = useCallback(() => {
    setActiveNewsUid(null);
    writeUrl(null);
  }, [writeUrl]);

  // One-shot strip of an unresolvable param (expired/unknown uid, or an empty
  // feed): no error UI, just a clean URL. The decision is captured at mount via
  // a setter-less useState (never re-evaluated, so it can't race the close
  // path's own URL write), and the effect's deps are all identity-stable.
  // StrictMode double-invocation is idempotent.
  const [needsStrip] = useState<boolean>(() => {
    const uid = searchParams.get(NEWS_PARAM);
    return Boolean(uid && !isValidUid(uid));
  });
  useEffect(() => {
    if (needsStrip) writeUrl(null);
  }, [needsStrip, writeUrl]);

  return { activeNewsUid, openNews, closeNews, openedViaDeepLink };
}

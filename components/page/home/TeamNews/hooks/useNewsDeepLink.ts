'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

import { FEED_COMMENT_PARAM } from '../utils/feedCommentAnchor';

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
 *  History model: card open/close still use replaceState so Back leaves the
 *  page rather than toggling the modal. Notification soft-nav uses Link push
 *  (`/home` → `/home?news=…`); we sync live `?news=` so that mid-session click
 *  opens the modal without a reload (LAB-2281). Back after a push then clears
 *  the param and closes the modal.
 *
 *  Notification deep links may also carry ?comment=<uid>; closing the modal
 *  or opening a story from a card clears that param so a prior anchor does
 *  not re-scroll. External soft-nav does not rewrite the URL, so `?comment=`
 *  survives for scroll/highlight.
 */
export function useNewsDeepLink({ isValidUid }: { isValidUid: (uid: string) => boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const newsParam = searchParams.get(NEWS_PARAM);

  // Mount-time read: a valid param opens the modal on first render; post-login
  // reloads re-enter here, which is what makes the guest Like round-trip work.
  const [activeNewsUid, setActiveNewsUid] = useState<string | null>(() => {
    return newsParam && isValidUid(newsParam) ? newsParam : null;
  });
  const [openedViaDeepLink, setOpenedViaDeepLink] = useState<boolean>(() => activeNewsUid !== null);

  const writeUrl = useCallback(
    (uid: string | null) => {
      // Copy the LIVE params and touch only `news` / `comment` — shared links
      // carry utm_* etc. that must survive open/close.
      const params = new URLSearchParams(window.location.search);
      if (uid === null) {
        params.delete(NEWS_PARAM);
        params.delete(FEED_COMMENT_PARAM);
      } else {
        params.set(NEWS_PARAM, uid);
        // Card / in-feed opens are not notification anchors — drop a leftover
        // ?comment= so the modal does not scroll to a stale row.
        params.delete(FEED_COMMENT_PARAM);
      }
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

  // Soft-nav / reload sync: notification Link while already on /home updates
  // searchParams without remounting TeamNews. Card openNews sets state before
  // writeUrl, so the matching-uid branch is a no-op (not marked deep-link).
  useEffect(() => {
    if (newsParam && isValidUid(newsParam)) {
      if (activeNewsUid !== newsParam) {
        setActiveNewsUid(newsParam);
        setOpenedViaDeepLink(true);
      }
      return;
    }
    if (!newsParam && activeNewsUid) {
      setActiveNewsUid(null);
      return;
    }
    if (newsParam && !isValidUid(newsParam)) {
      writeUrl(null);
    }
  }, [newsParam, isValidUid, activeNewsUid, writeUrl]);

  return { activeNewsUid, openNews, closeNews, openedViaDeepLink };
}

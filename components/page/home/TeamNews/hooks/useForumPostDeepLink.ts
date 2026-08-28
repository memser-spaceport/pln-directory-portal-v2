'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

import type { IFeedForumPost } from '@/types/feed.types';
import { isForumPostUid } from '@/types/feed.types';
import { useWriteUrl } from '@/components/page/home/TeamNews/hooks/useWriteUrl';

export const POST_PARAM = 'post';
const NEWS_PARAM = 'news';

/** Owns the ?post=<uid> ↔ forum-post-modal sync for the /home feed.
 *
 *  A separate hook from useNewsDeepLink on purpose: news validates its param
 *  synchronously at mount against SSR data, but forum posts arrive only after
 *  store hydration → access query → posts query, so this resolver is
 *  three-valued — pending (hold the param), valid (open), invalid (strip once,
 *  silently). "Silently" is deliberate for signed-out/no-access viewers: the
 *  content is hidden; don't reveal it exists. The uid is never reflected into
 *  the DOM while pending, and no analytics event carries a uid that failed the
 *  gate (onDeepLinkOpen only fires for a post the viewer can see).
 *
 *  Shape: the deep-link open is DERIVED during render (a valid uid + loaded
 *  posts ⇒ open) and any user action latches a manual override that wins from
 *  then on — effects below only talk to external systems (URL, analytics),
 *  never setState for the derived open. The manual latch is also what defuses
 *  the async-strip race: a slow "invalid" verdict can never strip the param of
 *  a post the user opened themselves in the meantime.
 *
 *  `?post=` is read live from searchParams (not mount-only) so a notification
 *  or share Link soft-nav while already on /home opens the modal without a
 *  reload (LAB-2281). After closePost(), clearing the close latch when the URL
 *  gains a post again lets deep-link resolution resume.
 *
 *  URL writes are history.replaceState only — same rationale and replace-only
 *  history model as useNewsDeepLink (router.replace would refetch the whole
 *  /home RSC payload). Each hook owns exactly its own param; mutual exclusion
 *  with ?news= is coordinated by TeamNews (openPost closes news and vice
 *  versa), except the both-params case which is resolved here: news wins, post
 *  strips.
 */
export function useForumPostDeepLink({
  posts,
  isSettled,
  onDeepLinkOpen,
}: {
  /** Access-gated posts from useFeedSocial — undefined until loaded/allowed. */
  posts: IFeedForumPost[] | undefined;
  /** From useFeedSocial.deepLinkSettled — strip decisions are only safe then. */
  isSettled: boolean;
  /** Deep-link opens have no click to ride on — reported here, once. */
  onDeepLinkOpen?: (post: IFeedForumPost) => void;
}) {
  const writeUrlUtil = useWriteUrl();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const requestedUid = searchParams.get(POST_PARAM);
  const newsWins = Boolean(searchParams.get(NEWS_PARAM));

  // The user's explicit open/close — once set, it overrides the deep-link
  // resolution until cleared (close latch, or a new external ?post=).
  const [manualUid, setManualUid] = useState<{ uid: string | null } | null>(null);

  const deepLinkEligible = Boolean(requestedUid) && !newsWins && isForumPostUid(requestedUid ?? '');
  const deepLinkPost = useMemo(
    () => (deepLinkEligible ? (posts?.find((p) => p.uid === requestedUid) ?? null) : null),
    [deepLinkEligible, posts, requestedUid],
  );

  const activePostUid = manualUid ? manualUid.uid : (deepLinkPost?.uid ?? null);

  const writeUrl = useCallback(
    (uid: string | null) => {
      writeUrlUtil(POST_PARAM, uid);
    },
    [pathname],
  );

  const openPost = useCallback(
    (uid: string) => {
      setManualUid({ uid });
      writeUrl(uid);
    },
    [writeUrl],
  );

  const closePost = useCallback(() => {
    setManualUid({ uid: null });
    writeUrl(null);
  }, [writeUrl]);

  // Soft-nav after close: URL gains/changes ?post= while the close latch is
  // held — drop the latch so deep-link resolution can open again. Own openPost
  // writes the same uid we already latched; leave that alone.
  const trackedUidRef = useRef<string | null>(null);
  useEffect(() => {
    if (!requestedUid) return;
    setManualUid((m) => {
      if (m === null) return null;
      if (m.uid === requestedUid) return m;
      return null;
    });
    if (trackedUidRef.current !== requestedUid) {
      trackedUidRef.current = null;
    }
  }, [requestedUid]);

  // Report the deep-link open once per adopted uid (may be seconds after the
  // URL appears — never the mount-time ref-guard idiom the news modal uses).
  const trackedRef = useRef(false);
  useEffect(() => {
    if (!deepLinkPost || manualUid) return;
    if (trackedRef.current && trackedUidRef.current === deepLinkPost.uid) return;
    trackedRef.current = true;
    trackedUidRef.current = deepLinkPost.uid;
    onDeepLinkOpen?.(deepLinkPost);
  }, [deepLinkPost, manualUid, onDeepLinkOpen]);

  // Strip an unresolvable param: malformed uid or news-wins strip immediately;
  // an unknown/hidden uid only once every async gate has settled (stripping
  // earlier would eat valid links mid-load). Fire-time re-validation: only
  // strip if the param still holds the requested uid and the user hasn't taken
  // over — their writes own the URL from then on.
  // Reset the one-shot strip guard when the requested uid changes so a later
  // soft-nav to another invalid id can still clean up.
  const strippedForRef = useRef<string | null>(null);
  useEffect(() => {
    if (!requestedUid || manualUid || deepLinkPost) return;
    if (strippedForRef.current === requestedUid) return;
    const conclusivelyInvalid = newsWins || !isForumPostUid(requestedUid) || isSettled;
    if (!conclusivelyInvalid) return;
    strippedForRef.current = requestedUid;
    const current = new URLSearchParams(window.location.search).get(POST_PARAM);
    if (current === requestedUid) writeUrl(null);
  }, [requestedUid, newsWins, manualUid, deepLinkPost, isSettled, writeUrl]);

  return { activePostUid, openPost, closePost };
}

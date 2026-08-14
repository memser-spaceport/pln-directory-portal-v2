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
 *  never setState. The manual latch is also what defuses the async-strip race:
 *  a slow "invalid" verdict can never strip the param of a post the user
 *  opened themselves in the meantime.
 *
 *  URL writes are history.replaceState only — same rationale and replace-only
 *  history model as useNewsDeepLink (router.replace would refetch the whole
 *  /home RSC payload). Each hook owns exactly its own param; mutual exclusion
 *  with ?news= is coordinated by TeamNews (openPost closes news and vice
 *  versa), except the mount-time both-params case which is resolved here:
 *  news wins, post strips.
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

  // Mount-time capture (setter-less, the file's established idiom). If the URL
  // carries both ?news= and ?post= (mangled share), news wins — the news modal
  // opens synchronously from SSR data, so this resolver stands down and strips
  // its param below.
  const [requestedUid] = useState<string | null>(() => searchParams.get(POST_PARAM));
  const [newsWinsAtMount] = useState<boolean>(() => Boolean(searchParams.get(NEWS_PARAM)));

  // The user's explicit open/close — once set, it overrides the deep-link
  // resolution for the rest of the session (the one-shot latch).
  const [manualUid, setManualUid] = useState<{ uid: string | null } | null>(null);

  const deepLinkEligible = Boolean(requestedUid) && !newsWinsAtMount && isForumPostUid(requestedUid ?? '');
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

  // Report the deep-link open once, when it actually happens (may be seconds
  // after mount — never the mount-time ref-guard idiom the news modal uses).
  const trackedRef = useRef(false);
  useEffect(() => {
    if (trackedRef.current || manualUid || !deepLinkPost) return;
    trackedRef.current = true;
    onDeepLinkOpen?.(deepLinkPost);
  }, [deepLinkPost, manualUid, onDeepLinkOpen]);

  // One-shot strip of an unresolvable param: malformed uid or news-wins strip
  // immediately; an unknown/hidden uid only once every async gate has settled
  // (stripping earlier would eat valid links mid-load). Fire-time
  // re-validation: only strip if the param still holds the mount-time uid and
  // the user hasn't taken over — their writes own the URL from then on.
  const strippedRef = useRef(false);
  useEffect(() => {
    if (strippedRef.current || !requestedUid || manualUid || deepLinkPost) return;
    const conclusivelyInvalid = newsWinsAtMount || !isForumPostUid(requestedUid) || isSettled;
    if (!conclusivelyInvalid) return;
    strippedRef.current = true;
    const current = new URLSearchParams(window.location.search).get(POST_PARAM);
    if (current === requestedUid) writeUrl(null);
  }, [requestedUid, newsWinsAtMount, manualUid, deepLinkPost, isSettled, writeUrl]);

  return { activePostUid, openPost, closePost };
}

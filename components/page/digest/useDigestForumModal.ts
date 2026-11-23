'use client';

import { useCallback, useMemo, useState } from 'react';

import { useTeamNewsAnalytics } from '@/analytics/team-news.analytics';
import { isOwnForumPost } from '@/components/page/home/TeamNews/utils/isOwnForumPost';
import { resolveForumPostLike } from '@/components/page/home/TeamNews/utils/resolveForumPostLike';
import { useForumAccess } from '@/services/access-control/hooks/useForumAccess';
import { useCurrentUserStore } from '@/services/auth/store';
import { useFeedForumTopicLike } from '@/services/feed/hooks/useFeedComments';
import { useFeedForumPostLikeToggle } from '@/services/feed/hooks/useFeedForumPostLikeToggle';
import { useFeedForumPosts } from '@/services/feed/hooks/useFeedForumPosts';
import type { IFeedForumPost, IFeedForumPostLikeStatus } from '@/types/feed.types';
import { setStoredForumPostLike } from '@/utils/forumPostLikeStorage';

/**
 * Home's forum post modal on the digest page (LAB-3293). A thread opens in it only for a signed-in member with forum
 * access whose feed has the thread (Home's own forum post list, the recent topics); otherwise the row links to the
 * forum. Likes follow Home's rules: an overlay on top of the list, corrected by the opened topic's own vote state,
 * remembered in the local like store, rolled back on failure.
 */
export function useDigestForumModal(signedIn: boolean | undefined) {
  const { currentUser } = useCurrentUserStore();
  const { hasAccess, isLoading: accessLoading } = useForumAccess();
  const { data, isError } = useFeedForumPosts({ enabled: signedIn === true });
  const analytics = useTeamNewsAnalytics();
  const { mutate: likeMutate } = useFeedForumPostLikeToggle();

  const [openUid, setOpenUid] = useState<string | null>(null);
  const [likeOverlay, setLikeOverlay] = useState<Map<string, IFeedForumPostLikeStatus>>(() => new Map());
  const topicLike = useFeedForumTopicLike(openUid);

  // The global jest mock of useQuery hands back a stub, and the wire data carries no runtime guarantees either.
  const byTid = useMemo(() => {
    const items = signedIn === true && hasAccess && Array.isArray(data?.items) ? data.items : [];
    return new Map(items.map((post) => [post.tid, post]));
  }, [signedIn, hasAccess, data]);

  const openPost = useMemo(() => {
    if (!openUid) return null;
    const post = [...byTid.values()].find((item) => item.uid === openUid);
    return post ? resolveForumPostLike(post, topicLike, likeOverlay.get(post.uid)) : null;
  }, [openUid, byTid, topicLike, likeOverlay]);

  const toggleLike = useCallback(
    (post: IFeedForumPost) => {
      if (isOwnForumPost(post, currentUser?.uid)) return;
      const wasLiked = post.viewerHasLiked;
      const prevCount = post.likeCount;
      const nextLiked = !wasLiked;
      const nextCount = wasLiked ? Math.max(0, prevCount - 1) : prevCount + 1;
      const position = [...byTid.values()].findIndex((item) => item.uid === post.uid);

      setLikeOverlay((prev) => new Map(prev).set(post.uid, { viewerHasLiked: nextLiked, likeCount: nextCount }));
      setStoredForumPostLike(post.uid, nextLiked);
      likeMutate(
        { post, isLiked: nextLiked },
        {
          onError: () => {
            setLikeOverlay((prev) => new Map(prev).set(post.uid, { viewerHasLiked: wasLiked, likeCount: prevCount }));
            setStoredForumPostLike(post.uid, wasLiked);
            analytics.onFeedForumPostLikeFailed(post, position, nextLiked, 'digest');
          },
          onSuccess: (status) => {
            if (status) {
              setLikeOverlay((prev) => new Map(prev).set(post.uid, status));
              setStoredForumPostLike(post.uid, status.viewerHasLiked);
            }
            analytics.onFeedForumPostLikeToggled(post, position, nextLiked, 'digest');
          },
        },
      );
    },
    [currentUser?.uid, byTid, likeMutate, analytics],
  );

  return {
    /**
     * Signed in, and it's known which threads open in the modal (forum access read, and the feed loaded or failed).
     * Until then `feedPostFor` can't tell a thread missing from the feed from a feed still loading.
     */
    settled: signedIn === true && !accessLoading && (!hasAccess || data !== undefined || isError),
    /** The thread's feed post when it can open in the modal, else undefined (the row links to the forum). */
    feedPostFor: (tid: number) => byTid.get(tid),
    open: (post: IFeedForumPost) => setOpenUid(post.uid),
    close: () => setOpenUid(null),
    openPost,
    isOwnPost: openPost ? isOwnForumPost(openPost, currentUser?.uid) : false,
    toggleLike,
  };
}

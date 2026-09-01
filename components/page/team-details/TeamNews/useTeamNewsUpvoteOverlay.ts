'use client';

import { useCallback, useState } from 'react';

import { useTeamNewsAnalytics, type TeamNewsAnalyticsSource } from '@/analytics/team-news.analytics';
import { useTeamNewsUpvoteToggle } from '@/services/team-news/hooks/useTeamNewsUpvoteToggle';
import type { ITeamNewsItem } from '@/types/team-news.types';

import type { TeamNewsUpvoteOverlay } from './teamNewsUpvoteOverlay';

/**
 * Owns "the viewer voted on this story" for one surface: the optimistic overlay
 * plus the request that makes it true, reconciled against the server's own
 * count on the way back and rolled back on failure.
 *
 * A hook rather than a copy per surface because a Like has to work the same
 * wherever the story is read — the rail and its archive share one instance so a
 * vote cast in either shows in both, and a listing that opens the archive on its
 * own (the teams grid, the job board) gets its own.
 *
 * Assumes a signed-in caller: the auth check and login redirect happen in
 * NewsCard, before this handler is ever reached.
 */
export function useTeamNewsUpvoteOverlay() {
  const { onTeamNewsUpvoteToggled, onTeamNewsUpvoteFailed } = useTeamNewsAnalytics();
  const { mutate: upvoteMutate } = useTeamNewsUpvoteToggle();
  const [upvoteOverlay, setUpvoteOverlay] = useState<TeamNewsUpvoteOverlay>(() => new Map());

  const handleUpvoteToggle = useCallback(
    (item: ITeamNewsItem, position: number, source: TeamNewsAnalyticsSource) => {
      const wasUpvoted = Boolean(item.viewerHasUpvoted);
      const nextUpvoted = !wasUpvoted;
      const prevCount = item.upvoteCount ?? 0;
      const nextCount = wasUpvoted ? Math.max(0, prevCount - 1) : prevCount + 1;

      setUpvoteOverlay((prev) => {
        const next = new Map(prev);
        next.set(item.uid, { viewerHasUpvoted: nextUpvoted, upvoteCount: nextCount });
        return next;
      });

      upvoteMutate(
        { uid: item.uid, isUpvoted: nextUpvoted },
        {
          onError: () => {
            setUpvoteOverlay((prev) => {
              const next = new Map(prev);
              next.set(item.uid, { viewerHasUpvoted: wasUpvoted, upvoteCount: prevCount });
              return next;
            });
            // The other half of the funnel — without it the failure rate reads
            // 0% for whichever surface forgot to report it, while the success
            // event covers them all.
            onTeamNewsUpvoteFailed(item, position, nextUpvoted, source);
          },
          onSuccess: (status) => {
            // Reconcile with the server's authoritative count/state (e.g.
            // concurrent votes from others), when available.
            if (status) {
              setUpvoteOverlay((prev) => {
                const next = new Map(prev);
                next.set(item.uid, { viewerHasUpvoted: status.viewerHasUpvoted, upvoteCount: status.upvoteCount });
                return next;
              });
            }
            onTeamNewsUpvoteToggled(item, position, nextUpvoted, source);
          },
        },
      );
    },
    [onTeamNewsUpvoteToggled, onTeamNewsUpvoteFailed, upvoteMutate],
  );

  return { upvoteOverlay, handleUpvoteToggle };
}

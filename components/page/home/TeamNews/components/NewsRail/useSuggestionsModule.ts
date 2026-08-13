import { useEffect, useMemo, useRef, useState } from 'react';

import { useTeamNewsAnalytics } from '@/analytics/team-news.analytics';
import type { ISuggestedTeam } from '@/types/team-news.types';

const FOLLOW_CONFIRM_MS = 2000;

/** After follow, keep the row visible with a Following checkmark for
 * FOLLOW_CONFIRM_MS, then drop it so AnimatePresence can play the card exit.
 * Teams already followed when they first appear are hidden immediately. */
export function useDelayedHideFollowedSuggestions(suggestions: ISuggestedTeam[], followedTeamUids: Set<string>) {
  const [hiddenUids, setHiddenUids] = useState<Set<string>>(() => new Set());
  const pendingTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const scheduledUidsRef = useRef<Set<string>>(new Set());
  const seenUnfollowedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    return () => {
      pendingTimersRef.current.forEach((timer) => clearTimeout(timer));
      pendingTimersRef.current.clear();
      scheduledUidsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    for (const team of suggestions) {
      const isFollowed = followedTeamUids.has(team.uid);

      if (!isFollowed) {
        seenUnfollowedRef.current.add(team.uid);
        const timer = pendingTimersRef.current.get(team.uid);
        if (timer) {
          clearTimeout(timer);
          pendingTimersRef.current.delete(team.uid);
        }
        scheduledUidsRef.current.delete(team.uid);
        if (hiddenUids.has(team.uid)) {
          setHiddenUids((prev) => {
            if (!prev.has(team.uid)) return prev;
            const next = new Set(prev);
            next.delete(team.uid);
            return next;
          });
        }
        continue;
      }

      if (hiddenUids.has(team.uid) || scheduledUidsRef.current.has(team.uid)) continue;

      // Already followed when first seen — hide without the confirm delay.
      if (!seenUnfollowedRef.current.has(team.uid)) {
        setHiddenUids((prev) => {
          const next = new Set(prev);
          next.add(team.uid);
          return next;
        });
        continue;
      }

      scheduledUidsRef.current.add(team.uid);
      pendingTimersRef.current.set(
        team.uid,
        setTimeout(() => {
          pendingTimersRef.current.delete(team.uid);
          setHiddenUids((prev) => {
            const next = new Set(prev);
            next.add(team.uid);
            return next;
          });
        }, FOLLOW_CONFIRM_MS),
      );
    }
  }, [suggestions, followedTeamUids, hiddenUids]);

  return useMemo(() => {
    return suggestions.filter((team) => {
      if (hiddenUids.has(team.uid)) return false;
      // Already followed on first sight — hide immediately (no confirm flash).
      if (
        followedTeamUids.has(team.uid) &&
        !seenUnfollowedRef.current.has(team.uid) &&
        !scheduledUidsRef.current.has(team.uid)
      ) {
        return false;
      }
      return true;
    });
  }, [suggestions, hiddenUids, followedTeamUids]);
}
/**
 * Fire-once view events for the two modules that now render on two surfaces —
 * the rail card above 1200px, the horizontal scroller below it.
 *
 * Lifted out of NewsRail deliberately. These effects used to sit next to the
 * cards, which was fine while the rail was the only place they could appear;
 * with a second surface that would either double-fire (if both mounted) or fire
 * only on desktop (if only the rail kept them). Living in the parent, which
 * mounts exactly one surface, the count stays one per session either way.
 *
 * `onTeamsToFollowHidden` is the completion of the follow funnel — the member
 * followed every suggestion — so it fires on the transition to zero, not on the
 * loading state that precedes the first render.
 */
export function useFeedModulesViewAnalytics({
  suggestionsShown,
  isLoadingSuggestedTeams,
  popularCount,
}: {
  suggestionsShown: number;
  isLoadingSuggestedTeams: boolean;
  popularCount: number;
}) {
  const teamNewsAnalytics = useTeamNewsAnalytics();

  const wasShownRef = useRef(false);
  useEffect(() => {
    if (suggestionsShown > 0 && !wasShownRef.current) {
      wasShownRef.current = true;
      teamNewsAnalytics.onTeamsToFollowViewed(suggestionsShown);
    } else if (suggestionsShown === 0 && wasShownRef.current && !isLoadingSuggestedTeams) {
      wasShownRef.current = false;
      teamNewsAnalytics.onTeamsToFollowHidden();
    }
  }, [suggestionsShown, isLoadingSuggestedTeams, teamNewsAnalytics]);

  // Popular's click-through had a numerator and no denominator.
  const popularShownRef = useRef(false);
  useEffect(() => {
    if (popularCount === 0 || popularShownRef.current) return;
    popularShownRef.current = true;
    teamNewsAnalytics.onPopularCardViewed(popularCount);
  }, [popularCount, teamNewsAnalytics]);
}

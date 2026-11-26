'use client';

import { useState } from 'react';

import { useFollowAnalytics } from '@/analytics/follow.analytics';
import { useFollowTeam } from '@/services/follow/hooks/useFollowTeam';

import type { DigestStory } from '../digest.types';

/**
 * Follow on the digest page's team headers (LAB-3287). One state per team, so two stories from the same team agree.
 * It starts from the link member's follows; a press acts for the signed-in member, optimistically, and reverts when
 * the save fails. Signed-out readers get sign-in instead (the caller decides that).
 */
export function useDigestFollows(stories: DigestStory[]) {
  const [following, setFollowing] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(stories.map((story) => [story.teamUid, story.followsTeam])),
  );
  const { mutate } = useFollowTeam();
  const analytics = useFollowAnalytics();

  const act = (teamUid: string, teamName: string, action: 'follow' | 'unfollow') => {
    const was = Boolean(following[teamUid]);
    const set = (value: boolean) => setFollowing((current) => ({ ...current, [teamUid]: value }));
    set(!was);
    mutate(
      { teamUid, action },
      {
        onSuccess: (state) => {
          // followTeam / unfollowTeam return null on a non-OK response instead of throwing.
          if (!state) return set(was);
          set(state.following);
          const event = { teamUid, teamName, source: 'digest' as const };
          if (action === 'follow') analytics.onTeamFollowed(event);
          else analytics.onTeamUnfollowed(event);
        },
        onError: () => {
          set(was);
          analytics.onTeamFollowFailed({ teamUid, teamName, source: 'digest', action });
        },
      },
    );
  };

  return {
    isFollowing: (teamUid: string) => Boolean(following[teamUid]),
    toggle: (teamUid: string, teamName: string) => act(teamUid, teamName, following[teamUid] ? 'unfollow' : 'follow'),
    // A Follow pressed before sign-in (LAB-3347), finished on the way back. Always a follow: the state here started
    // signed out, so it can't tell whether the member already follows the team, and a toggle could unfollow it.
    follow: (teamUid: string, teamName: string) => act(teamUid, teamName, 'follow'),
  };
}

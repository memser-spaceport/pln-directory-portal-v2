import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { ITeam } from '@/types/teams.types';
import { useCurrentUserStore } from '@/services/auth/store';
import { useFollowAnalytics } from '@/analytics/follow.analytics';

import { useFollowTeam } from './useFollowTeam';

export function useTeamFollowToggle(team: ITeam, initialIsFollowed: boolean) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowed);
  const prevIsFollowingRef = useRef(initialIsFollowed);

  const { currentUser } = useCurrentUserStore();
  const router = useRouter();
  const { mutate, isPending } = useFollowTeam();
  const { onTeamFollowed, onTeamUnfollowed } = useFollowAnalytics();

  const handleToggle = () => {
    if (!currentUser) {
      router.push('#login');
      return;
    }

    const willFollow = !isFollowing;
    prevIsFollowingRef.current = isFollowing;
    setIsFollowing(willFollow);

    mutate(
      { teamUid: team.id, action: willFollow ? 'follow' : 'unfollow' },
      {
        onSuccess: (data) => {
          if (data) {
            setIsFollowing(data.following);
            if (willFollow) {
              onTeamFollowed({ teamUid: team.id, teamName: team.name ?? '', source: 'team-profile' });
            } else {
              onTeamUnfollowed({ teamUid: team.id, teamName: team.name ?? '', source: 'team-profile' });
            }
          } else {
            setIsFollowing(prevIsFollowingRef.current);
          }
        },
        onError: () => {
          setIsFollowing(prevIsFollowingRef.current);
        },
      },
    );
  };

  return { isFollowing, isPending, handleToggle };
}

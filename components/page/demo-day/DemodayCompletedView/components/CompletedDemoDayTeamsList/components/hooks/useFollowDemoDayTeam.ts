import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import { DemoDayTeam } from '@/app/actions/demo-day.actions';
import { useDemoDayAnalytics } from '@/analytics/demoday.analytics';
import { useFollowTeam } from '@/services/follow/hooks/useFollowTeam';

export function useFollowDemoDayTeam(team: DemoDayTeam) {
  const router = useRouter();
  const { mutate, isPending } = useFollowTeam();
  const { onCompletedViewTeamFollowed, onCompletedViewTeamUnfollowed } = useDemoDayAnalytics();
  const [optimisticIsFollowing, setOptimisticIsFollowing] = useState(team.isFollowing);

  const toggleFollow = useCallback(() => {
    const willFollow = !optimisticIsFollowing;

    mutate(
      { teamUid: team.uid, action: willFollow ? 'follow' : 'unfollow' },
      {
        onSuccess: () => {
          setOptimisticIsFollowing(willFollow);
          const params = { teamUid: team.uid, teamName: team.name };
          if (willFollow) {
            onCompletedViewTeamFollowed(params);
          } else {
            onCompletedViewTeamUnfollowed(params);
          }
        },
        onSettled: () => {
          router.refresh();
        },
      },
    );
  }, [
    team.uid,
    team.name,
    optimisticIsFollowing,
    mutate,
    router,
    onCompletedViewTeamFollowed,
    onCompletedViewTeamUnfollowed,
  ]);

  return {
    isPending,
    isFollowing: optimisticIsFollowing,
    toggleFollow,
  };
}

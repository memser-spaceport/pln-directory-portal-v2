import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import { DemoDayTeam } from '@/app/actions/demo-day.actions';
import { useFollowTeam } from '@/services/follow/hooks/useFollowTeam';

export function useFollowDemoDayTeam(team: DemoDayTeam) {
  const router = useRouter();
  const { mutate, isPending } = useFollowTeam();
  const [optimisticIsFollowing, setOptimisticIsFollowing] = useState(team.isFollowing);

  const toggleFollow = useCallback(() => {
    const willFollow = !optimisticIsFollowing;

    mutate(
      { teamUid: team.uid, action: willFollow ? 'follow' : 'unfollow' },
      {
        onSuccess: () => {
          setOptimisticIsFollowing(willFollow);
        },
        onSettled: () => {
          router.refresh();
        },
      },
    );
  }, [team.uid, optimisticIsFollowing, mutate, router]);

  return {
    isPending,
    isFollowing: optimisticIsFollowing,
    toggleFollow,
  };
}

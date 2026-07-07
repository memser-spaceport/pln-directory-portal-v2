'use client';

import { useTeamFilterStore } from '@/services/teams';
import { useTeamAnalytics } from '@/analytics/teams.analytics';
import s from './FollowingEmptyState.module.scss';

export function FollowingEmptyState() {
  const setParam = useTeamFilterStore((store) => store.setParam);
  const analytics = useTeamAnalytics();

  return (
    <div className={s.root}>
      <p className={s.text}>You&apos;re not following any teams yet. Follow a team to see it here.</p>
      <button
        type="button"
        className={s.browseAll}
        onClick={() => {
          analytics.onFollowingEmptyBrowseAllClicked();
          setParam('followingOnly', '');
        }}
      >
        Browse all teams
      </button>
    </div>
  );
}

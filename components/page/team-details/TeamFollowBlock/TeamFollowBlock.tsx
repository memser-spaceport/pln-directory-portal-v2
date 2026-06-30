'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { ITeam } from '@/types/teams.types';
import { useCurrentUserStore } from '@/services/auth/store';
import { useFollowTeam } from '@/services/follow/hooks/useFollowTeam';
import { useFollowAnalytics } from '@/analytics/follow.analytics';
import { FollowButton } from '@/components/ui/FollowButton/FollowButton';

import { TeamFollowersModal } from './TeamFollowersModal';
import s from './TeamFollowBlock.module.scss';

interface TeamFollowBlockProps {
  team: ITeam;
  initialIsFollowed: boolean;
  initialFollowerCount: number;
  isTeamMember: boolean;
}

export function TeamFollowBlock({ team, initialIsFollowed, initialFollowerCount, isTeamMember }: TeamFollowBlockProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowed);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [modalOpen, setModalOpen] = useState(false);
  const prevStateRef = useRef({ isFollowing: initialIsFollowed, followerCount: initialFollowerCount });

  const { currentUser } = useCurrentUserStore();
  const router = useRouter();
  const { mutate } = useFollowTeam();
  const { onTeamFollowed, onTeamUnfollowed } = useFollowAnalytics();

  const handleToggle = () => {
    if (!currentUser) {
      router.push('#login');
      return;
    }

    const willFollow = !isFollowing;
    prevStateRef.current = { isFollowing, followerCount };

    setIsFollowing(willFollow);
    setFollowerCount((c) => (willFollow ? c + 1 : Math.max(0, c - 1)));

    mutate(
      { teamUid: team.id, action: willFollow ? 'follow' : 'unfollow' },
      {
        onSuccess: (data) => {
          if (data) {
            setIsFollowing(data.following);
            setFollowerCount(data.followerCount);
          }
          if (willFollow) {
            onTeamFollowed({ teamUid: team.id, teamName: team.name ?? '', source: 'team-profile' });
          } else {
            onTeamUnfollowed({ teamUid: team.id, teamName: team.name ?? '', source: 'team-profile' });
          }
        },
        onError: () => {
          setIsFollowing(prevStateRef.current.isFollowing);
          setFollowerCount(prevStateRef.current.followerCount);
        },
      },
    );
  };

  const showFollowers = isTeamMember && followerCount > 0;

  return (
    <div className={s.wrapper}>
      <FollowButton following={isFollowing} onClick={handleToggle} name={team.name ?? ''} />

      {!isFollowing && <p className={s.caption}>Subscribe for updates</p>}
      {isFollowing && <div className={s.captionSpacer} aria-hidden="true" />}

      {isTeamMember && (
        <button
          type="button"
          className={showFollowers ? s.subStack : s.subStackHidden}
          onClick={() => showFollowers && setModalOpen(true)}
          aria-hidden={!showFollowers}
          tabIndex={showFollowers ? 0 : -1}
        >
          <span className={s.subCount}>
            <strong>{followerCount.toLocaleString()}</strong> {followerCount === 1 ? 'follower' : 'followers'}
          </span>
        </button>
      )}

      <TeamFollowersModal
        teamName={team.name ?? ''}
        teamUid={team.id}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}

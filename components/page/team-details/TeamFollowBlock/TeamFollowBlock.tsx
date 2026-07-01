'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { ITeam } from '@/types/teams.types';
import { useCurrentUserStore } from '@/services/auth/store';
import { useFollowTeam } from '@/services/follow/hooks/useFollowTeam';
import { useTeamFollowers } from '@/services/follow/hooks/useTeamFollowers';
import { useFollowAnalytics } from '@/analytics/follow.analytics';
import { Button } from '@/components/common/Button';

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
  const { mutate, isPending } = useFollowTeam();
  const { onTeamFollowed, onTeamUnfollowed } = useFollowAnalytics();

  const showFollowers = isTeamMember && followerCount > 0;

  const { data: followersData } = useTeamFollowers(team.id, { enabled: showFollowers });
  const previewAvatars = followersData?.items.slice(0, 3) ?? [];

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

  return (
    <div className={s.wrapper}>
      <Button
        style={isFollowing ? 'border' : 'fill'}
        variant="primary"
        size="l"
        disabled={isPending}
        onClick={handleToggle}
      >
        {isFollowing ? (
          <>
            <CheckIcon />
            Following
          </>
        ) : (
          <>
            <PlusIcon />
            Follow
          </>
        )}
      </Button>

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
          <span className={s.subAvatars} aria-hidden="true">
            {previewAvatars.length > 0
              ? previewAvatars.map((f) =>
                  f.image ? (
                    <img key={f.uid} className={s.subAvatar} src={f.image} alt="" loading="lazy" />
                  ) : (
                    <span key={f.uid} className={s.subAvatarFallback}>
                      {f.name.charAt(0).toUpperCase()}
                    </span>
                  ),
                )
              : Array.from({ length: Math.min(followerCount, 3) }).map((_, i) => (
                  <span key={i} className={s.subAvatarPlaceholder} />
                ))}
          </span>
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

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M8 3.333v9.334M3.333 8h9.334" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M13.333 4L6 11.333 2.667 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useQueryClient } from '@tanstack/react-query';

import { ITeam } from '@/types/teams.types';
import type { ITeamFollowersResponse } from '@/types/follow.types';
import { useCurrentUserStore } from '@/services/auth/store';
import { useFollowTeam } from '@/services/follow/hooks/useFollowTeam';
import { useTeamFollowers } from '@/services/follow/hooks/useTeamFollowers';
import { FollowQueryKeys } from '@/services/follow/constants';
import { useFollowAnalytics } from '@/analytics/follow.analytics';
import { Button } from '@/components/common/Button';
import { Tooltip } from '@/components/core/tooltip/tooltip';

import { TeamFollowersModal } from './TeamFollowersModal';
import s from './TeamFollowBlock.module.scss';
import { clsx } from 'clsx';

interface TeamFollowBlockProps {
  team: ITeam;
  initialIsFollowed: boolean;
  initialFollowers?: ITeamFollowersResponse | null;
  isTeamMember: boolean;
}

export function TeamFollowBlock({ team, initialIsFollowed, initialFollowers, isTeamMember }: TeamFollowBlockProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowed);
  const [modalOpen, setModalOpen] = useState(false);
  const prevIsFollowingRef = useRef(initialIsFollowed);

  const { currentUser } = useCurrentUserStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { mutate, isPending } = useFollowTeam();
  const { onTeamFollowed, onTeamUnfollowed } = useFollowAnalytics();

  const followersQueryKey = [FollowQueryKeys.FOLLOWED_TEAMS, 'followers', team.id];
  const showFollowers = isTeamMember && ((initialFollowers?.total ?? 0) > 0 || isFollowing);

  const { data: followersData } = useTeamFollowers(team.id, {
    enabled: showFollowers,
    initialData: initialFollowers,
  });

  const followerCount = followersData?.total ?? initialFollowers?.total ?? 0;
  const previewAvatars = followersData?.items.slice(0, 3) ?? [];

  const handleToggle = () => {
    if (!currentUser) {
      router.push('#login');
      return;
    }

    const willFollow = !isFollowing;
    prevIsFollowingRef.current = isFollowing;
    const prevFollowersData = queryClient.getQueryData<ITeamFollowersResponse>(followersQueryKey);
    const revertFollowers = () =>
      prevFollowersData
        ? queryClient.setQueryData(followersQueryKey, prevFollowersData)
        : queryClient.removeQueries({ queryKey: followersQueryKey, exact: true });

    setIsFollowing(willFollow);
    queryClient.setQueryData<ITeamFollowersResponse>(followersQueryKey, (current) => {
      const base = current ?? prevFollowersData ?? { items: [], total: 0 };
      if (willFollow) {
        const alreadyPresent = base.items.some((f) => f.uid === currentUser.uid);
        return {
          total: base.total + (alreadyPresent ? 0 : 1),
          items: alreadyPresent
            ? base.items
            : [
                {
                  uid: currentUser.uid ?? '',
                  name: currentUser.name ?? '',
                  image: currentUser.profileImageUrl ?? null,
                },
                ...base.items,
              ],
        };
      }
      return {
        total: Math.max(0, base.total - 1),
        items: base.items.filter((f) => f.uid !== currentUser.uid),
      };
    });

    mutate(
      { teamUid: team.id, action: willFollow ? 'follow' : 'unfollow' },
      {
        onSuccess: (data) => {
          if (data) {
            setIsFollowing(data.following);
            queryClient.setQueryData<ITeamFollowersResponse>(followersQueryKey, (current) =>
              current ? { ...current, total: data.followerCount } : current,
            );
            if (willFollow) {
              onTeamFollowed({ teamUid: team.id, teamName: team.name ?? '', source: 'team-profile' });
            } else {
              onTeamUnfollowed({ teamUid: team.id, teamName: team.name ?? '', source: 'team-profile' });
            }
          } else {
            setIsFollowing(prevIsFollowingRef.current);
            revertFollowers();
          }
        },
        onError: () => {
          setIsFollowing(prevIsFollowingRef.current);
          revertFollowers();
        },
      },
    );
  };

  return (
    <div className={s.wrapper}>
      <div className={s.followRow}>
        <Button
          variant="primary"
          size="m"
          disabled={isPending}
          onClick={handleToggle}
          className={clsx(s.followBtn, {
            [s.isFollowing]: isFollowing,
          })}
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

        {showFollowers && (
          <div className={s.followersInfo}>
            <button type="button" className={s.subStack} onClick={() => setModalOpen(true)}>
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
              {followerCount > 0 && (
                <span className={s.subCount}>
                  <strong>{followerCount.toLocaleString()}</strong> {followerCount === 1 ? 'follower' : 'followers'}
                </span>
              )}
            </button>

            <Tooltip
              asChild
              trigger={
                <Image
                  alt="Info"
                  height={14}
                  width={14}
                  src="/icons/info.svg"
                  className={s.infoIcon}
                />
              }
              content="Followers are only visible to your team."
            />
          </div>
        )}
      </div>

      {!isFollowing && <p className={s.caption}>Subscribe for updates</p>}

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
    <path
      d="M13.333 4L6 11.333 2.667 8"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

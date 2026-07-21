'use client';

import { useState } from 'react';
import Image from 'next/image';

import { ITeam } from '@/types/teams.types';
import type { ITeamFollowersResponse, ITeamFollower } from '@/types/follow.types';
import { useTeamFollowers } from '@/services/follow/hooks/useTeamFollowers';
import { useTeamAnalytics } from '@/analytics/teams.analytics';
import { Tooltip } from '@/components/core/tooltip/tooltip';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';

import { TeamFollowersModal } from './TeamFollowersModal';
import s from './TeamFollowBlock.module.scss';

const FollowerAvatar = ({ follower, className }: { follower: ITeamFollower; className: string }) => {
  const defaultAvatarImage = getDefaultAvatar(follower.name);

  return (
    <img
      key={follower.uid}
      className={className}
      src={follower.imageUrl || defaultAvatarImage}
      alt=""
      loading="lazy"
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = defaultAvatarImage;
      }}
    />
  );
};

interface TeamFollowBlockProps {
  team: ITeam;
  initialFollowers?: ITeamFollowersResponse | null;
}

export function TeamFollowBlock({ team, initialFollowers }: TeamFollowBlockProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const analytics = useTeamAnalytics();

  const { data: followersData } = useTeamFollowers(team.id, {
    enabled: true,
    initialData: initialFollowers,
  });

  const followerCount = followersData?.total ?? initialFollowers?.total ?? 0;
  const previewAvatars = followersData?.items.slice(0, 3) ?? [];

  if (followerCount === 0) {
    return null;
  }

  return (
    <div className={s.followersInfo}>
      <button
        type="button"
        className={s.subStack}
        onClick={() => {
          analytics.onFollowersModalOpened({ teamUid: team.id, followerCount });
          setModalOpen(true);
        }}
      >
        <span className={s.subAvatars} aria-hidden="true">
          {previewAvatars.length > 0
            ? previewAvatars.map((f) => <FollowerAvatar key={f.uid} follower={f} className={s.subAvatar} />)
            : Array.from({ length: Math.min(followerCount, 3) }).map((_, i) => (
                <span key={i} className={s.subAvatarPlaceholder} />
              ))}
        </span>
        <span className={s.subCount}>
          <strong>{followerCount.toLocaleString()}</strong> {followerCount === 1 ? 'follower' : 'followers'}
        </span>
      </button>

      <Tooltip
        asChild
        trigger={<Image alt="Info" height={14} width={14} src="/icons/info.svg" className={s.infoIcon} />}
        content="The follower list is only visible to your team."
      />

      <TeamFollowersModal
        teamName={team.name ?? ''}
        teamUid={team.id}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}

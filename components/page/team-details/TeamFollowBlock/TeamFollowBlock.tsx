'use client';

import { useState } from 'react';
import Image from 'next/image';

import { ITeam } from '@/types/teams.types';
import type { ITeamFollowersResponse } from '@/types/follow.types';
import { useTeamFollowers } from '@/services/follow/hooks/useTeamFollowers';
import { Tooltip } from '@/components/core/tooltip/tooltip';

import { TeamFollowersModal } from './TeamFollowersModal';
import s from './TeamFollowBlock.module.scss';

interface TeamFollowBlockProps {
  team: ITeam;
  initialFollowers?: ITeamFollowersResponse | null;
}

export function TeamFollowBlock({ team, initialFollowers }: TeamFollowBlockProps) {
  const [modalOpen, setModalOpen] = useState(false);

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

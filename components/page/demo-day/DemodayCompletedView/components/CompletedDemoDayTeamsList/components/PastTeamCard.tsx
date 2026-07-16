'use client';

import clsx from 'clsx';
import Image from 'next/image';
import React, { useCallback, MouseEvent } from 'react';

import { useDefaultAvatar } from '@/hooks/useDefaultAvatar';

import { Badge } from '@/components/common/Badge';
import { FollowButton } from '@/components/ui/FollowButton';
import { DemoDayTeam } from '@/app/actions/demo-day.actions';

import { useFollowDemoDayTeam } from './hooks/useFollowDemoDayTeam';

import s from './PastTeamCard.module.scss';

interface Props {
  team: DemoDayTeam;
}

export function PastTeamCard(props: Props) {
  const { team } = props;
  const { uid, name, logoUrl, newsCount, shortDescription } = team;

  const defaultAvatarImage = useDefaultAvatar(team?.name ?? '');

  const { isPending, isFollowing, toggleFollow } = useFollowDemoDayTeam(team);

  const toggleFollowState = useCallback((e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFollow();
  }, [toggleFollow]);

  return (
    <a href={`/teams/${uid}`} target="_blank" rel="noopener noreferrer" className={s.root}>
      <div>
        <Image
          width={32}
          height={32}
          alt={`${name} logo`}
          src={logoUrl || defaultAvatarImage}
          className={clsx({
            [s.defaultLogo]: !logoUrl,
          })}
        />
      </div>

      <div className={s.body}>
        <div className={s.nameRow}>
          <div className={s.nameGroup}>
            <div className={s.name}>{name}</div>
            {newsCount > 0 && (
              <Badge variant="default" className={s.newsBadge}>
                {newsCount} news
              </Badge>
            )}
          </div>

          <span className={s.follow} onClick={(e) => e.preventDefault()}>
            <FollowButton
              size="compact"
              disabled={isPending}
              following={isFollowing}
              name={team.name}
              onClick={toggleFollowState}
            />
          </span>
        </div>

        <div className={s.description}>{shortDescription}</div>
      </div>
    </a>
  );
}

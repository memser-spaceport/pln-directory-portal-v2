'use client';

import Image from 'next/image';
import { ITag } from '@/types/teams.types';
import TeamsTagsList from '@/components/page/teams/teams-tags-list';

import type { MockTeamCard } from './mocks';
import { FollowButton } from '../follow-shared/FollowButton';
// Reuse the production card styling so the prototype tracks production 1:1.
import s from '@/components/page/teams/TeamList/components/TeamGridView/TeamGridView.module.scss';
import local from './TeamsPrototype.module.scss';

interface Props {
  team: MockTeamCard;
  following: boolean;
  onToggleFollow: () => void;
}

/**
 * COPY-SIMPLIFY of production `TeamGridView`.
 * Production version pulls in `useTeamAnalytics` (Zustand + posthog) and
 * `useCarousel` (embla). The carousel branch only renders when `team.asks`
 * exist (always empty here) so it's dropped; analytics is stripped. The static
 * presentational markup + production `.module.scss` are kept verbatim.
 */
export function TeamCardView({ team, following, onToggleFollow }: Props) {
  const profile = team?.logo ?? '/icons/team-default-profile.svg';

  return (
    <div className={`${s.grid} ${local.teamCard}`}>
      <div className={s.profileContainer}>
        <Image
          alt="profile"
          height={72}
          width={72}
          layout="intrinsic"
          loading="eager"
          priority={true}
          src={profile}
          className={s.profileImage}
        />
      </div>
      <div className={s.detailsContainer}>
        <div className={s.teamDetail}>
          <h2 className={s.teamName}>{team?.name}</h2>
          <p className={s.teamDesc}>{team?.shortDescription}</p>
        </div>

        <div className={s.tagsDesc}>
          <TeamsTagsList tags={team?.industryTags as ITag[]} noOfTagsToShow={2} />
        </div>
        <div className={s.tagsMob}>
          <TeamsTagsList tags={team?.industryTags as ITag[]} noOfTagsToShow={1} />
        </div>

        {/* Follow button — in-card, after the tags. Stops the card's link navigation. */}
        <span
          className={local.followRow}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <FollowButton following={following} onClick={onToggleFollow} name={team?.name ?? 'team'} size="s" bell block glossy />
        </span>
      </div>
    </div>
  );
}

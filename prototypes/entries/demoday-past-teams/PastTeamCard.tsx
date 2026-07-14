'use client';

import { useState } from 'react';
import Image from 'next/image';

// Text-link Follow with a plus glyph (tertiary + bell) — the shared prototype
// FollowButton, matching the newsfeed's link treatment but with the "+".
import { FollowButton } from '../follow-shared/FollowButton';
import { Badge } from '@/components/common/Badge';

import { recentNewsCountByUid } from './teamNews';
import s from './PastTeamCard.module.scss';

interface Props {
  team: {
    uid: string;
    name: string;
    logo: string;
    shortDescription: string;
  };
}

// Prototype-local variant of the production TeamCard: the website link is
// removed in favor of the team description + a Follow button.
export function PastTeamCard(props: Props) {
  const { team } = props;
  const { uid, name, logo, shortDescription } = team;

  const [following, setFollowing] = useState(false);
  const teamPageUrl = `https://directory.plnetwork.io/teams/${uid}`;
  const newsCount = recentNewsCountByUid[uid];

  const handleFollowClick = () => setFollowing((v) => !v);

  return (
    <a href={teamPageUrl} target="_blank" rel="noopener noreferrer" className={s.root}>
      <div>
        <Image src={logo} alt={`${name} logo`} width={32} height={32} />
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
          {/* The whole card is a link — swallow the click so following doesn't navigate. */}
          <span className={s.follow} onClick={(e) => e.preventDefault()}>
            <FollowButton following={following} onClick={handleFollowClick} name={name} size="xs" tertiary bell />
          </span>
        </div>

        <div className={s.description}>{shortDescription}</div>
      </div>
    </a>
  );
}

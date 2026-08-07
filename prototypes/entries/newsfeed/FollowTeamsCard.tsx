'use client';

import clsx from 'clsx';

import { getTeamLogoFallback } from '@/components/page/home/TeamNews/utils/getTeamLogoFallback';
import { FollowButton } from '@/components/ui/FollowButton';

// Production news-card styling, reused 1:1 for the rail module.
import s from '@/components/page/home/TeamNews/components/NewsCard/NewsCard.module.scss';
import v0 from '../newsfeed-v0/NewsfeedV0.module.scss';
import local from './Newsfeed.module.scss';

import { CURATED_SUGGESTED_TEAMS } from './mocks';

interface FollowTeamsCardProps {
  followedTeams: Set<string>;
  onToggleFollow: (teamUid: string, teamName: string) => void;
  className?: string;
}

/**
 * "Teams to follow", lifted out of `CuratedRail` so it can render in two places:
 * beside the top-stories block on desktop, and in the rail everywhere else.
 * Only one instance is ever visible — see `NewsfeedPrototype`.
 *
 * Every row states a *reason*, not a tagline. Production's `ISuggestedTeam` has
 * carried a `reason` field all along and newsfeed-v0's mock dropped it. A tagline
 * tells you what a team is, which its profile already does; a reason tells you
 * why it is in front of *you*, which is the only thing that earns a follow from a
 * module nobody asked for.
 */
export function FollowTeamsCard({ followedTeams, onToggleFollow, className }: FollowTeamsCardProps) {
  return (
    <div className={clsx(s.card, v0.railCard, v0.followRailCard, className)}>
      <h3 className={v0.railTitle}>Teams to follow</h3>
      {CURATED_SUGGESTED_TEAMS.map((team) => (
        <div key={team.uid} className={v0.railRow}>
          {team.logo ? (
            <img className={s.logo} src={team.logo} alt="" loading="lazy" />
          ) : (
            <div className={s.logoFallback}>{getTeamLogoFallback(team.name)}</div>
          )}
          <span className={v0.railInfo}>
            <span className={v0.railNameRow}>
              <span className={v0.railName}>{team.name}</span>
              <FollowButton
                following={followedTeams.has(team.uid)}
                onClick={() => onToggleFollow(team.uid, team.name)}
                name={team.name}
                size="default"
                className={v0.railFollowBtn}
              />
            </span>
            <span className={local.railWhy} title={team.reason}>
              {team.reason}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

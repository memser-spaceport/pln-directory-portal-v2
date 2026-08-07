'use client';

import { getTeamLogoFallback } from '@/components/page/home/TeamNews/utils/getTeamLogoFallback';
import { FollowButton } from '@/components/ui/FollowButton';

// Production news-card styling, reused 1:1 for the card surface and logo.
import s from '@/components/page/home/TeamNews/components/NewsCard/NewsCard.module.scss';
import v0 from '../newsfeed-v0/NewsfeedV0.module.scss';
import local from './Newsfeed.module.scss';

import { MobileScrollRow } from './MobileScrollRow';
import { CURATED_SUGGESTED_TEAMS } from './mocks';

interface FollowTeamsScrollerProps {
  followedTeams: Set<string>;
  onToggleFollow: (teamUid: string, teamName: string) => void;
}

/**
 * "Teams to follow" for sub-desktop widths.
 *
 * Below 960px the rail stacks under the whole feed, which put this module past
 * six cards and the Show All button — roughly three screens down, i.e. nowhere.
 * A horizontal row lifts it to just below the block at a fraction of the vertical
 * cost of the stacked card.
 *
 * Cards are 240px rather than chip-sized on purpose: the *reason* line is the
 * only thing that earns a follow ("Raised this week · works with 2 teams you
 * follow"), and a narrow chip would have to drop it, leaving a row of logos.
 */
export function FollowTeamsScroller({ followedTeams, onToggleFollow }: FollowTeamsScrollerProps) {
  return (
    <MobileScrollRow title="Teams to follow">
      {CURATED_SUGGESTED_TEAMS.map((team) => (
        <div key={team.uid} className={local.followScrollCard}>
          <div className={local.followScrollHead}>
            {team.logo ? (
              <img className={s.logo} src={team.logo} alt="" loading="lazy" />
            ) : (
              <div className={s.logoFallback}>{getTeamLogoFallback(team.name)}</div>
            )}
            <span className={local.followScrollName}>{team.name}</span>
          </div>
          <p className={local.followScrollReason}>{team.reason}</p>
          <FollowButton
            following={followedTeams.has(team.uid)}
            onClick={() => onToggleFollow(team.uid, team.name)}
            name={team.name}
            size="default"
            className={v0.railFollowBtn}
          />
        </div>
      ))}
    </MobileScrollRow>
  );
}

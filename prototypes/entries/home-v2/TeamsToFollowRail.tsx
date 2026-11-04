'use client';

import { FollowButton } from '@/components/ui/FollowButton';
import type { ISuggestedTeam } from '@/types/team-news.types';
import { getTeamLogoFallback } from '@/components/page/home/TeamNews/utils/getTeamLogoFallback';
import { getSuggestedTeamSubtitle } from '@/components/page/home/TeamNews/components/NewsRail/components/TeamsToFollowCard/TeamsToFollowCard';

import s from '@/components/page/home/TeamNews/components/NewsRail/NewsRail.module.scss';

/**
 * Copy of production `TeamsToFollowCard` (NewsRail/components/TeamsToFollowCard):
 * same markup, classes and compact FollowButton. Simplified: no auth-store read
 * (this page is signed in by definition, so the #login detour can't happen), no
 * loading skeleton, no framer-motion exit (nothing removes the card here), no
 * analytics source/meta. Following is one-way, as in production: the button
 * disables once followed, and the team's Follow on its news cards flips with it.
 */
export function TeamsToFollowRail({
  suggestions,
  followedTeamUids,
  onFollow,
}: {
  suggestions: ISuggestedTeam[];
  followedTeamUids: Set<string>;
  onFollow: (teamUid: string) => void;
}) {
  if (suggestions.length === 0) return null;

  return (
    <section className={s.railCard} aria-label="Teams to follow">
      <h3 className={s.railTitle}>Teams to follow</h3>
      {suggestions.map((team) => {
        const isFollowing = followedTeamUids.has(team.uid);
        const subtitle = getSuggestedTeamSubtitle(team);
        return (
          <div key={team.uid} className={s.railRow}>
            {team.logo ? (
              <img className={s.railLogo} src={team.logo} alt="" loading="lazy" />
            ) : (
              <div className={s.railLogoFallback}>{getTeamLogoFallback(team.name)}</div>
            )}
            <span className={s.railInfo}>
              <span className={s.railNameRow}>
                <a href={`/teams/${team.uid}`} target="_blank" rel="noopener noreferrer" className={s.railName}>
                  {team.name}
                </a>
                <FollowButton
                  following={isFollowing}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isFollowing) onFollow(team.uid);
                  }}
                  name={team.name}
                  size="compact"
                  disabled={isFollowing}
                />
              </span>
              {subtitle ? <span className={s.railReason}>{subtitle}</span> : null}
            </span>
          </div>
        );
      })}
    </section>
  );
}

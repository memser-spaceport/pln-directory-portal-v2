'use client';

import { FollowButton } from '@/components/ui/FollowButton';
import type { FollowAnalyticsSource } from '@/analytics/follow.analytics';
import type { ISuggestedTeam } from '@/types/team-news.types';
import { getTeamLogoFallback } from '@/components/page/home/TeamNews/utils/getTeamLogoFallback';
import {
  getSuggestedTeamSubtitle,
  stripFollowerCountFromReason,
} from '@/components/page/home/TeamNews/components/NewsRail/components/TeamsToFollowCard/TeamsToFollowCard';

import s from '@/components/page/home/TeamNews/components/NewsRail/NewsRail.module.scss';

/**
 * Teams to follow in the signed-in rail (LAB-3125): the prototype's `TeamsToFollowRail`, itself a copy of production
 * `TeamsToFollowCard` (same markup, classes and compact FollowButton) without the auth-store read (the page is signed
 * in), the loading skeleton or the exit animation. The button toggles, as Follow does on the news cards (LAB-3185: it
 * was one-way, as in production, so a team followed by mistake could only be unfollowed from its own page); the team's
 * Follow on its news cards flips with it. Follows and unfollows are reported as the news rail's.
 */
export function TeamsToFollowSection({
  suggestions,
  followedTeamUids,
  onFollowToggle,
}: {
  suggestions: ISuggestedTeam[];
  followedTeamUids: ReadonlySet<string>;
  onFollowToggle: (
    teamUid: string,
    teamName: string,
    isCurrentlyFollowing: boolean,
    source?: FollowAnalyticsSource,
    meta?: { position?: number; reason?: string },
  ) => void;
}) {
  if (suggestions.length === 0) return null;

  return (
    <section className={s.railCard} aria-label="Teams to follow">
      <h3 className={s.railTitle}>Teams to follow</h3>
      {suggestions.map((team, position) => {
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
                    onFollowToggle(team.uid, team.name, isFollowing, 'news-rail', {
                      position,
                      reason: stripFollowerCountFromReason(team.reason),
                    });
                  }}
                  name={team.name}
                  size="compact"
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

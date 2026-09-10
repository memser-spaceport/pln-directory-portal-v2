'use client';

import { useRouter } from 'next/navigation';

import { useCurrentUserStore } from '@/services/auth/store';
import { FollowButton } from '@/components/ui/FollowButton';
import type { FollowAnalyticsSource } from '@/analytics/follow.analytics';
import type { ISuggestedTeam } from '@/types/team-news.types';

import { getTeamLogoFallback } from '../../utils/getTeamLogoFallback';
import {
  getSuggestedTeamSubtitle,
  stripFollowerCountFromReason,
} from '../NewsRail/components/TeamsToFollowCard/TeamsToFollowCard';

import { MobileScrollRow } from './MobileScrollRow';
import s from './FeedScrollers.module.scss';

interface FollowTeamsScrollerProps {
  suggestions: ISuggestedTeam[];
  followedTeamUids: Set<string>;
  onFollowToggle: (
    teamUid: string,
    teamName: string,
    isCurrentlyFollowing: boolean,
    source?: FollowAnalyticsSource,
    meta?: { position?: number; reason?: string },
  ) => void;
}

/**
 * "Teams to follow" for sub-desktop widths.
 *
 * Cards are 240px rather than chip-sized on purpose: the description (or
 * focus-area fallback) would disappear on a narrow chip, leaving a row of logos.
 *
 * Reads the same `visibleSuggestions` the rail card does — TeamNews computes it
 * once, so the delayed-hide-after-follow confirm behaves identically at either
 * width, and the same description-first subtitle rule applies.
 */
export function FollowTeamsScroller({ suggestions, followedTeamUids, onFollowToggle }: FollowTeamsScrollerProps) {
  const router = useRouter();
  const { currentUser } = useCurrentUserStore();

  if (suggestions.length === 0) return null;

  const handleFollowClick = (team: ISuggestedTeam, position: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      router.push(`${window.location.pathname}${window.location.search}#login`, { scroll: false });
      return;
    }
    if (followedTeamUids.has(team.uid)) return;
    onFollowToggle(team.uid, team.name, false, 'news-rail', {
      position,
      reason: stripFollowerCountFromReason(team.reason || ''),
    });
  };

  return (
    <MobileScrollRow title="Teams to follow">
      {suggestions.map((team, position) => {
        const isFollowing = followedTeamUids.has(team.uid);
        const subtitle = getSuggestedTeamSubtitle(team);
        return (
          <div key={team.uid} className={s.card}>
            <div className={s.cardHead}>
              {team.logo ? (
                <img className={s.logo} src={team.logo} alt="" loading="lazy" />
              ) : (
                <div className={s.logoFallback}>{getTeamLogoFallback(team.name)}</div>
              )}
              <a href={`/teams/${team.uid}`} target="_blank" rel="noopener noreferrer" className={s.cardName}>
                {team.name}
              </a>
            </div>
            {subtitle && <p className={s.cardReason}>{subtitle}</p>}
            <FollowButton
              following={isFollowing}
              onClick={handleFollowClick(team, position)}
              name={team.name}
              size="compact"
              disabled={isFollowing}
            />
          </div>
        );
      })}
    </MobileScrollRow>
  );
}

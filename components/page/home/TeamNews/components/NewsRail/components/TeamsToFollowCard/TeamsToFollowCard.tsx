'use client';

import { useRouter } from 'next/navigation';

import { useCurrentUserStore } from '@/services/auth/store';
import { FollowButton } from '@/components/ui/FollowButton/FollowButton';
import type { ISuggestedTeam } from '@/types/team-news.types';
import { getTeamLogoFallback } from '../../../../utils/getTeamLogoFallback';

import s from '../../NewsRail.module.scss';

interface TeamsToFollowCardProps {
  suggestions: ISuggestedTeam[];
  isLoading: boolean;
  onFollowToggle: (teamUid: string, teamName: string, isCurrentlyFollowing: boolean) => void;
}

// Hidden when there are no suggestions — whether that's the initial empty state
// (backend/mock returned nothing) or the reactive mid-session case (the viewer
// followed every suggested team; useSuggestedTeamsToFollow filters them out and
// this card just renders nothing once the list is empty).
export function TeamsToFollowCard({ suggestions, isLoading, onFollowToggle }: TeamsToFollowCardProps) {
  const router = useRouter();
  const { currentUser } = useCurrentUserStore();

  if (isLoading) {
    return (
      <section className={s.railCard} aria-label="Teams to follow" aria-busy="true">
        <h3 className={s.railTitle}>Teams to follow</h3>
        {[0, 1, 2].map((i) => (
          <div key={i} className={s.railSkeletonRow}>
            <span className={s.railSkeletonBlock} style={{ width: 32, height: 32 }} />
            <span className={s.railSkeletonBlock} style={{ width: '100%', height: 16 }} />
          </div>
        ))}
      </section>
    );
  }

  if (suggestions.length === 0) return null;

  const handleFollowClick = (team: ISuggestedTeam) => (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      router.push(`${window.location.pathname}${window.location.search}#login`);
      return;
    }
    // Suggestions only ever list teams the member doesn't already follow.
    onFollowToggle(team.uid, team.name, false);
  };

  return (
    <section className={s.railCard} aria-label="Teams to follow">
      <h3 className={s.railTitle}>Teams to follow</h3>
      {suggestions.map((team) => (
        <div key={team.uid} className={s.railRow}>
          {team.logoUrl ? (
            <img className={s.railLogo} src={team.logoUrl} alt="" loading="lazy" />
          ) : (
            <div className={s.railLogoFallback}>{getTeamLogoFallback(team.name)}</div>
          )}
          <span className={s.railInfo}>
            <span className={s.railNameRow}>
              <span className={s.railName}>{team.name}</span>
              <FollowButton following={false} onClick={handleFollowClick(team)} name={team.name} size="compact" />
            </span>
            <span className={s.railReason}>{team.reason}</span>
          </span>
        </div>
      ))}
    </section>
  );
}

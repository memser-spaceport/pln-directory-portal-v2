'use client';

import { motion } from 'framer-motion';
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

const CARD_TRANSITION = { duration: 0.28, ease: [0.4, 0, 0.2, 1] as const };
// `layout` lets sibling rail cards smoothly reflow when this card's height
// changes; the explicit height/marginBottom in `exit` gives AnimatePresence
// something to collapse to, instead of the space just snapping shut.
const CARD_MOTION_PROPS = {
  layout: true,
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, height: 0, marginBottom: 0 },
  transition: CARD_TRANSITION,
} as const;

// Whether to mount this component at all — including the transition from
// "loading" to "no suggestions" — is decided by NewsRail, not here, so
// AnimatePresence there can see it leave the tree and play this card's exit
// animation (fade + height collapse) instead of it just vanishing.
export function TeamsToFollowCard({ suggestions, isLoading, onFollowToggle }: TeamsToFollowCardProps) {
  const router = useRouter();
  const { currentUser } = useCurrentUserStore();

  if (isLoading) {
    return (
      <motion.section {...CARD_MOTION_PROPS} className={s.railCard} aria-label="Teams to follow" aria-busy="true">
        <h3 className={s.railTitle}>Teams to follow</h3>
        {[0, 1, 2].map((i) => (
          <div key={i} className={s.railSkeletonRow}>
            <span className={s.railSkeletonBlock} style={{ width: 32, height: 32 }} />
            <span className={s.railSkeletonBlock} style={{ width: '100%', height: 16 }} />
          </div>
        ))}
      </motion.section>
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
    <motion.section {...CARD_MOTION_PROPS} className={s.railCard} aria-label="Teams to follow">
      <h3 className={s.railTitle}>Teams to follow</h3>
      {suggestions.map((team) => (
        <div key={team.uid} className={s.railRow}>
          {team.logo ? (
            <img className={s.railLogo} src={team.logo} alt="" loading="lazy" />
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
    </motion.section>
  );
}

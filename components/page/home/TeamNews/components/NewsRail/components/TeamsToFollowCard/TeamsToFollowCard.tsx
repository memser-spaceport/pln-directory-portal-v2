'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

import { useCurrentUserStore } from '@/services/auth/store';
import type { FollowAnalyticsSource } from '@/analytics/follow.analytics';
import { FollowButton } from '@/components/ui/FollowButton/FollowButton';
import type { ISuggestedTeam } from '@/types/team-news.types';
import { getTeamLogoFallback } from '../../../../utils/getTeamLogoFallback';

import s from '../../NewsRail.module.scss';

/** Backend reason is e.g. "Storage · 1.2k followers" — strip the follower count for display. */
export function stripFollowerCountFromReason(reason: string): string {
  return reason.replace(/\s*·\s*[\d.,]+\s*k?\s*followers?\s*$/i, '').trim();
}

interface TeamsToFollowCardProps {
  suggestions: ISuggestedTeam[];
  isLoading: boolean;
  /** Teams the member already follows (or just followed) — drives the Following checkmark. */
  followedTeamUids: Set<string>;
  onFollowToggle: (
    teamUid: string,
    teamName: string,
    isCurrentlyFollowing: boolean,
    source?: FollowAnalyticsSource,
  ) => void;
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
export function TeamsToFollowCard({
  suggestions,
  isLoading,
  followedTeamUids,
  onFollowToggle,
}: TeamsToFollowCardProps) {
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
    if (followedTeamUids.has(team.uid)) return;
    // Suggestions only ever list teams the member doesn't already follow.
    onFollowToggle(team.uid, team.name, false, 'news-rail');
  };

  return (
    <motion.section {...CARD_MOTION_PROPS} className={s.railCard} aria-label="Teams to follow">
      <h3 className={s.railTitle}>Teams to follow</h3>
      {suggestions.map((team) => {
        const isFollowing = followedTeamUids.has(team.uid);
        const reason = stripFollowerCountFromReason(team.reason);
        return (
          <div key={team.uid} className={s.railRow}>
            {team.logo ? (
              <img className={s.railLogo} src={team.logo} alt="" loading="lazy" />
            ) : (
              <div className={s.railLogoFallback}>{getTeamLogoFallback(team.name)}</div>
            )}
            <span className={s.railInfo}>
              <span className={s.railNameRow}>
                <span className={s.railName}>{team.name}</span>
                <FollowButton
                  following={isFollowing}
                  onClick={handleFollowClick(team)}
                  name={team.name}
                  size="compact"
                  disabled={isFollowing}
                />
              </span>
              {reason ? <span className={s.railReason}>{reason}</span> : null}
            </span>
          </div>
        );
      })}
    </motion.section>
  );
}

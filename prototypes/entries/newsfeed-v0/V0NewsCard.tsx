'use client';

import clsx from 'clsx';

import type { ITeamNewsItem } from '@/types/team-news.types';

// Reuse the Gantry boost-button styling 1:1 (the component itself is label-locked to "Boost").
import gs from '@/components/page/gantry/shared/Shared.module.scss';

/**
 * One cluster per team: a lead story (picked by importance — event-type
 * weight + discussion activity, recency as tie-break) plus the team's other
 * updates. Shared between the V0/V1 feed cards and `FeedRail`'s ranking.
 */
export interface TeamCluster {
  teamUid: string;
  teamName: string;
  teamLogoUrl: string | null;
  lead: ITeamNewsItem;
  /** The team's other items, newest first. */
  rest: ITeamNewsItem[];
  /** False when an older-but-bigger story outranked the newest item. */
  isLeadNewest: boolean;
}

/**
 * Copy of the Gantry `BoostButton` (its labels are hardcoded to Boost/Boosted)
 * reusing its SCSS 1:1, relabeled Upvote/Upvoted. The count renders only when
 * > 0 — a wall of zeros reads as a dead feed; your own vote makes it appear.
 * V1 only — V0 ships without this feature.
 */
export function UpvoteButton({ count, voted, onToggle }: { count: number; voted: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className={clsx(gs.boost, voted && gs.boostActive)}
      aria-pressed={voted}
      aria-label={voted ? `Remove upvote (${count})` : `Upvote (${count})`}
      title={voted ? 'Remove upvote' : 'Upvote — show the team you find this interesting'}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
    >
      <ArrowUpIcon />
      <span className={gs.boostLabel}>{voted ? 'Upvoted' : 'Upvote'}</span>
      {count > 0 && (
        <>
          <span className={gs.boostDivider} aria-hidden />
          <span>{count}</span>
        </>
      )}
    </button>
  );
}

// Same arrow the Gantry BoostButton draws (module-local there, copied verbatim).
const ArrowUpIcon = () => (
  <svg width="10" height="11" viewBox="0 0 10 11" fill="none" aria-hidden>
    <path d="M5 9.5V1.5m0 0L1.5 5.5M5 1.5L8.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Like button — the same Gantry boost pill as UpvoteButton, relabeled Like/Liked
 * with a heart. News uses "likes" (feed + reader), not upvotes. Count hides at 0.
 */
export function LikeButton({ count, liked, onToggle }: { count: number; liked: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className={clsx(gs.boost, liked && gs.boostActive)}
      aria-pressed={liked}
      aria-label={liked ? `Unlike (${count})` : `Like (${count})`}
      title={liked ? 'Unlike' : 'Like — show the team you find this interesting'}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
    >
      <HeartIcon />
      <span className={gs.boostLabel}>{liked ? 'Liked' : 'Like'}</span>
      {count > 0 && (
        <>
          <span className={gs.boostDivider} aria-hidden />
          <span>{count}</span>
        </>
      )}
    </button>
  );
}

const HeartIcon = () => (
  <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path
      d="M8 13.5s-5.2-3.2-5.2-6.8A2.7 2.7 0 0 1 8 4.6a2.7 2.7 0 0 1 5.2 2.1c0 3.6-5.2 6.8-5.2 6.8Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

'use client';

import { clsx } from 'clsx';

import s from '../../NewsCard.module.scss';

function ArrowUpIcon() {
  return (
    <svg width="10" height="11" viewBox="0 0 10 11" fill="none" aria-hidden>
      <path
        d="M5 9.5V1.5m0 0L1.5 5.5M5 1.5L8.5 5.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface UpvoteButtonProps {
  count: number;
  voted: boolean;
  onToggle: () => void;
}

// Count hidden at 0 — a wall of zeros reads as a dead feed; your own vote makes it appear.
export function UpvoteButton({ count, voted, onToggle }: UpvoteButtonProps) {
  return (
    <button
      type="button"
      className={clsx(s.upvote, voted && s.upvoteActive)}
      aria-pressed={voted}
      aria-label={voted ? `Remove upvote (${count})` : `Upvote (${count})`}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
    >
      <ArrowUpIcon />
      <span className={s.upvoteLabel}>{voted ? 'Upvoted' : 'Upvote'}</span>
      {count > 0 && (
        <>
          <span className={s.upvoteDivider} aria-hidden />
          <span>{count}</span>
        </>
      )}
    </button>
  );
}

'use client';

import { clsx } from 'clsx';

import s from '../../NewsCard.module.scss';

// The UI says "Like"; the code, backend endpoint (/upvote), and analytics event
// names all say "upvote" — a deliberate UI-only rename, not a naming drift.
function ThumbsUpIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 10v11m0-11 4.2-7.35A1.8 1.8 0 0 1 14.4 3.6l-.9 4.9h5.6a2 2 0 0 1 1.96 2.4l-1.5 7.5A2 2 0 0 1 17.6 20H4a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1h3Z"
        stroke="currentColor"
        strokeWidth="1.8"
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
// Icon-only at that point, so the title tooltip carries the label.
export function UpvoteButton({ count, voted, onToggle }: UpvoteButtonProps) {
  const label = voted ? `Remove like (${count})` : `Like (${count})`;
  return (
    <button
      type="button"
      className={clsx(s.upvote, voted && s.upvoteActive)}
      aria-pressed={voted}
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
    >
      <ThumbsUpIcon />
      {count > 0 && <span>{count}</span>}
    </button>
  );
}

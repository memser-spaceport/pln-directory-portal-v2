'use client';

import React, { useState } from 'react';
import clsx from 'clsx';
import s from './UpvoteButton.module.scss';

interface Props {
  initialCount: number;
}

export function UpvoteButton({ initialCount }: Props) {
  const [count, setCount] = useState(initialCount);
  const [hasVoted, setHasVoted] = useState(false);

  const handleClick = () => {
    if (hasVoted) {
      setCount((c) => c - 1);
      setHasVoted(false);
    } else {
      setCount((c) => c + 1);
      setHasVoted(true);
    }
  };

  return (
    <button
      className={clsx(s.root, { [s.voted]: hasVoted })}
      onClick={handleClick}
      aria-label={hasVoted ? 'Remove upvote' : 'Upvote this article'}
    >
      <UpvoteIcon filled={hasVoted} />
      <span className={s.count}>{count}</span>
      <span className={s.label}>{hasVoted ? 'Upvoted' : 'Upvote'}</span>
    </button>
  );
}

const UpvoteIcon = ({ filled }: { filled: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M8 2L11.5 7H9.5V14H6.5V7H4.5L8 2Z"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
  </svg>
);

'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import { LikeThumbsIcon } from '@/components/icons/LikeThumbsIcon';
import { mockGantryItem } from '../mocks';
import { AdminPreview } from '../shared/AdminPreview';
import { MockGantryCard } from '../shared/MockGantryCard';
import s from '../shared/SupportControls.module.scss';

/** Current production pattern — binary upvote with thumbs-up icon. */
export function OptionBaseline() {
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [count, setCount] = useState(mockGantryItem.upvoteCount);

  const toggle = () => {
    setHasUpvoted((prev) => !prev);
    setCount((c) => (hasUpvoted ? c - 1 : c + 1));
  };

  return (
    <MockGantryCard
      item={{ ...mockGantryItem, upvoteCount: count }}
      supportControl={
        <button
          type="button"
          className={clsx(s.upvote, hasUpvoted && s.upvoteActive)}
          aria-pressed={hasUpvoted}
          onClick={toggle}
        >
          <LikeThumbsIcon filled={hasUpvoted} />
          <span>{count}</span>
        </button>
      }
      adminPreview={<AdminPreview item={{ ...mockGantryItem, upvoteCount: count }} />}
    />
  );
}

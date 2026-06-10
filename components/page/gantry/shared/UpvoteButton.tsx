'use client';

import { clsx } from 'clsx';
import { LikeThumbsIcon } from '@/components/icons/LikeThumbsIcon';
import s from './Shared.module.scss';

interface Props {
  readonly count: number;
  readonly hasUpvoted: boolean;
  readonly disabled?: boolean;
  readonly readonly?: boolean;
  readonly onToggle: (nextHasUpvoted: boolean) => void;
}

export function UpvoteButton({ count, hasUpvoted, disabled, readonly, onToggle }: Props) {
  if (readonly) {
    return (
      <span className={s.readStat} title="Thumbs — breadth">
        <LikeThumbsIcon className={s.upvoteIcon} />
        <span>{count}</span>
      </span>
    );
  }

  return (
    <button
      type="button"
      className={clsx(s.upvote, hasUpvoted && s.upvoteActive)}
      disabled={disabled}
      aria-pressed={hasUpvoted}
      aria-label={hasUpvoted ? `Remove upvote (${count})` : `Upvote (${count})`}
      onClick={(e) => {
        e.stopPropagation();
        onToggle(!hasUpvoted);
      }}
    >
      <LikeThumbsIcon filled={hasUpvoted} className={s.upvoteIcon} />
      <span>{count}</span>
    </button>
  );
}

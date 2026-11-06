import clsx from 'clsx';

import { LikeIcon } from './icons';
import s from './HomeV2.module.scss';

/**
 * The Like meta item on a story row (prototype newsfeed-v0 FeedActions `LikeButton`, the production forum
 * LikesButton's look). Presentational: the parent owns the state. Signed out it is the sign-up ask.
 */
export function LikeButton({ count, liked, onToggle }: { count: number; liked: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className={clsx(s.subItem, s.button, liked && s.liked)}
      aria-pressed={liked}
      aria-label={liked ? `Unlike (${count} likes)` : `Like (${count} likes)`}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
    >
      <LikeIcon /> {count}
    </button>
  );
}

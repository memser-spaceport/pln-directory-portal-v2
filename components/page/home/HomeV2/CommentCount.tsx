import clsx from 'clsx';

import { CommentIcon } from './icons';
import s from './HomeV2.module.scss';

/** The "N Comments" meta item on a story row (prototype newsfeed-v0 FeedActions `CommentCount`). */
export function CommentCount({ count, onClick }: { count: number; onClick?: () => void }) {
  const inner = (
    <>
      <CommentIcon /> {count} {count === 1 ? 'Comment' : 'Comments'}
    </>
  );
  if (onClick) {
    return (
      <button
        type="button"
        className={clsx(s.subItem, s.button)}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        {inner}
      </button>
    );
  }
  return <span className={s.subItem}>{inner}</span>;
}

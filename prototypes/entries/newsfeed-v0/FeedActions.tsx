'use client';

import clsx from 'clsx';

import { LikeIcon, CommentIcon, ViewIcon } from './ForumIcons';
import s from './FeedActions.module.scss';

/**
 * Copy-and-simplified from the production forum `LikesButton` (which is bound to
 * react-query `useLikePost` + analytics). Here it's purely presentational — the
 * parent owns the liked/count state and toggles it — but reuses the forum SCSS
 * 1:1, so a like in the feed looks and feels exactly like a like in the forum.
 * Fully functional: clicking toggles the viewer's like and the count updates
 * live (and un-likes, which the real button disables — a prototype convenience).
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

/**
 * Static comment-count meta item (no toggle) — used on forum posts in the
 * "Discuss" version to show how much conversation a post already has, exactly
 * like the forum listing card's "N Comments". Same forum `.subItem` styling.
 */
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

/** Static view-count meta item — the third of the forum's Views · Likes · Comments trio. */
export function ViewCount({ count }: { count: number }) {
  return (
    <span className={s.subItem}>
      <ViewIcon /> {count.toLocaleString()} {count === 1 ? 'View' : 'Views'}
    </span>
  );
}

/**
 * Comment affordance for the "Comments" interaction version — the same forum
 * meta-row item, opening/closing an inline thread. Active (thread open) borrows
 * the liked brand-blue so an open thread is legible at a glance.
 */
export function CommentButton({ count, open, onToggle }: { count: number; open: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className={clsx(s.subItem, s.button, open && s.liked)}
      aria-expanded={open}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
    >
      <CommentIcon /> {count} {count === 1 ? 'Comment' : 'Comments'}
    </button>
  );
}

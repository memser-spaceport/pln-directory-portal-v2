'use client';

import clsx from 'clsx';
import s from './FollowButton.module.scss';

interface FollowButtonProps {
  following: boolean;
  onClick: (e: React.MouseEvent) => void;
  name: string;
  disabled?: boolean;
  className?: string;
  /** 'compact' is a plain text link — for sitting inline next to a name (e.g. a card header) rather than as a standalone full-width action. */
  size?: 'default' | 'compact';
}

export function FollowButton({ following, onClick, name, disabled, className, size = 'default' }: FollowButtonProps) {
  if (size === 'compact') {
    return (
      <button
        type="button"
        disabled={disabled}
        className={clsx(s.compactBtn, following && s.compactFollowing, className)}
        onClick={onClick}
        aria-label={following ? `Following ${name}` : `Follow ${name}`}
      >
        {following ? <CheckIcon /> : <PlusIcon />}
        {following ? 'Following' : 'Follow'}
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      className={clsx(s.btn, following ? s.following : s.follow, className)}
      onClick={onClick}
      aria-label={following ? `Following ${name}` : `Follow ${name}`}
    >
      {following ? <CheckIcon /> : <PlusIcon />}
      <span>{following ? 'Following' : 'Follow'}</span>
    </button>
  );
}

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M7 1.5v11M1.5 7h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path
      d="M11.667 3.5 5.25 9.917 2.333 7"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

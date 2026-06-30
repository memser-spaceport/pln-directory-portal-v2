'use client';

import clsx from 'clsx';
import s from './FollowButton.module.scss';

interface FollowButtonProps {
  following: boolean;
  onClick: (e: React.MouseEvent) => void;
  name: string;
  disabled?: boolean;
  className?: string;
}

export function FollowButton({ following, onClick, name, disabled, className }: FollowButtonProps) {
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
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M10 3L4.5 8.5 2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

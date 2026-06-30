'use client';

import clsx from 'clsx';
import { Button } from '@/components/common/Button';

import s from './FollowButton.module.scss';

interface FollowButtonProps {
  following: boolean;
  onClick: (e: React.MouseEvent) => void;
  name: string;
  size?: 'xs' | 's' | 'm';
  disabled?: boolean;
  className?: string;
}

export function FollowButton({ following, onClick, name, size = 's', disabled, className }: FollowButtonProps) {
  return (
    <Button
      size={size}
      style={following ? 'border' : 'fill'}
      variant={following ? 'neutral' : 'primary'}
      underline={false}
      disabled={disabled}
      className={clsx(s.btn, { [s.following]: following }, className)}
      onClick={onClick}
      aria-label={following ? `Following ${name}` : `Follow ${name}`}
    >
      {following ? <CheckGlyph className={s.icon} /> : <PlusGlyph />}
      <span>{following ? 'Following' : 'Follow'}</span>
    </Button>
  );
}

const PlusGlyph = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M8 3.5v9M3.5 8h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const CheckGlyph = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="12"
    height="12"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M13.25 4.75 6.5 11.5 2.75 7.75"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

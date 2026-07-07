'use client';

import { Button } from '@/components/common/Button';

import s from './TeamFollowButton.module.scss';

interface Props {
  isFollowing: boolean;
  isPending: boolean;
  onToggle: () => void;
}

export function TeamFollowButton({ isFollowing, isPending, onToggle }: Props) {
  return (
    <Button
      style="border"
      variant="neutral"
      size="xs"
      disabled={isPending}
      onClick={onToggle}
      className={s.followBtn}
    >
      {isFollowing ? (
        <>
          <CheckIcon />
          Following
        </>
      ) : (
        <>
          <PlusIcon />
          Follow
        </>
      )}
    </Button>
  );
}

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M8 3.333v9.334M3.333 8h9.334" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path
      d="M13.333 4L6 11.333 2.667 8"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

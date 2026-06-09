'use client';

import { clsx } from 'clsx';
import { PushPinIcon } from '@/components/icons/PushPinIcon';
import s from './Shared.module.scss';

interface Props {
  readonly count: number;
  readonly hasPinned: boolean;
  readonly disabled?: boolean;
  readonly onToggle: (nextHasPinned: boolean) => void;
}

export function PinButton({ count, hasPinned, disabled, onToggle }: Props) {
  return (
    <button
      type="button"
      className={clsx(s.pin, hasPinned && s.pinActive)}
      disabled={disabled}
      aria-pressed={hasPinned}
      aria-label={hasPinned ? `Remove pin (${count})` : `Pin as priority (${count})`}
      onClick={(e) => {
        e.stopPropagation();
        onToggle(!hasPinned);
      }}
    >
      <PushPinIcon width={14} height={14} className={s.pinIcon} />
      <span>{count}</span>
    </button>
  );
}

'use client';

import { clsx } from 'clsx';
import { PushPinIcon } from '@/components/icons/PushPinIcon';
import s from './Shared.module.scss';

interface Props {
  readonly count: number;
  readonly hasPinned: boolean;
  readonly disabled?: boolean;
  readonly readonly?: boolean;
  readonly onToggle: (nextHasPinned: boolean, el: HTMLButtonElement) => void;
}

export function PinButton({ count, hasPinned, disabled, readonly, onToggle }: Props) {
  if (readonly) {
    return (
      <span className={clsx(s.readStat, s.readStatPin)} title="Pins — intensity (frozen)">
        <PushPinIcon width={14} height={14} className={s.pinIcon} />
        <span>{count ?? 0}</span>
      </span>
    );
  }

  return (
    <button
      type="button"
      className={clsx(s.pin, hasPinned && s.pinActive)}
      disabled={disabled}
      aria-pressed={hasPinned}
      aria-label={hasPinned ? `Remove pin (${count})` : `Pin as priority (${count})`}
      onClick={(e) => {
        e.stopPropagation();
        onToggle(!hasPinned, e.currentTarget);
      }}
    >
      <PushPinIcon width={15} height={15} className={s.pinIcon} />
      <span>{count ?? 0}</span>
    </button>
  );
}

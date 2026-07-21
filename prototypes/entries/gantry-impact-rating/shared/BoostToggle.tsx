'use client';

// Prototype-local boost control: production BoostButton with the count removed. Boosts ARE votes
// here, and the vote count already shows in the impact score — so the button is a pure toggle.
// Reuses the production Shared.module.scss chrome read-only (per prototypes "reuse SCSS classes").

import { clsx } from 'clsx';
import s from '@/components/page/gantry/shared/Shared.module.scss';

function ArrowUpIcon() {
  return (
    <svg width="10" height="11" viewBox="0 0 10 11" fill="none" aria-hidden>
      <path
        d="M5 9.5V1.5m0 0L1.5 5.5M5 1.5L8.5 5.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface Props {
  readonly hasPinned: boolean;
  readonly disabled?: boolean;
  readonly readonly?: boolean;
  readonly onToggle: (nextHasPinned: boolean, el: HTMLButtonElement) => void;
}

export function BoostToggle({ hasPinned, disabled, readonly, onToggle }: Props) {
  if (readonly) {
    return (
      <span className={s.readStat} title="Boosting is closed at this stage">
        <ArrowUpIcon />
        <span>{hasPinned ? 'Boosted' : 'Boost'}</span>
      </span>
    );
  }

  return (
    <button
      type="button"
      className={clsx(s.boost, hasPinned && s.boostActive)}
      disabled={disabled}
      aria-pressed={hasPinned}
      aria-label={hasPinned ? 'Remove boost' : 'Boost'}
      onClick={(e) => {
        e.stopPropagation();
        onToggle(!hasPinned, e.currentTarget);
      }}
    >
      <ArrowUpIcon />
      <span className={s.boostLabel}>{hasPinned ? 'Boosted' : 'Boost'}</span>
    </button>
  );
}

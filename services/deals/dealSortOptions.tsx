import type { ReactNode } from 'react';
import s from './dealSortOptions.module.scss';

function HighValueFirstLabel() {
  return (
    <span className={s.highValueLabel}>
      <span className={s.highValueStar} aria-hidden>
        ⭐
      </span>
      <span>High Value first</span>
    </span>
  );
}

export type DealSortOption = { value: string; label: ReactNode };

export const DEAL_SORT_OPTIONS: readonly DealSortOption[] = [
  { value: 'highValueFirst', label: <HighValueFirstLabel /> },
  { value: 'asc', label: 'A-Z (Ascending)' },
  { value: 'desc', label: 'Z-A (Descending)' },
];

import React from 'react';
import { clsx } from 'clsx';
import { PlusIcon } from '@/components/icons';
import s from './MobileFilterControls.module.scss';

export interface MobileFilterButtonProps {
  onClick: () => void;
  filterCount: number;
  className?: string;
}

/**
 * Mobile Filter Button
 *
 * Reusable button for opening filter drawer on mobile
 */
export function MobileFilterButton({ onClick, filterCount, className }: MobileFilterButtonProps) {
  return (
    <button className={clsx(s.filterButton, className)} onClick={onClick}>
      <PlusIcon color="#455468" /> Filters
      {filterCount > 0 && <span>&nbsp;({filterCount})</span>}
    </button>
  );
}

'use client';

import Image from 'next/image';
import clsx from 'clsx';
import { SortDropdown, SortOption } from '@/components/common/filters/SortDropdown';
import FilterCount from '@/components/ui/filter-count';
import s from './InvestorsToolbar.module.scss';

interface Props {
  /** Title shown on desktop next to the count (e.g. "All Investors", "Co-investors"). */
  title: string;
  /** Total row count for the current filter set. */
  total: number;
  /** Currently-active sort token (matches one of `sortOptions[].value`). */
  sortValue: string;
  sortOptions: readonly SortOption[];
  onSortChange: (value: string) => void;
  /** Number of applied filters — drives the badge on the mobile filter button. */
  appliedFiltersCount?: number;
  /** Mobile: clicking the filter button. Desktop hides this button (rail is visible). */
  onFilterClick?: () => void;
  /** Optional right-side slot for page-specific actions (e.g. "Find warm intros" CTA). */
  rightSlot?: React.ReactNode;
  className?: string;
}

/**
 * Page-level toolbar for the investor table. Matches the visual + responsive
 * pattern of `TeamsToolbar` — title-with-count on desktop, filter button on
 * mobile, sort dropdown on the right.
 */
export function InvestorsToolbar(props: Props) {
  const { title, total, sortValue, sortOptions, onSortChange, appliedFiltersCount = 0, onFilterClick, rightSlot, className } = props;

  return (
    <div className={clsx(s.toolbar, className)} data-testid="investors-toolbar">
      <div className={s.left}>
        <button
          type="button"
          className={s.filterBtn}
          onClick={onFilterClick}
          data-testid="investors-filter-button"
          aria-label="Open filters"
        >
          <Image loading="lazy" alt="filter" src="/icons/filter.svg" height={20} width={20} />
          <span className={s.filterBtnLabel}>Filters</span>
          {appliedFiltersCount > 0 && <FilterCount count={appliedFiltersCount} />}
        </button>
        <div className={s.titleContainer}>
          <h1 className={s.title}>{title}</h1>
          <p className={s.count}>({total.toLocaleString()})</p>
        </div>
      </div>

      <div className={s.right}>
        {rightSlot}
        <SortDropdown sortByLabel="Sort by:" options={sortOptions} currentSort={sortValue} onSortChange={onSortChange} />
      </div>
    </div>
  );
}

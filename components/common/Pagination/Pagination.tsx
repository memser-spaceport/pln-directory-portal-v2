import { useMemo } from 'react';
import { clsx } from 'clsx';

import { CaretLeftIcon, CaretRightIcon } from '@/components/icons';
import { Button } from '@/components/common/Button';

import { generatePaginationItems } from './utils/generatePaginationItems';

import s from './Pagination.module.scss';

export interface PaginationButtonConfig {
  /** Whether to render the button at all */
  show?: boolean;
  /** Whether to show the text label */
  showLabel?: boolean;
  /** Custom label text */
  label?: string;
}

export interface PaginationProps {
  /** Total number of pages */
  count: number;
  /** Current page (1-indexed) */
  page: number;
  /** Callback fired when page changes */
  onChange: (page: number) => void;
  /** Number of sibling pages to show on each side of current page */
  siblingCount?: number;
  /** Number of pages to show at boundaries */
  boundaryCount?: number;
  /** Previous button configuration */
  previous?: PaginationButtonConfig;
  /** Next button configuration */
  next?: PaginationButtonConfig;
  /** Disable the component */
  disabled?: boolean;
  /** Additional class name */
  className?: string;
}

export function Pagination(props: PaginationProps) {
  const {
    count,
    page,
    onChange,
    siblingCount = 1,
    boundaryCount = 1,
    previous = {},
    next = {},
    disabled = false,
    className,
  } = props;

  const {
    show: showPrevious = true,
    showLabel: showPreviousLabel = true,
    label: previousLabel = 'Previous',
  } = previous;

  const {
    show: showNext = true,
    showLabel: showNextLabel = true,
    label: nextLabel = 'Next',
  } = next;

  const items = useMemo(
    () => generatePaginationItems(count, page, siblingCount, boundaryCount),
    [count, page, siblingCount, boundaryCount],
  );

  const handlePrevious = () => {
    if (page > 1 && !disabled) {
      onChange(page - 1);
    }
  };

  const handleNext = () => {
    if (page < count && !disabled) {
      onChange(page + 1);
    }
  };

  const handlePageClick = (pageNum: number) => {
    if (!disabled && pageNum !== page) {
      onChange(pageNum);
    }
  };

  if (count <= 0) {
    return null;
  }

  return (
    <nav className={clsx(s.root, className)} aria-label="Pagination">
      {showPrevious && (
        <div className={s.actions}>
          <Button
            style="border"
            variant="secondary"
            size="s"
            onClick={handlePrevious}
            disabled={page <= 1 || disabled}
            aria-label="Go to previous page"
            className={s.navButton}
          >
            <CaretLeftIcon className={s.navIcon} />
            {showPreviousLabel && <span>{previousLabel}</span>}
          </Button>
        </div>
      )}

      <div className={s.pages}>
        {items.map((item, index) =>
          item.type === 'ellipsis' ? (
            <span key={`ellipsis-${index}`} className={s.ellipsis}>
              ...
            </span>
          ) : (
            <button
              key={`page-${item.page}`}
              type="button"
              className={clsx(s.pageButton, { [s.selected]: item.selected, [s.disabled]: disabled })}
              onClick={() => handlePageClick(item.page!)}
              disabled={disabled}
              aria-label={`Go to page ${item.page}`}
              aria-current={item.selected ? 'page' : undefined}
            >
              {item.page}
            </button>
          ),
        )}
      </div>

      {showNext && (
        <div className={s.actions}>
          <Button
            style="border"
            variant="secondary"
            size="s"
            onClick={handleNext}
            disabled={page >= count || disabled}
            aria-label="Go to next page"
            className={s.navButton}
          >
            {showNextLabel && <span>{nextLabel}</span>}
            <CaretRightIcon className={s.navIcon} />
          </Button>
        </div>
      )}
    </nav>
  );
}

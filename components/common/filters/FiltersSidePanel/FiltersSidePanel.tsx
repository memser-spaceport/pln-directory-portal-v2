import React, { PropsWithChildren } from 'react';
import { clsx } from 'clsx';

import { Button } from '@/components/common/Button';
import FilterCount from '@/components/ui/filter-count';

import s from './FiltersSidePanel.module.scss';

interface Props {
  onClose?: () => void;
  clearParams: () => void;
  appliedFiltersCount: number;
  className?: string;
  bodyClassName?: string;
  hideFooter?: boolean;
  applyLabel?: string;
}

export function FiltersSidePanel(props: PropsWithChildren<Props>) {
  const { onClose, clearParams, children, appliedFiltersCount, className, bodyClassName, hideFooter, applyLabel } =
    props;

  return (
    <div className={clsx(s.root, className)}>
      <div className={s.header}>
        <h2 className={s.headerTitle}>
          Filters
          {appliedFiltersCount > 0 && <FilterCount count={appliedFiltersCount} />}
        </h2>
        <button className={s.clearAllBtn} onClick={clearParams}>
          Clear all
        </button>
      </div>

      <div className={clsx(s.body, bodyClassName)}>{children}</div>

      {!hideFooter && (
        <div className={s.footer}>
          <Button style="border" onClick={clearParams}>
            Clear filters
          </Button>

          <Button onClick={onClose}>{applyLabel || 'Apply filters'}</Button>
        </div>
      )}
    </div>
  );
}

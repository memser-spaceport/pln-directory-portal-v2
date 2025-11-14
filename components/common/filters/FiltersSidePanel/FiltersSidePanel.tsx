import React, { PropsWithChildren } from 'react';

import { Button } from '@/components/common/Button';
import FilterCount from '@/components/ui/filter-count';

import s from './FiltersSidePanel.module.scss';

interface Props {
  onClose?: () => void;
  clearParams: () => void;
  appliedFiltersCount: number;
}

export function FiltersSidePanel(props: PropsWithChildren<Props>) {
  const { onClose, clearParams, children, appliedFiltersCount } = props;

  return (
    <div className={s.root}>
      <div className={s.header}>
        <h2 className={s.headerTitle}>
          Filters
          {appliedFiltersCount > 0 && <FilterCount count={appliedFiltersCount} />}
        </h2>
        <button className={s.clearAllBtn} onClick={clearParams}>
          Clear all
        </button>
      </div>

      <div className={s.body}>{children}</div>

      <div className={s.footer}>
        <Button style="border" onClick={clearParams}>
          Clear filters
        </Button>

        <Button onClick={onClose}>Apply filters</Button>
      </div>
    </div>
  );
}

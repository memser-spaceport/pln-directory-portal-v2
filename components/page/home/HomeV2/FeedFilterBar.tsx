'use client';

import clsx from 'clsx';
import type { Ref } from 'react';

import { SortDropdown } from '@/components/common/filters/SortDropdown';
import { ALL_CAT, type TeamNewsCategoryId } from '@/components/page/home/TeamNews/constants';
import { SORT_OPTIONS } from '@/components/page/home/TeamNews/utils/sortTeamNewsClusters';
// Production Home's filter bar: the pill row, the phones' "Type:" dropdown and "Sort by:".
import tn from '@/components/page/home/TeamNews/TeamNews.module.scss';

import s from './HomeV2.module.scss';

/**
 * The new Home's filter bar, shared by Network Updates (LAB-3125) and the news page (LAB-3126): the stream's pills with
 * their counts (an empty pill is already left out of `categories`), a second press on the active pill going back to
 * All, the "Type:" dropdown on phones and "Sort by:" on the right.
 */
export function FeedFilterBar({
  categories,
  activeCategory,
  onCategory,
  sort,
  onSort,
  barRef,
  className,
}: {
  categories: Array<{ id: TeamNewsCategoryId; label: string; count: number }>;
  activeCategory: TeamNewsCategoryId;
  onCategory: (id: TeamNewsCategoryId) => void;
  sort: string;
  onSort: (value: string) => void;
  barRef?: Ref<HTMLDivElement>;
  className?: string;
}) {
  return (
    <div className={clsx(tn.filterBar, className)} ref={barRef}>
      <div className={tn.catRow}>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            className={clsx(tn.cat, c.id === ALL_CAT && s.catAll, { [tn.catActive]: activeCategory === c.id })}
            aria-pressed={activeCategory === c.id}
            // Pressing the active pill again clears it back to All.
            onClick={() => onCategory(activeCategory === c.id ? ALL_CAT : c.id)}
          >
            {c.label}
            {c.id !== ALL_CAT && <span>{c.count}</span>}
          </button>
        ))}
      </div>
      <div className={tn.filterActions}>
        <span className={tn.typeMobile}>
          <SortDropdown
            sortByLabel="Type:"
            options={categories.map((c) => ({ value: c.id, label: c.label }))}
            currentSort={activeCategory}
            onSortChange={(value) => onCategory(value as TeamNewsCategoryId)}
          />
        </span>
        <SortDropdown sortByLabel="Sort by:" options={SORT_OPTIONS} currentSort={sort} onSortChange={onSort} />
      </div>
    </div>
  );
}

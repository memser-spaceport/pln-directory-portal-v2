'use client';

import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import Image from 'next/image';

import { SORT_OPTIONS } from '@/utils/constants';
import { SortDropdown } from '@/components/common/filters/SortDropdown';
import FilterCount from '@/components/ui/filter-count';
import s from '@/components/page/teams/TeamsToolbar/TeamsToolbar.module.scss';

import { useMockTeamFilterStore } from './mockTeamFilterStore';

const TEAMS_SORT_OPTIONS = [
  { value: SORT_OPTIONS.DEFAULT, label: 'Default' },
  { value: SORT_OPTIONS.ASCENDING, label: 'A-Z (Ascending)' },
  { value: SORT_OPTIONS.DESCENDING, label: 'Z-A (Descending)' },
];

interface Props {
  totalTeams: number;
  filterCount: number;
  onOpenFilters: () => void;
}

/**
 * COPY-SIMPLIFY of production `TeamsToolbar`. Same markup + `TeamsToolbar.module.scss`,
 * wired to the mock filter store; analytics / loader side effects dropped.
 */
export function TeamsToolbarView({ totalTeams, filterCount, onOpenFilters }: Props) {
  const { params, setParam } = useMockTeamFilterStore();

  const searchBy = params.get('searchBy') || '';
  const sortBy = params.get('sort') || SORT_OPTIONS.DEFAULT;

  const inputRef = useRef<HTMLInputElement>(null);
  const [searchInput, setSearchInput] = useState(searchBy);

  useEffect(() => {
    setSearchInput(searchBy);
  }, [searchBy]);

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => setSearchInput(e.target.value);

  const onSubmitHandler = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (searchBy.trim() === searchInput.trim()) return;
    setParam('searchBy', searchInput);
  };

  const onSortChange = (value: string) => {
    if (value === sortBy) return;
    setParam('sort', value);
  };

  const onClearSearchClicked = () => {
    setSearchInput('');
    setParam('searchBy', '');
  };

  return (
    <div className={s.toolbar} data-testid="teams-toolbar">
      <div className={s.left}>
        <button className={s.filterBtn} onClick={onOpenFilters} data-testid="filter-button">
          <Image loading="lazy" alt="filter" src="/icons/filter.svg" height={20} width={20} />
          {filterCount > 0 && <FilterCount count={filterCount} />}
        </button>
        <div className={s.titleContainer}>
          <h1 className={s.title}>Teams</h1>
          <p className={s.count}>({totalTeams})</p>
        </div>
        <div className={s.searchContainer}>
          <form className={s.searchForm} onSubmit={onSubmitHandler} data-testid="search-form">
            <input
              ref={inputRef}
              value={searchInput}
              onChange={onInputChange}
              className={s.searchInput}
              placeholder="Search for a team"
              data-testid="search-input"
            />
            <div className={s.searchOptions}>
              {searchInput && (
                <button title="Clear" type="button" onClick={onClearSearchClicked} className={s.clearBtn}>
                  <Image loading="lazy" alt="close" src="/icons/close-gray.svg" height={16} width={16} />
                </button>
              )}
              <button title="Search" className={s.searchBtn} type="submit">
                <Image loading="lazy" alt="search" src="/icons/search.svg" height={16} width={16} />
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className={s.right}>
        <SortDropdown
          sortByLabel="Sort by:"
          options={TEAMS_SORT_OPTIONS}
          currentSort={sortBy}
          onSortChange={onSortChange}
        />
      </div>
    </div>
  );
}

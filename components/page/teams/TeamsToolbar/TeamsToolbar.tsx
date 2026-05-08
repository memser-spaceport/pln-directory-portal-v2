'use client';

import { IUserInfo } from '@/types/shared.types';
import { getAnalyticsUserInfo, getFilterCount, getQuery, triggerLoader } from '@/utils/common.utils';
import { EVENTS, SORT_OPTIONS, VIEW_TYPE_OPTIONS } from '@/utils/constants';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import FilterCount from '../../../ui/filter-count';
import Image from 'next/image';
import { useTeamAnalytics } from '@/analytics/teams.analytics';
import { SortDropdown } from '@/components/common/filters/SortDropdown';
import { useGetTeamsFilterAsObjectFromStore } from '@/hooks/teams/useGetTeamsFilterAsObjectFromStore';
import { useTeamFilterStore } from '@/services/teams';
import s from './TeamsToolbar.module.scss';

const TEAMS_SORT_OPTIONS = [
  { value: SORT_OPTIONS.DEFAULT, label: 'Default' },
  { value: SORT_OPTIONS.ASCENDING, label: 'A-Z (Ascending)' },
  { value: SORT_OPTIONS.DESCENDING, label: 'Z-A (Descending)' },
];

/**
 * Interface for the toolbar props
 */
interface IToolbar {
  totalTeams: number;
  userInfo: IUserInfo | undefined;
}

/**
 * TeamsToolbar component provides a UI for filtering, sorting, and searching teams.
 * @param props - Contains search parameters, total number of teams, and user information.
 */
export const TeamsToolbar = (props: IToolbar) => {
  const { userInfo, totalTeams } = props;

  const { setParam } = useTeamFilterStore();
  const searchParams = useGetTeamsFilterAsObjectFromStore();

  const searchBy = searchParams.searchBy || '';
  const sortBy = searchParams.sort || SORT_OPTIONS.DEFAULT;
  const view = searchParams.viewType || VIEW_TYPE_OPTIONS.GRID;

  const inputRef = useRef<HTMLInputElement>(null);
  const [searchInput, setSearchInput] = useState(searchBy);
  const analytics = useTeamAnalytics();

  const query = getQuery(searchParams);
  const filterCount = getFilterCount(query);

  /**
   * Handles the click event for opening the filter panel.
   */
  const onFilterClickHandler = () => {
    analytics.onTeamOpenFilterPanelClicked(getAnalyticsUserInfo(userInfo));
    document.dispatchEvent(new CustomEvent(EVENTS.SHOW_FILTER, { detail: true }));
  };

  /**
   * Handles the view type change event.
   * @param type - The selected view type.
   */
  const onViewtypeClickHandler = (type: string) => {
    if (view === type) {
      return;
    }
    analytics.onTeamViewTypeChanged(type, getAnalyticsUserInfo(userInfo));
    triggerLoader(true);
    setParam('viewType', type);
  };

  /**
   * Handles the input change event for the search field.
   * @param e - The change event.
   */
  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e?.target?.value);
  };

  /**
   * Handles the form submission for searching teams.
   * @param e - The submit event.
   */
  const onSubmitHandler = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (searchBy.trim() === searchInput.trim()) {
      return;
    }
    triggerLoader(true);
    analytics.onTeamSearch(searchInput, getAnalyticsUserInfo(userInfo));
    if (searchParams?.page) {
      searchParams.page = '1';
    }
    setParam('searchBy', searchInput);
  };

  const onSortChange = (value: string) => {
    if (value === sortBy) {
      return;
    }

    triggerLoader(true);

    analytics.onTeamSortByChanged('teams', value, getAnalyticsUserInfo(userInfo));
    setParam('sort', value);
  };

  const onClearSearchClicked = () => {
    setSearchInput('');
    setParam('searchBy', '');
  };

  useEffect(() => {
    if (searchBy) {
      inputRef.current?.focus();
    }
    setSearchInput(searchBy);
  }, [searchParams]);

  return (
    <div className={s.toolbar} data-testid="teams-toolbar">
      <div className={s.left}>
        <button className={s.filterBtn} onClick={onFilterClickHandler} data-testid="filter-button">
          <Image loading="lazy" alt="filter" src="/icons/filter.svg" height={20} width={20}></Image>
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
              onChange={(e) => onInputChange(e)}
              className={s.searchInput}
              placeholder="Search for a team"
              onFocus={(e) =>
                e.currentTarget.setSelectionRange(e.currentTarget.value.length, e.currentTarget.value.length)
              }
              data-testid="search-input"
            />

            <div className={s.searchOptions}>
              {searchInput && (
                <button
                  title="Clear"
                  type="button"
                  onClick={onClearSearchClicked}
                  className={s.clearBtn}
                  data-testid="clear-search-button"
                >
                  <Image loading="lazy" alt="close" src="/icons/close-gray.svg" height={16} width={16} />
                </button>
              )}
              <button title="Search" className={s.searchBtn} type="submit" data-testid="search-button">
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
};

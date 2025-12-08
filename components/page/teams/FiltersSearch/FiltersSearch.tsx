import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import { getAnalyticsUserInfo, triggerLoader } from '@/utils/common.utils';
import { useTeamAnalytics } from '@/analytics/teams.analytics';
import useUpdateQueryParams from '@/hooks/useUpdateQueryParams';
import { ITeamsSearchParams } from '@/types/teams.types';
import { IUserInfo } from '@/types/shared.types';
import { Input } from '@/components/common/form/Input';
import { CloseIcon, SearchIcon } from '@/components/icons';
import { useTeamFilterStore } from '@/services/teams';

import s from './FiltersSearch.module.scss';

interface Props {
  searchParams: ITeamsSearchParams;
  userInfo: IUserInfo | undefined;
}

export const FiltersSearch = (props: Props) => {
  const searchParams = props?.searchParams;
  const userInfo = props?.userInfo;
  const searchBy = searchParams.searchBy || '';
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchInput, setSearchInput] = useState(searchBy);
  const analytics = useTeamAnalytics();
  const { updateQueryParams } = useUpdateQueryParams();
  const { params, setParam } = useTeamFilterStore();

  useEffect(() => {
    const storeSearchBy = params.get('searchBy') || '';
    const urlSearchBy = searchBy || '';

    const currentSearchBy = storeSearchBy || urlSearchBy;
    setSearchInput(currentSearchBy);
  }, [searchBy, params]);

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
    updateQueryParams('searchBy', searchInput, searchParams);
  };

  /**
   * Clears the search input field.
   */
  const onClearSearchClicked = () => {
    setSearchInput('');

    setParam('searchBy', undefined);
    updateQueryParams('searchBy', '', searchParams);
  };

  return (
    <div className={s.root}>
      <form className={s.form} onSubmit={onSubmitHandler} data-testid="search-form">
        <Input
          ref={inputRef}
          value={searchInput}
          onChange={(e) => onInputChange(e)}
          placeholder="Search for a team"
          onFocus={(e) =>
            e.currentTarget.setSelectionRange(e.currentTarget.value.length, e.currentTarget.value.length)
          }
          data-testid="search-input"
          endIcon={
            searchInput ? (
              <button
                title="Clear"
                type="button"
                onClick={onClearSearchClicked}
                className={s.clearButton}
                data-testid="clear-search-button"
              >
                <CloseIcon color="#64748b" height={16} width={16} />
              </button>
            ) : (
              <button
                title="Search"
                className={s.searchButton}
                type="submit"
                data-testid="search-button"
              >
                <SearchIcon color="#64748b" height={16} width={16} />
              </button>
            )
          }
        />
      </form>
    </div>
  );
};

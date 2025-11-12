import React from 'react';

import { SORT_OPTIONS } from '@/utils/constants';
import { useTeamFilterStore, useTeamFilterCount } from '@/services/teams';
import { TeamsFilter } from '@/components/page/teams/TeamsFilter';
import { MobileFilterWrapper } from '@/components/common/filters/MobileFilterWrapper';
import { IUserInfo } from '@/types/shared.types';
import { ITeamFilterSelectedItems } from '@/types/teams.types';

interface TeamsMobileFiltersProps {
  filterValues?: ITeamFilterSelectedItems;
  userInfo?: IUserInfo;
  searchParams?: any;
}

/**
 * TeamsMobileFilters - Mobile filter controls for Teams page
 *
 * Uses shared MobileFilterWrapper component for consistent mobile UX across pages.
 * Note: filterValues may be undefined for mobile usage - TeamsFilter will render
 * without tag filters in that case.
 */
export const TeamsMobileFilters = ({ filterValues, userInfo, searchParams }: TeamsMobileFiltersProps) => {
  const { params, setParam } = useTeamFilterStore();
  const currentSort = params.get('sort') || SORT_OPTIONS.ASCENDING;
  const filterCount = useTeamFilterCount();

  const sortOptions = [
    { value: SORT_OPTIONS.ASCENDING, label: 'A-Z (Ascending)' },
    { value: SORT_OPTIONS.DESCENDING, label: 'Z-A (Descending)' },
  ];

  const handleSortChange = (sortOption: string) => {
    setParam('sort', sortOption);
  };

  return (
    <MobileFilterWrapper
      filterCount={filterCount}
      currentSort={currentSort}
      sortOptions={sortOptions}
      onSortChange={handleSortChange}
      renderFilter={(onClose) => (
        <TeamsFilter filterValues={filterValues} userInfo={userInfo} searchParams={searchParams} onClose={onClose} />
      )}
    />
  );
};

import React from 'react';

import { SORT_OPTIONS } from '@/utils/constants';
import { useFilterStore } from '@/services/members/store';
import { MembersFilter } from '@/components/page/members/MembersFilter';
import { useGetMembersFilterCount } from '@/components/page/members/hooks/useGetMembersFilterCount';
import { MobileFilterWrapper } from '@/components/common/filters/MobileFilterWrapper';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import { IAnalyticsUserInfo } from '@/types/shared.types';

interface MembersMobileFiltersProps {
  filterValues?: any;
  userInfo?: any;
  isUserLoggedIn?: boolean;
  searchParams?: any;
}

/**
 * MembersMobileFilters - Mobile filter controls for Members page
 *
 * Uses shared MobileFilterWrapper component for consistent mobile UX
 */
export const MembersMobileFilters = ({
  filterValues,
  userInfo,
  isUserLoggedIn,
  searchParams: propsSearchParams,
}: MembersMobileFiltersProps) => {
  const { params, setParam } = useFilterStore();
  const currentSort = params.get('sort') || SORT_OPTIONS.ASCENDING;
  const filterCount = useGetMembersFilterCount();
  const analytics = useMemberAnalytics();

  const sortOptions = [
    { value: SORT_OPTIONS.ASCENDING, label: 'A-Z (Ascending)' },
    { value: SORT_OPTIONS.DESCENDING, label: 'Z-A (Descending)' },
  ];

  const handleSortChange = (sortOption: string) => {
    setParam('sort', sortOption);
  };

  const handleFilterClose = () => {
    analytics.onFilterCloseClicked(userInfo as IAnalyticsUserInfo);
  };

  return (
    <MobileFilterWrapper
      filterCount={filterCount}
      currentSort={currentSort}
      sortOptions={sortOptions}
      onSortChange={handleSortChange}
      onFilterClose={handleFilterClose}
      renderFilter={(onClose) => (
        <MembersFilter
          filterValues={filterValues}
          userInfo={userInfo}
          isUserLoggedIn={isUserLoggedIn}
          searchParams={propsSearchParams}
          onClose={onClose}
        />
      )}
    />
  );
};

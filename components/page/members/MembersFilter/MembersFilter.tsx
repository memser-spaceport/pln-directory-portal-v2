'use client';
import React, { useState } from 'react';

import { ADMIN_ROLE } from '@/utils/constants';
import { OFFICE_HOURS_FILTER_PARAM_KEY, TOPICS_FILTER_PARAM_KEY } from '@/app/constants/filters';

import { useFilterStore } from '@/services/members/store';
import { useGetRoles } from '@/services/members/hooks/useGetRoles';
import { useGetTopics } from '@/services/members/hooks/useGetTopics';
import { useGetMembersFilterCount } from '@/components/page/members/hooks/useGetMembersFilterCount';
import { useMemberAnalytics } from '@/analytics/members.analytics';

import { IAnalyticsUserInfo, IUserInfo } from '@/types/shared.types';
import { FiltersPanelToggle } from '@/components/core/FiltersPanelToggle';
import { InvestorFilterToggle } from '@/components/core/InvestorFilterToggle';
import { FilterDivider } from '@/components/page/members/MembersFilter/FilterDivider';
import { FilterCheckSizeInput } from '@/components/page/members/MembersFilter/FilterCheckSizeInput';
import { FilterTagInput } from '@/components/form/FilterTagInput';
import { CalendarIcon } from '@/components/icons';
import { FiltersSidePanel } from '@/components/common/filters/FiltersSidePanel';

import { FilterSearch } from './FilterSearch';
import { FilterSection } from '@/components/common/filters/FilterSection';
import { FilterCheckboxListWithSearch } from './FilterCheckboxListWithSearch';

import s from './MembersFilter.module.scss';

export interface IMembersFilter {
  filterValues: any | undefined;
  userInfo: IUserInfo;
  isUserLoggedIn: boolean | undefined;
  searchParams: any;
  onClose?: () => void;
}

export const MembersFilter = (props: IMembersFilter) => {
  const { userInfo, onClose } = props;

  const isAdmin = userInfo?.roles?.includes(ADMIN_ROLE);

  const { setParam, clearParams, params } = useFilterStore();
  const appliedFiltersCount = useGetMembersFilterCount();
  const [shouldClearTopicsSearch, setShouldClearTopicsSearch] = useState(false);
  const analytics = useMemberAnalytics();

  // Wrap clearParams to include analytics
  const handleClearParams = () => {
    analytics.onClearAllClicked('Members', params.toString(), userInfo as IAnalyticsUserInfo);
    clearParams();
  };

  // Wrap onClose to include analytics for "Apply filters" button
  const handleClose = () => {
    analytics.onShowFilterResultClicked(userInfo as IAnalyticsUserInfo);
    if (onClose) {
      onClose();
    }
  };

  // Analytics callbacks for Topics filter
  const handleTopicsChange = (key: string, values: string[]) => {
    analytics.onMembersTopicsFilterSelected({ page: 'Members', topics: values });
  };

  const handleTopicsSearch = (searchText: string) => {
    analytics.onMembersTopicsFilterSearched({ page: 'Members', searchText });
  };

  // Analytics callbacks for Roles filter
  const handleRolesChange = (key: string, values: string[]) => {
    analytics.onMembersRolesFilterSelected({ page: 'Members', roles: values });
  };

  const handleRolesSearch = (searchText: string) => {
    analytics.onMembersRolesFilterSearched({ page: 'Members', searchText });
  };

  const handleRolesSelectAll = (wasChecked: boolean) => {
    // Only track analytics when selecting all, not when deselecting
    if (!wasChecked) {
      analytics.onMemberRoleFilterSelectAllClicked(userInfo as IAnalyticsUserInfo);
    }
  };

  return (
    <FiltersSidePanel onClose={handleClose} clearParams={handleClearParams} appliedFiltersCount={appliedFiltersCount}>
      {isAdmin && (
        <FilterSection>
          <FilterSearch label="Search for a member" placeholder="E.g. John Smith" />
          {/*<FiltersPanelToggle label="Include Friends of Protocol Labs" paramKey="includeFriends" />*/}
        </FilterSection>
      )}

      <FilterSection
        title="Office Hours"
        titleIcon={<CalendarIcon color="#1B4DFF" />}
        description="OH are short 1:1 calls to connect about topics of interest or help others with your expertise."
      >
        <FiltersPanelToggle
          label={
            <>
              Show all members with <br /> office hours
            </>
          }
          paramKey={OFFICE_HOURS_FILTER_PARAM_KEY}
          onChange={(checked) => {
            if (checked) {
              setParam(TOPICS_FILTER_PARAM_KEY, undefined);
              setShouldClearTopicsSearch(true);
            } else {
              setShouldClearTopicsSearch(false);
            }
          }}
        />

        <div className={s.delimiter} />
        <FilterCheckboxListWithSearch
          label="Search topics"
          paramKey={TOPICS_FILTER_PARAM_KEY}
          placeholder="E.g. AI, Staking, Governance"
          useGetDataHook={useGetTopics}
          defaultItemsToShow={0}
          shouldClearSearch={shouldClearTopicsSearch}
          onChange={handleTopicsChange}
          onSearch={handleTopicsSearch}
        />
      </FilterSection>

      <FilterSection title="Roles">
        <FilterCheckboxListWithSearch
          label="Search roles"
          paramKey="roles"
          placeholder="E.g. Founder, VP Marketing..."
          useGetDataHook={useGetRoles}
          defaultItemsToShow={4}
          onChange={handleRolesChange}
          onSearch={handleRolesSearch}
          onSelectAll={handleRolesSelectAll}
        />
      </FilterSection>

      <FilterSection title="Investors">
        <InvestorFilterToggle label="Show all Investors" paramKey="isInvestor" />

        <FilterDivider />

        <FilterCheckSizeInput
          label="Typical Check Size"
          minParamName="minTypicalCheckSize"
          maxParamName="maxTypicalCheckSize"
          allowedRange={{
            min: 0,
            max: 5000000,
          }}
          disabled={!params.get('isInvestor')}
        />

        <FilterDivider />

        <FilterTagInput
          selectLabel="Investment Focus"
          paramKey="investmentFocus"
          disabled={!params.get('isInvestor')}
        />
      </FilterSection>
    </FiltersSidePanel>
  );
};

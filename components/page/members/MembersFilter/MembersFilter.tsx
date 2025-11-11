'use client';
import React, { useState } from 'react';

import { ADMIN_ROLE } from '@/utils/constants';
import { OFFICE_HOURS_FILTER_PARAM_KEY, TOPICS_FILTER_PARAM_KEY } from '@/app/constants/filters';

import { useFilterStore } from '@/services/members/store';
import { useGetRoles } from '@/services/members/hooks/useGetRoles';
import { useGetTopics } from '@/services/members/hooks/useGetTopics';
import { useGetMembersFilterCount } from '@/components/page/members/hooks/useGetMembersFilterCount';

import { IUserInfo } from '@/types/shared.types';
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

  return (
    <FiltersSidePanel onClose={onClose} clearParams={clearParams} appliedFiltersCount={appliedFiltersCount}>
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
        />
      </FilterSection>

      <FilterSection title="Roles">
        <FilterCheckboxListWithSearch
          label="Search roles"
          paramKey="roles"
          placeholder="E.g. Founder, VP Marketing..."
          useGetDataHook={useGetRoles}
          defaultItemsToShow={4}
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

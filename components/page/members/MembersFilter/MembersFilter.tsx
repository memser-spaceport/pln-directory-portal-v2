'use client';
import React, { useState } from 'react';
import Image from 'next/image';

import { ADMIN_ROLE, EVENTS } from '@/utils/constants';
import { OFFICE_HOURS_FILTER_PARAM_KEY, TOPICS_FILTER_PARAM_KEY } from '@/app/constants/filters';

import { useFilterStore } from '@/services/members/store';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import { useGetRoles } from '@/services/members/hooks/useGetRoles';
import { useGetTopics } from '@/services/members/hooks/useGetTopics';
import { useGetMembersFilterCount } from '@/components/page/members/hooks/useGetMembersFilterCount';

import { getAnalyticsUserInfo } from '@/utils/common.utils';

import FilterCount from '@/components/ui/filter-count';
import { IUserInfo } from '@/types/shared.types';
import { FiltersPanelToggle } from '@/components/core/FiltersPanelToggle';

import { FilterSearch } from './FilterSearch';
import { FilterSection } from './FilterSection';
import { FilterCheckboxListWithSearch } from './FilterCheckboxListWithSearch';

import s from './MembersFilter.module.scss';
import { InvestorFilterToggle } from '@/components/core/InvestorFilterToggle';
import { FilterDivider } from '@/components/page/members/MembersFilter/FilterDivider';
import { FilterCheckSizeInput } from '@/components/common/FilterCheckSizeInput';
import { FilterTagInput } from '@/components/form/FilterTagInput';

export interface IMembersFilter {
  filterValues: any | undefined;
  userInfo: IUserInfo;
  isUserLoggedIn: boolean | undefined;
  searchParams: any;
  onClose?: () => void;
}

export const MembersFilter = (props: IMembersFilter) => {
  const userInfo = props?.userInfo;
  const isAdmin = userInfo?.roles?.includes(ADMIN_ROLE);
  const analytics = useMemberAnalytics();
  const { setParam, clearParams, params } = useFilterStore();
  const apliedFiltersCount = useGetMembersFilterCount();
  const [shouldClearTopicsSearch, setShouldClearTopicsSearch] = useState(false);

  const onCloseClickHandler = () => {
    document.dispatchEvent(new CustomEvent(EVENTS.SHOW_MEMBERS_FILTER, { detail: false }));
    analytics.onFilterCloseClicked(getAnalyticsUserInfo(userInfo));
  };

  const onShowClickHandler = () => {
    analytics.onShowFilterResultClicked(getAnalyticsUserInfo(userInfo));
    document.dispatchEvent(new CustomEvent(EVENTS.SHOW_MEMBERS_FILTER, { detail: false }));
  };

  return (
    <div className={s.root}>
      <div className={s.header}>
        <h2 className={s.headerTitle}>
          Filters
          {apliedFiltersCount > 0 && <FilterCount count={apliedFiltersCount} />}
        </h2>
        <button className={s.clearAllBtn} onClick={clearParams}>
          Clear all
        </button>
        <button className={s.closeBtn} onClick={onCloseClickHandler}>
          <Image alt="close" src="/icons/close.svg" height={16} width={16} />
        </button>
      </div>

      {/* Body */}
      <div className={s.body}>
        {isAdmin && (
          <FilterSection>
            <FilterSearch label="Search for a member" placeholder="E.g. John Smith" />
            {/*<FiltersPanelToggle label="Include Friends of Protocol Labs" paramKey="includeFriends" />*/}
          </FilterSection>
        )}

        <FilterSection
          title="Office Hours"
          titleIcon={<CalendarIcon />}
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
      </div>

      <div className={s.footer}>
        <button className={s.secondaryBtn} onClick={clearParams}>
          Clear filters
        </button>

        <button className={s.primaryBtn} onClick={props.onClose}>
          Apply filters
        </button>
      </div>
    </div>
  );
};

const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M16.25 2.1875H14.6875V1.875C14.6875 1.62636 14.5887 1.3879 14.4129 1.21209C14.2371 1.03627 13.9986 0.9375 13.75 0.9375C13.5014 0.9375 13.2629 1.03627 13.0871 1.21209C12.9113 1.3879 12.8125 1.62636 12.8125 1.875V2.1875H7.1875V1.875C7.1875 1.62636 7.08873 1.3879 6.91291 1.21209C6.7371 1.03627 6.49864 0.9375 6.25 0.9375C6.00136 0.9375 5.7629 1.03627 5.58709 1.21209C5.41127 1.3879 5.3125 1.62636 5.3125 1.875V2.1875H3.75C3.3356 2.1875 2.93817 2.35212 2.64515 2.64515C2.35212 2.93817 2.1875 3.3356 2.1875 3.75V16.25C2.1875 16.6644 2.35212 17.0618 2.64515 17.3549C2.93817 17.6479 3.3356 17.8125 3.75 17.8125H16.25C16.6644 17.8125 17.0618 17.6479 17.3549 17.3549C17.6479 17.0618 17.8125 16.6644 17.8125 16.25V3.75C17.8125 3.3356 17.6479 2.93817 17.3549 2.64515C17.0618 2.35212 16.6644 2.1875 16.25 2.1875ZM5.3125 4.0625C5.3125 4.31114 5.41127 4.5496 5.58709 4.72541C5.7629 4.90123 6.00136 5 6.25 5C6.49864 5 6.7371 4.90123 6.91291 4.72541C7.08873 4.5496 7.1875 4.31114 7.1875 4.0625H12.8125C12.8125 4.31114 12.9113 4.5496 13.0871 4.72541C13.2629 4.90123 13.5014 5 13.75 5C13.9986 5 14.2371 4.90123 14.4129 4.72541C14.5887 4.5496 14.6875 4.31114 14.6875 4.0625H15.9375V5.9375H4.0625V4.0625H5.3125ZM4.0625 15.9375V7.8125H15.9375V15.9375H4.0625Z"
      fill="#1B4DFF"
    />
  </svg>
);

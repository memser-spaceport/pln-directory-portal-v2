'use client';

import FilterCount from '@/components/ui/filter-count';
import { IUserInfo } from '@/types/shared.types';
import { getAnalyticsUserInfo } from '@/utils/common.utils';
import { ADMIN_ROLE, EVENTS } from '@/utils/constants';
import Image from 'next/image';
import React from 'react';
import { FilterMultiSelect } from './MembersFilter/FilterMultiSelect/FilterMultiSelect';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import { FiltersPanelToggle } from '@/components/core/FiltersPanelToggle';
import { useFilterStore } from '@/services/members/store';
import { FilterSection } from '@/components/page/members/MembersFilter/FilterSection';

import s from './MembersFilter/MembersFilter.module.scss';
import { useGetTopics } from '@/services/members/hooks/useGetTopics';
import { FilterSearch } from '@/components/page/members/MembersFilter/FilterSearch';
import { useGetMembersFilterCount } from '@/components/page/members/hooks/useGetMembersFilterCount';

export interface IMembersFilter {
  filterValues: any | undefined;
  userInfo: IUserInfo;
  isUserLoggedIn: boolean | undefined;
  searchParams: any;
  onClose?: () => void;
}

const MembersFilter = (props: IMembersFilter) => {
  const userInfo = props?.userInfo;
  const isAdmin = userInfo?.roles?.includes(ADMIN_ROLE);
  const analytics = useMemberAnalytics();
  const { params, clearParams } = useFilterStore();
  const apliedFiltersCount = useGetMembersFilterCount();

  const onCloseClickHandler = () => {
    document.dispatchEvent(new CustomEvent(EVENTS.SHOW_MEMBERS_FILTER, { detail: false }));
    analytics.onFilterCloseClicked(getAnalyticsUserInfo(userInfo));
  };

  const onShowClickHandler = () => {
    analytics.onShowFilterResultClicked(getAnalyticsUserInfo(userInfo));
    document.dispatchEvent(new CustomEvent(EVENTS.SHOW_MEMBERS_FILTER, { detail: false }));
  };

  return (
    <>
      <div className={s.root}>
        <div className={s.header}>
          <h2 className="team-filter__header__title">
            Filters
            {apliedFiltersCount > 0 && <FilterCount count={apliedFiltersCount} />}
          </h2>
          <button className="team-fitlter__header__clear-all-btn" onClick={clearParams}>
            Clear all
          </button>
          <button className="team-filter__header__closebtn" onClick={onCloseClickHandler}>
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
            <FiltersPanelToggle label="Only Show Members with Office Hours" paramKey="hasOfficeHours" />
            <FilterMultiSelect label="Search topics" placeholder="E.g. AI, Staking..." paramKey="topics" backLabel="Filters" useDataHook={useGetTopics} />
          </FilterSection>

          <FilterSection title="Roles">
            <FilterMultiSelect
              label="Search roles"
              placeholder="E.g. Founder, VP Marketing..."
              paramKey="roles"
              backLabel="Filters"
            />
          </FilterSection>

          <FilterSection title="Investors">
            <FiltersPanelToggle label="Show all Investors" paramKey="isInvestor" />

            <FilterDivider />

            <FilterRange
              label="Typical Check Size, USD"
              minParamName="minTypicalCheckSize"
              maxParamName="maxTypicalCheckSize"
              allowedRange={{
                min: 0,
                max: 5000000,
              }}
            />

            <FilterDivider />

            <FilterTagInput selectLabel="Investment Focus" paramKey="investmentFocus" />
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
      <style jsx>
        {`
          .team-filter {
            width: inherit;
            display: unset;
            position: fixed;
            border-right: 1px solid #e2e8f0;
            background: #fff;
            width: inherit;
            z-index: 3;
            // height: calc(100vh - 80px);
            height: inherit;
          }

          .team-filter__body__event {
            display: flex;
            gap: 20px;
            flex-direction: column;
          }

          .team-filter__body__ttl {
            color: #0f172a;
            font-size: 14px;
            font-weight: 600;
            line-height: 20px;
          }

          .team-filter__header {
            display: flex;
            padding: 20px 34px;
            width: 100%;
            justify-content: space-between;
            border-bottom: 1px solid #cbd5e1;
          }

          .team-filter__body {
            height: calc(100dvh - 130px);
            overflow: auto;
            padding: 20px 34px 10px 34px;
            flex-direction: column;
            display: flex;
            gap: 20px;
          }

          .team-filter__body__toggle-section {
            display: flex;
            gap: 8px;
            flex-direction: column;
            margin-block: 20px;
          }

          .team-filter__body__toggle-section__toggle-option__title-container {
            display: flex;
            gap: 4px;
            align-items: center;
          }

          .team-filter__body__toggle-section__toggle-option__title-container__collaborate-note {
            line-height: 20px;
            padding: 14px;
            text-align: center;
            font-size: 14px;
          }

          .team-filter__body__toggle-section__toggle-option__title-container__collaborate-note__icon {
            margin: 0 4px;
            display: inline-block;
            // border: 1px solid #e2e8f0;
            border-radius: 100%;
          }

          .team-filter__header__title {
            color: #0f172a;
            font-size: 18px;
            font-weight: 600;
            line-height: 20px;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .team-fitlter__header__clear-all-btn {
            display: none;
          }

          .team-filter__bl {
            width: 100%;
            height: 1px;
            border-top: 1px solid #cbd5e1;
          }

          .team-filter__body__toggle-section__toggle-option {
            display: flex;
            align-items: center;
            gap: 12px;
            justify-content: space-between;
          }

          .team-filter__body__toggle-section__toogle-option__title {
            color: #475569;
            font-size: 14px;
            font-weight: 400;
            line-height: 20px;
          }

          .team-filter__footer {
            //position: absolute;
            //box-shadow: 0px -2px 6px 0px #0f172a29;
            height: 60px;
            bottom: 0px;
            padding: 10px 24px;
            width: 100%;
            display: flex;
            align-items: center;
            gap: 10px;
            background-color: white;

            border-top: 1px solid #cbd5e1;
          }

          .team-filter__footer__clrall {
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 10px 24px;
            color: #0f172a;
            width: 50%;
            font-weight: 500;
            line-height: 20px;
            background: #fff;
          }

          .team-filter__footer__aply {
            background-color: #156ff7;
            padding: 10px 24px;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            font-weight: 500;
            line-height: 20px;
            font-size: 14px;
            width: 50%;
            color: #fff;
          }

          .team-filter__header__closebtn {
            background: transparent;
          }

          @media (min-width: 1024px) {
            .team-filter__footer {
              display: none;
            }

            .team-filter__header__closebtn {
              display: none;
            }

            .team-fitlter__header__clear-all-btn {
              display: unset;
              border: none;
              background: none;
              color: #156ff7;
              font-size: 13px;
              font-weight: 400;
              line-height: 20px;
            }

            .team-filter__body {
              margin-bottom: 50px;
              width: 100%;
              overflow-x: hidden;
              height: calc(100dvh - 140px);
            }
          }
        `}
      </style>
    </>
  );
};

export default MembersFilter;

const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M16.25 2.1875H14.6875V1.875C14.6875 1.62636 14.5887 1.3879 14.4129 1.21209C14.2371 1.03627 13.9986 0.9375 13.75 0.9375C13.5014 0.9375 13.2629 1.03627 13.0871 1.21209C12.9113 1.3879 12.8125 1.62636 12.8125 1.875V2.1875H7.1875V1.875C7.1875 1.62636 7.08873 1.3879 6.91291 1.21209C6.7371 1.03627 6.49864 0.9375 6.25 0.9375C6.00136 0.9375 5.7629 1.03627 5.58709 1.21209C5.41127 1.3879 5.3125 1.62636 5.3125 1.875V2.1875H3.75C3.3356 2.1875 2.93817 2.35212 2.64515 2.64515C2.35212 2.93817 2.1875 3.3356 2.1875 3.75V16.25C2.1875 16.6644 2.35212 17.0618 2.64515 17.3549C2.93817 17.6479 3.3356 17.8125 3.75 17.8125H16.25C16.6644 17.8125 17.0618 17.6479 17.3549 17.3549C17.6479 17.0618 17.8125 16.6644 17.8125 16.25V3.75C17.8125 3.3356 17.6479 2.93817 17.3549 2.64515C17.0618 2.35212 16.6644 2.1875 16.25 2.1875ZM5.3125 4.0625C5.3125 4.31114 5.41127 4.5496 5.58709 4.72541C5.7629 4.90123 6.00136 5 6.25 5C6.49864 5 6.7371 4.90123 6.91291 4.72541C7.08873 4.5496 7.1875 4.31114 7.1875 4.0625H12.8125C12.8125 4.31114 12.9113 4.5496 13.0871 4.72541C13.2629 4.90123 13.5014 5 13.75 5C13.9986 5 14.2371 4.90123 14.4129 4.72541C14.5887 4.5496 14.6875 4.31114 14.6875 4.0625H15.9375V5.9375H4.0625V4.0625H5.3125ZM4.0625 15.9375V7.8125H15.9375V15.9375H4.0625Z"
      fill="#1B4DFF"
    />
  </svg>
);

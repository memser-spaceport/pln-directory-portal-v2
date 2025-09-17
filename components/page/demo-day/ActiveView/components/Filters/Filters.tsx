import React from 'react';
import { useGetMembersFilterCount } from '@/components/page/members/hooks/useGetMembersFilterCount';
import s from '@/components/page/members/MembersFilter/MembersFilter.module.scss';
import FilterCount from '@/components/ui/filter-count';
import Image from 'next/image';
import { FilterSection } from '@/components/page/members/MembersFilter/FilterSection';
import { FilterSearch } from '@/components/page/members/MembersFilter/FilterSearch';
import { FiltersPanelToggle } from '@/components/core/FiltersPanelToggle';
import { FilterMultiSelect } from '@/components/page/members/MembersFilter/FilterMultiSelect';
import { useGetTopics } from '@/services/members/hooks/useGetTopics';
import { FilterDivider } from '@/components/page/members/MembersFilter/FilterDivider';
import { FilterRange } from '@/components/page/members/MembersFilter/FilterRange';
import { FilterTagInput } from '@/components/form/FilterTagInput';
import { IUserInfo } from '@/types/shared.types';
import { getAnalyticsUserInfo, getParsedValue } from '@/utils/common.utils';
import Cookies from 'js-cookie';
import { useFilterStore } from '@/services/members/store';
import { ADMIN_ROLE, EVENTS } from '@/utils/constants';

export const Filters = () => {
  const userInfo: IUserInfo = getParsedValue(Cookies.get('userInfo'));
  const isAdmin = userInfo?.roles?.includes(ADMIN_ROLE);
  const appliedFiltersCount = useGetMembersFilterCount();
  const { clearParams } = useFilterStore();

  return (
    <div className={s.root}>
      <div className={s.header}>
        <h2 className={s.title}>
          Filters
          {appliedFiltersCount > 0 && <FilterCount count={appliedFiltersCount} />}
        </h2>
        <button className="team-fitlter__header__clear-all-btn" onClick={clearParams}>
          Clear all
        </button>
      </div>

      {/* Body */}
      <div className={s.body}>
        <FilterSection title="Team Search">
          <FilterSearch placeholder="Search for a team" />
        </FilterSection>

        <FilterSection title="Industry">
          <div>local filter here</div>
          <div>results here</div>
        </FilterSection>

        <FilterSection title="Stage">
          <div>local filter here</div>
          <div>results here</div>
        </FilterSection>
      </div>

      {/*<div className={s.footer}>*/}
      {/*  <button className={s.secondaryBtn} onClick={clearParams}>*/}
      {/*    Clear filters*/}
      {/*  </button>*/}

      {/*  <button className={s.primaryBtn} onClick={props.onClose}>*/}
      {/*    Apply filters*/}
      {/*  </button>*/}
      {/*</div>*/}
    </div>
  );
};

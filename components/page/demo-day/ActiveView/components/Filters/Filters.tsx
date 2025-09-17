import React, { useState } from 'react';
import { useGetMembersFilterCount } from '@/components/page/members/hooks/useGetMembersFilterCount';
import s from '@/components/page/members/MembersFilter/MembersFilter.module.scss';
import FilterCount from '@/components/ui/filter-count';
import { FilterSection } from '@/components/page/members/MembersFilter/FilterSection';
import { FilterSearch } from '@/components/page/members/MembersFilter/FilterSearch';
import { FilterList, FilterOption } from './components/FilterList';
import { IUserInfo } from '@/types/shared.types';
import { getParsedValue } from '@/utils/common.utils';
import Cookies from 'js-cookie';
import { useFilterStore } from '@/services/members/store';
import { ADMIN_ROLE } from '@/utils/constants';

// Mock data for demonstration - replace with actual API calls
const INDUSTRY_OPTIONS: FilterOption[] = [
  { id: 'ai', name: 'Artificial Intelligence', count: 12 },
  { id: 'blockchain', name: 'Blockchain', count: 8 },
  { id: 'fintech', name: 'FinTech', count: 15 },
  { id: 'healthtech', name: 'HealthTech', count: 6 },
  { id: 'edtech', name: 'EdTech', count: 9 },
  { id: 'cleantech', name: 'CleanTech', count: 4 },
  { id: 'saas', name: 'SaaS', count: 18 },
  { id: 'ecommerce', name: 'E-commerce', count: 7 },
];

const STAGE_OPTIONS: FilterOption[] = [
  { id: 'pre-seed', name: 'Pre-Seed', count: 10 },
  { id: 'seed', name: 'Seed', count: 15 },
  { id: 'series-a', name: 'Series A', count: 8 },
  { id: 'series-b', name: 'Series B', count: 5 },
  { id: 'series-c', name: 'Series C', count: 3 },
  { id: 'growth', name: 'Growth', count: 2 },
];

export const Filters = () => {
  const userInfo: IUserInfo = getParsedValue(Cookies.get('userInfo'));
  const isAdmin = userInfo?.roles?.includes(ADMIN_ROLE);
  const appliedFiltersCount = useGetMembersFilterCount();
  const { clearParams } = useFilterStore();

  // State for filter selections
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedStages, setSelectedStages] = useState<string[]>([]);

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
          <FilterList
            options={INDUSTRY_OPTIONS}
            selectedOptions={selectedIndustries}
            onSelectionChange={setSelectedIndustries}
            placeholder="Search industries..."
            emptyMessage="No industries found"
          />
        </FilterSection>

        <FilterSection title="Stage">
          <FilterList
            options={STAGE_OPTIONS}
            selectedOptions={selectedStages}
            onSelectionChange={setSelectedStages}
            placeholder="Search stages..."
            emptyMessage="No stages found"
          />
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

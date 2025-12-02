'use client';

import React from 'react';
import last from 'lodash/last';
import isEmpty from 'lodash/isEmpty';
import { IAnalyticsUserInfo, IUserInfo } from '@/types/shared.types';
import { ITeamFilterSelectedItems } from '@/types/teams.types';
import { ADMIN_ROLE, FOCUS_AREAS_FILTER_KEYS } from '@/utils/constants';
import { triggerLoader } from '@/utils/common.utils';

import { createFilterGetter } from '@/services/teams/utils/createFilterGetter';
import Image from 'next/image';
import { useTeamFilterStore, useTeamFilterCount } from '@/services/teams';
import { FiltersSidePanel } from '@/components/common/filters/FiltersSidePanel';
import { FilterSection } from '@/components/common/filters/FilterSection';
import { GenericCheckboxList } from '@/components/common/filters/GenericCheckboxList';
import { FiltersSearch } from '@/components/page/teams/FiltersSearch';
import { FocusAreaFilter } from '@/components/core/FocusAreaFilter';
import { FundFilterToggle } from '@/components/core/FundFilterToggle';
import { useTeamAnalytics } from '@/analytics/teams.analytics';
import { FilterCheckSizeInput } from '@/components/page/members/MembersFilter/FilterCheckSizeInput';
import { FilterDivider } from '@/components/page/members/MembersFilter/FilterDivider';
import { InvestmentFocusFilter } from '@/components/page/teams/TeamsFilter/components/InvestmentFocusFilter';
import { getTierLabel } from '@/utils/team.utils';

export interface TeamsFilterProps {
  filterValues: ITeamFilterSelectedItems | undefined;
  userInfo?: IUserInfo;
  searchParams: any;
  onClose?: () => void;
}

/**
 * TeamsFilter - Modern teams filter using generic components
 *
 * Rebuilt using the generic filter infrastructure for consistency with Members filter.
 * Uses shared components: FiltersSidePanel, FilterSection, GenericFilterToggle, etc.
 */
export function TeamsFilter(props: TeamsFilterProps) {
  const { filterValues, userInfo, searchParams, onClose } = props;

  const { clearParams, params } = useTeamFilterStore();
  const appliedFiltersCount = useTeamFilterCount();
  const analytics = useTeamAnalytics();
  const isDirectoryAdmin = userInfo?.roles?.includes(ADMIN_ROLE);
  const isTierViewer = isDirectoryAdmin || !!userInfo?.isTierViewer;

  // Create data hooks at the top level (not conditionally)
  // These factory functions return data hooks that can be passed to GenericCheckboxList
  const getTeamTags = createFilterGetter(filterValues?.tags);
  const getMembershipSources = createFilterGetter(filterValues?.membershipSources);
  const getFundingStages = createFilterGetter(filterValues?.fundingStage);
  const getTiers = createFilterGetter(filterValues?.tiers, {
    formatLabel: (tier) => getTierLabel(tier.value, true),
  });

  // Wrap clearParams to include analytics
  const handleClearParams = () => {
    analytics.onClearAllFiltersClicked(userInfo as IAnalyticsUserInfo);
    clearParams();
  };

  // Wrap onClose to include analytics for "Apply filters" button
  const handleClose = () => {
    analytics.onTeamShowFilterResultClicked();
    if (onClose) {
      onClose();
    }
  };

  return (
    <FiltersSidePanel onClose={handleClose} clearParams={handleClearParams} appliedFiltersCount={appliedFiltersCount}>
      {isDirectoryAdmin && (
        <FilterSection title="Team Search">
          <FiltersSearch searchParams={searchParams} userInfo={userInfo} />
        </FilterSection>
      )}

      {/* Membership Source */}
      {isDirectoryAdmin && filterValues?.membershipSources && filterValues.membershipSources.length > 0 && (
        <FilterSection title="Membership Source">
          <GenericCheckboxList
            label="Search or select membership source"
            paramKey="membershipSources"
            placeholder="E.g. Direct..."
            filterStore={useTeamFilterStore}
            useGetDataHook={getMembershipSources}
            defaultItemsToShow={5}
            onChange={(key, values) => {
              triggerLoader(true);
              if (!isEmpty(values)) {
                const latestValue = last(values) || '';
                analytics.onFilterApplied('membershipSources', latestValue);
              }
            }}
          />
        </FilterSection>
      )}

      {isTierViewer && (
        <FilterSection
          title="Tiers"
          titleIcon={<Image src="/icons/stack-blue.svg" alt="stack" width={18} height={20} />}
        >
          <GenericCheckboxList
            hint={
              <div>
                Higher number = higher <br /> membership level
              </div>
            }
            paramKey="tiers"
            placeholder="E.g. Tier 1, Tier 2..."
            filterStore={useTeamFilterStore}
            useGetDataHook={getTiers}
            defaultItemsToShow={6}
            hideSearch
            onChange={() => {
              triggerLoader(true);
            }}
          />
        </FilterSection>
      )}

      {/* Focus Area */}
      {filterValues?.focusAreas && (
        <FilterSection title="Focus Area">
          <FocusAreaFilter
            title="Focus Area"
            uniqueKey={FOCUS_AREAS_FILTER_KEYS.teams as 'teamAncestorFocusAreas' | 'projectAncestorFocusAreas'}
            focusAreaRawData={filterValues.focusAreas.rawData}
            selectedItems={filterValues.focusAreas.selectedFocusAreas}
            searchParams={searchParams}
          />
        </FilterSection>
      )}

      {/* Tags (Industry Tags) */}
      {filterValues?.tags && filterValues.tags.length > 0 && (
        <FilterSection title="Tags">
          <GenericCheckboxList
            label="Search or select industry tags"
            paramKey="tags"
            placeholder="E.g. AI, DeSci, Neurotech"
            filterStore={useTeamFilterStore}
            useGetDataHook={getTeamTags}
            defaultItemsToShow={5}
            onChange={(key, values) => {
              triggerLoader(true);
              if (!isEmpty(values)) {
                const latestValue = last(values) || '';
                analytics.onFilterApplied('tags', latestValue);
              }
            }}
          />
        </FilterSection>
      )}

      {/* Company Stage */}
      {filterValues?.fundingStage && filterValues.fundingStage.length > 0 && (
        <FilterSection title="Company Stage">
          <GenericCheckboxList
            paramKey="fundingStage"
            placeholder="E.g. Seed, Series A..."
            filterStore={useTeamFilterStore}
            useGetDataHook={getFundingStages}
            defaultItemsToShow={10}
            onChange={(key, values) => {
              triggerLoader(true);
              if (!isEmpty(values)) {
                const latestValue = last(values) || '';
                analytics.onFilterApplied('fundingStage', latestValue);
              }
            }}
            hideSearch
          />
        </FilterSection>
      )}

      {/* Typical Check Size & Investment Focus */}
      <FilterSection title="Investment Funds">
        <FundFilterToggle label="Show all funds" paramKey="isFund" />

        <FilterDivider />

        <FilterCheckSizeInput
          label="Typical Check Size"
          minParamName="minTypicalCheckSize"
          maxParamName="maxTypicalCheckSize"
          filterStore={useTeamFilterStore}
          allowedRange={{
            min: 0,
            max: 5000000,
          }}
          disabled={!params.get('isFund')}
          onChange={() => {
            triggerLoader(true);
          }}
        />

        <FilterDivider />

        <InvestmentFocusFilter />
      </FilterSection>
    </FiltersSidePanel>
  );
}

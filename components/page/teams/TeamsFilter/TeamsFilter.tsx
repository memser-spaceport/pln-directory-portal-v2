'use client';

import React from 'react';
import { IUserInfo } from '@/types/shared.types';
import { ITeamFilterSelectedItems } from '@/types/teams.types';
import { FOCUS_AREAS_FILTER_KEYS } from '@/utils/constants';

import {
  getTeamTagsGetter,
  getTechnologiesGetter,
  getFundingStagesGetter,
  getMembershipSourcesGetter,
} from '@/services/teams/utils';
import { useTeamFilterStore, useTeamFilterCount } from '@/services/teams';
import { FiltersSidePanel } from '@/components/common/filters/FiltersSidePanel';
import { FilterSection } from '@/components/common/filters/FilterSection';
import { GenericFilterToggle } from '@/components/common/filters/GenericFilterToggle';
import { GenericCheckboxList } from '@/components/common/filters/GenericCheckboxList';
import { FiltersSearch } from '@/components/page/teams/FiltersSearch';
import FocusAreaFilter from '@/components/core/focus-area-filter/focus-area-filter';
import { Tooltip } from '@/components/core/tooltip/tooltip';
import Image from 'next/image';

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

  const { clearParams } = useTeamFilterStore();
  const appliedFiltersCount = useTeamFilterCount();

  // Create data hooks at the top level (not conditionally)
  // These factory functions return data hooks that can be passed to GenericCheckboxList
  const getTeamTags = getTeamTagsGetter(filterValues?.tags);
  const getMembershipSources = getMembershipSourcesGetter(filterValues?.membershipSources);
  const getFundingStages = getFundingStagesGetter(filterValues?.fundingStage);
  const getTechnologies = getTechnologiesGetter(filterValues?.technology);

  return (
    <FiltersSidePanel onClose={onClose} clearParams={clearParams} appliedFiltersCount={appliedFiltersCount}>
      <FilterSection title="Team Search">
        <FiltersSearch searchParams={searchParams} userInfo={userInfo} />
      </FilterSection>

      <FilterSection>
        <GenericFilterToggle
          label="Only Show Teams with Office Hours"
          paramKey="officeHoursOnly"
          filterStore={useTeamFilterStore}
        />
        <GenericFilterToggle
          label="Include Friends of Protocol Labs"
          paramKey="includeFriends"
          filterStore={useTeamFilterStore}
        />
        <GenericFilterToggle label="New Teams" paramKey="isRecent" filterStore={useTeamFilterStore} />
      </FilterSection>

      {/* Contributions */}
      <FilterSection title="Contributions">
        <GenericFilterToggle label="Host" paramKey="isHost" filterStore={useTeamFilterStore} />

        <div style={{ marginTop: '16px' }} />

        <GenericFilterToggle label="Sponsor" paramKey="isSponsor" filterStore={useTeamFilterStore} />
      </FilterSection>

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
            label="Search tags"
            paramKey="tags"
            placeholder="E.g. AI, Web3..."
            filterStore={useTeamFilterStore}
            useGetDataHook={getTeamTags}
            defaultItemsToShow={5}
          />
        </FilterSection>
      )}

      {/* Membership Source */}
      {filterValues?.membershipSources && filterValues.membershipSources.length > 0 && (
        <FilterSection title="Membership Source">
          <GenericCheckboxList
            label="Search membership sources"
            paramKey="membershipSources"
            placeholder="E.g. Direct..."
            filterStore={useTeamFilterStore}
            useGetDataHook={getMembershipSources}
            defaultItemsToShow={5}
          />
        </FilterSection>
      )}

      {/* Funding Stage */}
      {filterValues?.fundingStage && filterValues.fundingStage.length > 0 && (
        <FilterSection title="Funding Stage">
          <GenericCheckboxList
            label="Search funding stages"
            paramKey="fundingStage"
            placeholder="E.g. Seed, Series A..."
            filterStore={useTeamFilterStore}
            useGetDataHook={getFundingStages}
            defaultItemsToShow={5}
          />
        </FilterSection>
      )}

      {/* Technology */}
      {filterValues?.technology && filterValues.technology.length > 0 && (
        <FilterSection title="Technology">
          <GenericCheckboxList
            label="Search technologies"
            paramKey="technology"
            placeholder="E.g. IPFS, Filecoin..."
            filterStore={useTeamFilterStore}
            useGetDataHook={getTechnologies}
            defaultItemsToShow={5}
          />
        </FilterSection>
      )}

      {/* Asks */}
      {filterValues?.asks && (filterValues?.asks?.length ?? 0) < 1 && (
        <FilterSection>
          <div className="tags-container__title">
            Asks
            <Tooltip
              asChild
              trigger={<Image alt="info" height={16} width={16} src="/icons/info.svg" style={{ marginLeft: '5px' }} />}
              content={
                'Asks are specific requests for help or resources that your team needs to achieve your next milestones. Use this space to connect with others who can contribute their expertise, networks, or resources to support your project.'
              }
            />
          </div>
          <div style={{ padding: '12px 0', color: '#64748B', fontSize: '14px' }}>
            No open asks or requests at this time
          </div>
        </FilterSection>
      )}
    </FiltersSidePanel>
  );
}

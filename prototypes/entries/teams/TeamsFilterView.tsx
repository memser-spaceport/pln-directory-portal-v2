'use client';

import clsx from 'clsx';

import { createFilterGetter } from '@/services/teams/utils/createFilterGetter';
import { FiltersSidePanel } from '@/components/common/filters/FiltersSidePanel';
import { FilterSection } from '@/components/common/filters/FilterSection';
import { GenericCheckboxList } from '@/components/common/filters/GenericCheckboxList';
import { GenericFilterToggle } from '@/components/common/filters/GenericFilterToggle';
import { FilterCheckSizeInput } from '@/components/page/members/MembersFilter/FilterCheckSizeInput';
import { FilterDivider } from '@/components/page/members/MembersFilter/FilterDivider';
import { FilterTagInput } from '@/components/form/FilterTagInput';
import fs from '@/components/page/members/MembersFilter/MembersFilter.module.scss';

import { useMockTeamFilterStore } from './mockTeamFilterStore';
import { MOCK_TAGS, MOCK_MEMBERSHIP_SOURCES, MOCK_FUNDING_STAGES } from './mocks';

// Params that count toward the "applied filters" badge (mirrors production's tracked set).
const COUNTED_PARAMS = [
  'membershipSources',
  'tags',
  'fundingStage',
  'isFund',
  'minTypicalCheckSize',
  'maxTypicalCheckSize',
  'investmentFocus',
];

interface Props {
  onClose?: () => void;
}

/**
 * COPY-SIMPLIFY of production `TeamsFilter`. Reuses the real filter components
 * (FiltersSidePanel, FilterSection, GenericCheckboxList, GenericFilterToggle,
 * FilterCheckSizeInput, FilterTagInput) verbatim, wired to a mock filter store +
 * mock data via `createFilterGetter`. Permission-gated sections (Team Search,
 * Priority) and the Focus Area tree / Community Affiliations are omitted.
 */
export function TeamsFilterView({ onClose }: Props) {
  const { params, clearParams } = useMockTeamFilterStore();

  const appliedFiltersCount = COUNTED_PARAMS.filter((k) => params.get(k)).length;
  const isFund = params.get('isFund') === 'true';

  const getTeamTags = createFilterGetter(MOCK_TAGS);
  const getMembershipSources = createFilterGetter(MOCK_MEMBERSHIP_SOURCES);
  const getFundingStages = createFilterGetter(MOCK_FUNDING_STAGES);

  return (
    <FiltersSidePanel onClose={onClose} clearParams={clearParams} appliedFiltersCount={appliedFiltersCount}>
      {/* Membership Source */}
      <FilterSection title="Membership Source">
        <GenericCheckboxList
          label="Search or select membership source"
          paramKey="membershipSources"
          placeholder="E.g. Direct..."
          filterStore={useMockTeamFilterStore}
          useGetDataHook={getMembershipSources}
        />
      </FilterSection>

      {/* Tags (Industry Tags) */}
      <FilterSection title="Tags">
        <GenericCheckboxList
          label="Search or select industry tags"
          paramKey="tags"
          placeholder="E.g. AI, DeSci, Neurotech"
          filterStore={useMockTeamFilterStore}
          useGetDataHook={getTeamTags}
          defaultItemsToShow={5}
        />
      </FilterSection>

      {/* Company Stage */}
      <FilterSection title="Company Stage">
        <GenericCheckboxList
          paramKey="fundingStage"
          placeholder="E.g. Seed, Series A..."
          filterStore={useMockTeamFilterStore}
          useGetDataHook={getFundingStages}
          defaultItemsToShow={10}
          hideSearch
        />
      </FilterSection>

      {/* Investment Funds */}
      <FilterSection title="Investment Funds">
        <GenericFilterToggle
          label="Show all funds"
          paramKey="isFund"
          filterStore={useMockTeamFilterStore}
          onBeforeChange={(checked, setParam) => {
            if (checked) {
              setParam('minTypicalCheckSize', undefined);
              setParam('maxTypicalCheckSize', undefined);
              setParam('investmentFocus', undefined);
            }
          }}
          className={clsx(fs.Label, fs.toggle)}
        />

        <FilterDivider />

        <FilterCheckSizeInput
          label="Typical Check Size"
          minParamName="minTypicalCheckSize"
          maxParamName="maxTypicalCheckSize"
          filterStore={useMockTeamFilterStore}
          allowedRange={{ min: 0, max: 5000000 }}
          disabled={!isFund}
        />

        <FilterDivider />

        <FilterTagInput
          selectLabel="Investment Focus"
          paramKey="investmentFocus"
          filterStore={useMockTeamFilterStore}
          placeholder="E.g. AI, Staking, Governance"
          disabled={!isFund}
        />
      </FilterSection>
    </FiltersSidePanel>
  );
}

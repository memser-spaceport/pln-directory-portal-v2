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

import { useMockTeamFilterStore, countAppliedFilters } from './mockTeamFilterStore';
import { MOCK_TAGS, MOCK_MEMBERSHIP_SOURCES, MOCK_FUNDING_STAGES } from './mocks';

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

  const appliedFiltersCount = countAppliedFilters(params);
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

      {/*
        Inactive teams — on by default, so this switch is how you take them out
        rather than how you find them.

        A toggle and not a third tab: the row above the grid is All / Following,
        which is a scope of *relationship* — teams you've chosen to keep up with
        versus all of them. "Inactive" is a fact about the team, a different
        axis, and putting it in the same row would make that row mean two things.
        The panel is where the product already asks "which teams count", so it
        goes here, as the same `GenericFilterToggle` that runs "Show all funds"
        three sections down — which also gets it into the applied-filters count
        and under Clear all for free.

        Loose between two sections rather than in one of its own: a "Team status"
        heading over a single switch is a section that exists to hold a label.
        Production does the same with its PortCo founders toggle on Members.

        Below Membership Source rather than at the head of the panel: a control
        that ships on isn't setting the scope, it's refining it, and the first
        thing in a filter rail reads as the decision the rest hangs off. It's
        still high enough to find without scrolling.
      */}
      <GenericFilterToggle
        label="Show inactive teams"
        paramKey="showInactive"
        filterStore={useMockTeamFilterStore}
        className={clsx(fs.Label, fs.toggle)}
      />

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

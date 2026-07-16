'use client';

import { createFilterGetter } from '@/services/teams/utils/createFilterGetter';
import { FiltersSidePanel } from '@/components/common/filters/FiltersSidePanel';
import { FilterSection } from '@/components/common/filters/FilterSection';
import { GenericCheckboxList } from '@/components/common/filters/GenericCheckboxList';
import { SearchInput } from '@/components/common/filters/SearchInput';
import {
  buildWorkplaceTypeFacetItems,
  seniorityDisplayLabel,
  sortSeniorityValues,
  workplaceTypeDisplayLabel,
} from '@/utils/jobs.utils';

import { facetToFilterItems } from '@/components/page/jobs/JobsFilterBody/utils/facetToFilterItems';

import { useMockJobsFilterStore } from './mockJobsFilterStore';
import {
  MOCK_ROLE_CATEGORY_FACETS,
  MOCK_SENIORITY_FACETS,
  MOCK_WORKMODE_FACETS,
  MOCK_LOCATION_FACETS,
} from './mocks';

// Params that count toward the "applied filters" badge (mirrors production's tracked set, minus sort/q).
const COUNTED_PARAMS = ['roleCategory', 'seniority', 'workplaceType', 'location'];

interface Props {
  onClose?: () => void;
}

/**
 * COPY-SIMPLIFY of production `JobsFilterBody` + `FiltersContent`. Reuses the real
 * filter components (FiltersSidePanel, FilterSection, GenericCheckboxList, SearchInput)
 * verbatim, wired to a mock filter store + mock facets via `createFilterGetter`.
 * The production Focus Area tree is omitted (matches the teams prototype's approach).
 */
export function JobBoardFilterView({ onClose }: Props) {
  const { params, setParam, clearParams } = useMockJobsFilterStore();

  const appliedFiltersCount = COUNTED_PARAMS.filter((k) => params.get(k)).length;
  const qFromUrl = params.get('q') ?? '';

  const getRoleCategories = createFilterGetter(facetToFilterItems(MOCK_ROLE_CATEGORY_FACETS));
  const getSeniorities = createFilterGetter(facetToFilterItems(sortSeniorityValues(MOCK_SENIORITY_FACETS)), {
    formatLabel: (item) => seniorityDisplayLabel(item.value),
  });
  const getWorkplaceTypes = createFilterGetter(facetToFilterItems(buildWorkplaceTypeFacetItems(MOCK_WORKMODE_FACETS)), {
    formatLabel: (item) => workplaceTypeDisplayLabel(item.value),
  });
  const getLocations = createFilterGetter(facetToFilterItems(MOCK_LOCATION_FACETS));

  return (
    <FiltersSidePanel onClose={onClose} clearParams={clearParams} appliedFiltersCount={appliedFiltersCount} hideFooter>
      <FilterSection title="Search for a Job">
        <SearchInput
          value={qFromUrl}
          onChange={(value: string) => setParam('q', value.trim() || undefined)}
          placeholder="Search a team or role"
        />
      </FilterSection>

      <FilterSection title="Role Category">
        <GenericCheckboxList
          paramKey="roleCategory"
          placeholder="Search role categories..."
          filterStore={useMockJobsFilterStore}
          useGetDataHook={getRoleCategories}
          hideSearch
        />
      </FilterSection>

      <FilterSection title="Seniority">
        <GenericCheckboxList
          paramKey="seniority"
          placeholder="Search seniority..."
          filterStore={useMockJobsFilterStore}
          useGetDataHook={getSeniorities}
          hideSearch
          disableSorting
        />
      </FilterSection>

      <FilterSection title="Workplace type">
        <GenericCheckboxList
          hideSearch
          paramKey="workplaceType"
          placeholder="Search workplace types..."
          filterStore={useMockJobsFilterStore}
          useGetDataHook={getWorkplaceTypes}
          disableSorting
        />
      </FilterSection>

      <FilterSection title="Location">
        <GenericCheckboxList
          paramKey="location"
          placeholder="Search locations..."
          filterStore={useMockJobsFilterStore}
          useGetDataHook={getLocations}
          defaultItemsToShow={5}
          searchResultsToShow={10}
        />
      </FilterSection>
    </FiltersSidePanel>
  );
}

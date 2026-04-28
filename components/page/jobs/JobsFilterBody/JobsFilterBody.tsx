'use client';

import { useCallback, useMemo } from 'react';
import { useJobsAnalytics } from '@/analytics/jobs.analytics';
import { FilterSection } from '@/components/common/filters/FilterSection';
import { SearchInput } from '@/components/common/filters/SearchInput';
import { GenericCheckboxList } from '@/components/common/filters/GenericCheckboxList';
import { FocusAreaFilter, getJobsFocusAreaCount, toJobsTreeFilterItems } from '@/components/core/FocusAreaFilter';
import { createFilterGetter } from '@/services/teams/utils/createFilterGetter';
import { useJobsFilterStore } from '@/services/jobs/store';
import { useJobsFilters, useInfiniteJobsList } from '@/services/jobs/hooks/useJobsQueries';
import {
  buildWorkplaceTypeFacetItems,
  filterStateFromURL,
  seniorityDisplayLabel,
  sortSeniorityValues,
  workplaceTypeDisplayLabel,
} from '@/utils/jobs.utils';
import { URL_QUERY_VALUE_SEPARATOR } from '@/utils/constants';

import { facetToFilterItems } from './utils/facetToFilterItems';

export function JobsFilterBody() {
  const filtersQuery = useJobsFilters();
  const { totalRoles } = useInfiniteJobsList();
  const { setParam, params } = useJobsFilterStore();
  const analytics = useJobsAnalytics();

  const qFromUrl = params.get('q') ?? '';

  const handleSearchChange = useCallback(
    (value: string) => {
      const next = value.trim();
      setParam('q', next || undefined);
      analytics.onJobsSearched({
        search_query: next,
        result_count: totalRoles,
        filter_state: filterStateFromURL(params),
      });
    },
    [setParam, analytics, totalRoles, params],
  );

  const getRoleCategories = createFilterGetter(facetToFilterItems(filtersQuery.data?.roleCategory));
  const getSeniorities = createFilterGetter(
    facetToFilterItems(filtersQuery.data?.seniority ? sortSeniorityValues(filtersQuery.data.seniority) : undefined),
    { formatLabel: (item) => seniorityDisplayLabel(item.value) },
  );
  const getLocations = createFilterGetter(facetToFilterItems(filtersQuery.data?.location));
  const getWorkplaceTypes = createFilterGetter(
    facetToFilterItems(buildWorkplaceTypeFacetItems(filtersQuery.data?.workMode)),
    { formatLabel: (item) => workplaceTypeDisplayLabel(item.value) },
  );

  const focusSelectedIds = useMemo(() => {
    const raw = params.get('focus');
    return new Set<string>(raw ? raw.split(URL_QUERY_VALUE_SEPARATOR).filter(Boolean) : []);
  }, [params]);

  const focusTreeItems = useMemo(
    () => (filtersQuery.data?.focus ? toJobsTreeFilterItems(filtersQuery.data.focus) : []),
    [filtersQuery.data?.focus],
  );

  const handleFocusToggle = useCallback(
    (item: { id: string }) => {
      const current = params.get('focus');
      const values = current ? current.split(URL_QUERY_VALUE_SEPARATOR).filter(Boolean) : [];
      const idx = values.indexOf(item.id);
      if (idx >= 0) {
        values.splice(idx, 1);
      } else {
        values.push(item.id);
      }
      setParam('focus', values.length > 0 ? values.join(URL_QUERY_VALUE_SEPARATOR) : undefined);
      analytics.onJobsFiltersApplied({
        filter_type: 'focus',
        filter_value: item.id,
        result_count: totalRoles,
        filter_state: filterStateFromURL(params),
      });
    },
    [params, setParam, analytics, totalRoles],
  );

  if (filtersQuery.isError) return null;
  if (filtersQuery.isLoading || !filtersQuery.data) return null;

  return (
    <>
      <FilterSection title="Search for a Job">
        <SearchInput value={qFromUrl} onChange={handleSearchChange} placeholder="Search a team or role" />
      </FilterSection>

      <FilterSection title="Role Category">
        <GenericCheckboxList
          paramKey="roleCategory"
          placeholder="Search role categories..."
          filterStore={useJobsFilterStore}
          useGetDataHook={getRoleCategories}
          hideSearch
        />
      </FilterSection>

      <FilterSection title="Seniority">
        <GenericCheckboxList
          paramKey="seniority"
          placeholder="Search seniority..."
          filterStore={useJobsFilterStore}
          useGetDataHook={getSeniorities}
          hideSearch
          disableSorting
        />
      </FilterSection>

      {focusTreeItems.length > 0 && (
        <FilterSection title="Focus Area">
          <FocusAreaFilter
            items={focusTreeItems}
            selectedIds={focusSelectedIds}
            onToggle={handleFocusToggle}
            getCount={getJobsFocusAreaCount}
          />
        </FilterSection>
      )}

      <FilterSection title="Workplace type">
        <GenericCheckboxList
          hideSearch
          paramKey="workplaceType"
          placeholder="Search workplace types..."
          filterStore={useJobsFilterStore}
          useGetDataHook={getWorkplaceTypes}
          disableSorting
        />
      </FilterSection>

      <FilterSection title="Location">
        <GenericCheckboxList
          paramKey="location"
          placeholder="Search locations..."
          filterStore={useJobsFilterStore}
          useGetDataHook={getLocations}
        />
      </FilterSection>
    </>
  );
}

import { useMemo } from 'react';
import { useJobsBaseFilters, useJobsFilters } from '@/services/jobs/hooks/useJobsQueries';

import { mergeFacetsWithDisabled, mergeFocusTreeWithDisabled } from './utils/mergeFacetsWithDisabled';

export function useGetFilterValuesWithDisabledState() {
  const filtersQuery = useJobsFilters();
  const baseFiltersQuery = useJobsBaseFilters();

  const roleCategory = useMemo(
    () => mergeFacetsWithDisabled(baseFiltersQuery.data?.roleCategory, filtersQuery.data?.roleCategory),
    [baseFiltersQuery.data?.roleCategory, filtersQuery.data?.roleCategory],
  );

  const seniority = useMemo(
    () => mergeFacetsWithDisabled(baseFiltersQuery.data?.seniority, filtersQuery.data?.seniority),
    [baseFiltersQuery.data?.seniority, filtersQuery.data?.seniority],
  );

  const location = useMemo(() => {
    const locations = mergeFacetsWithDisabled(baseFiltersQuery.data?.location, filtersQuery.data?.location) || [];

    locations.sort((a, b) => b.count - a.count);

    return locations;
  }, [baseFiltersQuery.data?.location, filtersQuery.data?.location]);

  const workMode = useMemo(
    () => mergeFacetsWithDisabled(baseFiltersQuery.data?.workMode, filtersQuery.data?.workMode),
    [baseFiltersQuery.data?.workMode, filtersQuery.data?.workMode],
  );

  const focus = useMemo(
    () => mergeFocusTreeWithDisabled(baseFiltersQuery.data?.focus, filtersQuery.data?.focus),
    [baseFiltersQuery.data?.focus, filtersQuery.data?.focus],
  );

  return {
    focus,
    workMode,
    location,
    seniority,
    roleCategory,
  };
}

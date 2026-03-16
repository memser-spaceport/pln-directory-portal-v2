'use client';

import { useQueryStates } from 'nuqs';
import { useCallback } from 'react';
import { dealsFilterParsers } from '../searchParams';
import { useGetDealFilterValues } from '@/services/deals/hooks/useGetDealFilterValues';
import { DealsFilter } from '@/components/page/deals/DealsFilter/DealsFilter';
import { FiltersPanelSkeletonLoader } from '@/components/core/dashboard-pages-layout';
import Error from '@/components/core/error';

export default function DealsFiltersContent() {
  const [filters, setFilters] = useQueryStates(dealsFilterParsers, {
    history: 'replace',
    shallow: true,
  });

  const { data: filterValues, isLoading, isError } = useGetDealFilterValues();

  const handleClearAll = useCallback(() => {
    setFilters({ q: null, categories: null, audience: null, sort: null, page: null });
  }, [setFilters]);

  const handleSearchChange = useCallback(
    (value: string) => {
      setFilters({ q: value || null, page: 1 });
    },
    [setFilters]
  );

  const handleCategoriesChange = useCallback(
    (categories: string[]) => {
      setFilters({ categories: categories.length > 0 ? categories : null, page: 1 });
    },
    [setFilters]
  );

  const handleAudiencesChange = useCallback(
    (audiences: string[]) => {
      setFilters({ audience: audiences.length > 0 ? audiences : null, page: 1 });
    },
    [setFilters]
  );

  if (isError) {
    return <Error />;
  }

  if (isLoading || !filterValues) {
    return <FiltersPanelSkeletonLoader />;
  }

  return (
    <DealsFilter
      filterValues={filterValues}
      searchQuery={filters.q}
      selectedCategories={filters.categories}
      selectedAudiences={filters.audience}
      onSearchChange={handleSearchChange}
      onCategoriesChange={handleCategoriesChange}
      onAudiencesChange={handleAudiencesChange}
      onClearAll={handleClearAll}
    />
  );
}

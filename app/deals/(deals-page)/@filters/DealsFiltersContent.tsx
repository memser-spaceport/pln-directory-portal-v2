'use client';

import { useQueryStates } from 'nuqs';
import { useCallback } from 'react';
import { useDealsAnalytics } from '@/analytics/deals.analytics';
import { dealsFilterParsers } from '../searchParams';
import { useGetDealFilterValues } from '@/services/deals/hooks/useGetDealFilterValues';
import { useDealsAccess } from '@/services/deals/hooks/useDealsAccess';
import { DealsFilter } from '@/components/page/deals/DealsFilter/DealsFilter';
import { FiltersPanelSkeletonLoader } from '@/components/core/dashboard-pages-layout';
import Error from '@/components/core/error';
import s from './DealsFiltersContent.module.scss';

export default function DealsFiltersContent() {
  const [filters, setFilters] = useQueryStates(dealsFilterParsers, {
    history: 'replace',
    shallow: true,
  });

  const { hasAccess, isLoading: isAccessLoading } = useDealsAccess();
  const { data: filterValues, isLoading, isError } = useGetDealFilterValues();
  const analytics = useDealsAnalytics();
  const handleClearAll = useCallback(() => {
    analytics.trackFilterCleared();
    setFilters({ q: null, categories: null, audiences: null, sort: null, page: null });
  }, [setFilters, analytics]);

  const handleSearchChange = useCallback(
    (value: string) => {
      if (value) {
        analytics.trackSearchPerformed(value);
      }
      setFilters({ q: value || null, page: 1 });
    },
    [setFilters, analytics],
  );

  const handleCategoriesChange = useCallback(
    (categories: string[]) => {
      analytics.trackFilterApplied('categories', categories);
      setFilters({ categories: categories.length > 0 ? categories : null, page: 1 });
    },
    [setFilters, analytics],
  );

  const handleAudiencesChange = useCallback(
    (audiences: string[]) => {
      analytics.trackFilterApplied('audiences', audiences);
      setFilters({ audiences: audiences.length > 0 ? audiences : null, page: 1 });
    },
    [setFilters, analytics],
  );

  if (isAccessLoading || !hasAccess) {
    return null;
  }

  if (isError) {
    return <Error />;
  }

  if (isLoading || !filterValues) {
    return <FiltersPanelSkeletonLoader />;
  }

  return (
    <div className={s.root}>
      <div className={s.web}>
        <DealsFilter
          filterValues={filterValues}
          searchQuery={filters.q}
          selectedCategories={filters.categories}
          selectedAudiences={filters.audiences}
          onSearchChange={handleSearchChange}
          onCategoriesChange={handleCategoriesChange}
          onAudiencesChange={handleAudiencesChange}
          onClearAll={handleClearAll}
        />
      </div>
    </div>
  );
}

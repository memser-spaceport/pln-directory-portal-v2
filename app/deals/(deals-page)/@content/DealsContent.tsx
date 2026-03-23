'use client';

import { useQueryStates } from 'nuqs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { dealsFilterParsers } from '../searchParams';
import { useGetDeals } from '@/services/deals/hooks/useGetDeals';
import { useDealsAccess } from '@/services/deals/hooks/useDealsAccess';
import { DealsToolbar } from '@/components/page/deals/DealsToolbar/DealsToolbar';
import { DealsList } from '@/components/page/deals/DealsList/DealsList';
import { DealsSkeletonLoader } from '@/components/page/deals/DealsSkeletonLoader/DealsSkeletonLoader';
import { DealsEmptyState } from '@/components/page/deals/DealsEmptyState/DealsEmptyState';
import Error from '@/components/core/error';
import { MobileFilterWrapper } from '@/components/common/filters/MobileFilterWrapper/MobileFilterWrapper';
import { DealsFilter } from '@/components/page/deals/DealsFilter/DealsFilter';
import { useGetDealFilterValues } from '@/services/deals/hooks/useGetDealFilterValues';
import { DEAL_SORT_OPTIONS } from '@/services/deals/constants';
import { useDealsAnalytics } from '@/analytics/deals.analytics';
import { SubmitDealModal } from '@/components/page/deals/SubmitDealModal/SubmitDealModal';
import { SubmitDealSuccessModal } from '@/components/page/deals/SubmitDealSuccessModal/SubmitDealSuccessModal';
import s from './page.module.scss';

export default function DealsContent() {
  const router = useRouter();
  const { hasAccess, isLoading: isAccessLoading, isError: isAccessError } = useDealsAccess();

  useEffect(() => {
    if (!isAccessLoading && !isAccessError && !hasAccess) {
      router.replace('/members');
    }
  }, [hasAccess, isAccessLoading, isAccessError, router]);
  const [filters, setFilters] = useQueryStates(dealsFilterParsers, {
    history: 'replace',
    shallow: true,
  });

  const [loadingMore, setLoadingMore] = useState(false);

  const searchParams = useMemo(
    () => ({
      q: filters.q || undefined,
      categories: filters.categories.length > 0 ? filters.categories.join(',') : undefined,
      audiences: filters.audiences.length > 0 ? filters.audiences.join(',') : undefined,
      sort: filters.sort,
      page: filters.page,
    }),
    [filters],
  );

  const { data: dealsData, isLoading, isError } = useGetDeals(searchParams);
  const { data: filterValues } = useGetDealFilterValues();
  const analytics = useDealsAnalytics();

  const handleSortChange = useCallback(
    (sort: string) => {
      analytics.trackSortChanged(sort);
      setFilters({ sort: sort as 'newest' | 'alphabetical', page: 1 });
    },
    [setFilters, analytics],
  );

  const handleShowMore = useCallback(async () => {
    analytics.trackShowMoreClicked(filters.page + 1);
    setLoadingMore(true);
    await setFilters({ page: filters.page + 1 });
    setLoadingMore(false);
  }, [filters.page, setFilters, analytics]);

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

  if (isAccessLoading || (!hasAccess && !isAccessError)) {
    return <DealsSkeletonLoader />;
  }

  if (isAccessError || isError) {
    return <Error />;
  }

  if (isLoading && !dealsData) {
    return <DealsSkeletonLoader />;
  }

  const deals = dealsData?.deals || [];
  const hasMore = dealsData?.hasMore || false;

  const sortOptions = DEAL_SORT_OPTIONS.map((o) => ({ value: o.value, label: o.label }));

  return (
    <div className={s.root}>
      <DealsToolbar currentSort={filters.sort} onSortChange={handleSortChange} />
      <SubmitDealModal />
      <SubmitDealSuccessModal />

      {/* Mobile filters + sort (visible on mobile only) */}
      {filterValues && (
        <MobileFilterWrapper
          filterCount={filters.categories.length + filters.audiences.length + (filters.q ? 1 : 0)}
          currentSort={filters.sort}
          sortOptions={sortOptions}
          onSortChange={handleSortChange}
          onClearFilters={handleClearAll}
          renderFilter={(onClose) => (
            <DealsFilter
              filterValues={filterValues}
              searchQuery={filters.q}
              selectedCategories={filters.categories}
              selectedAudiences={filters.audiences}
              onSearchChange={handleSearchChange}
              onCategoriesChange={handleCategoriesChange}
              onAudiencesChange={handleAudiencesChange}
              onClearAll={() => {
                handleClearAll();
                onClose();
              }}
            />
          )}
        />
      )}

      {deals.length > 0 ? (
        <DealsList deals={deals} hasMore={hasMore} isLoadingMore={loadingMore} onShowMore={handleShowMore} />
      ) : (
        <DealsEmptyState
          onClearFilters={handleClearAll}
          hasFilters={filters.categories.length > 0 || filters.audiences.length > 0 || !!filters.q}
        />
      )}
    </div>
  );
}

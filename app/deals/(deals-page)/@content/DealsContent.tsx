'use client';

import { useQueryStates } from 'nuqs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { dealsFilterParsers } from '../searchParams';
import { useGetDeals } from '@/services/deals/hooks/useGetDeals';
import { useDealsAccess } from '@/services/deals/hooks/useDealsAccess';
import { IDealsSearchParams } from '@/types/deals.types';
import { DealsToolbar } from '@/components/page/deals/DealsToolbar/DealsToolbar';
import { DealsList } from '@/components/page/deals/DealsList/DealsList';
import { DealsSkeletonLoader } from '@/components/page/deals/DealsSkeletonLoader/DealsSkeletonLoader';
import EmptyResult from '@/components/core/empty-result';
import Error from '@/components/core/error';
import { MobileFilterWrapper } from '@/components/common/filters/MobileFilterWrapper/MobileFilterWrapper';
import { DealsFilter } from '@/components/page/deals/DealsFilter/DealsFilter';
import { useGetDealFilterValues } from '@/services/deals/hooks/useGetDealFilterValues';
import { DEAL_SORT_OPTIONS } from '@/services/deals/constants';
import s from './page.module.scss';

export default function DealsContent() {
  const router = useRouter();
  const { hasAccess, isLoading: isAccessLoading } = useDealsAccess();

  useEffect(() => {
    if (!isAccessLoading && !hasAccess) {
      router.replace('/members');
    }
  }, [hasAccess, isAccessLoading, router]);
  const [filters, setFilters] = useQueryStates(dealsFilterParsers, {
    history: 'replace',
    shallow: true,
  });

  const [loadingMore, setLoadingMore] = useState(false);

  const searchParams: IDealsSearchParams = useMemo(
    () => ({
      q: filters.q || undefined,
      categories: filters.categories.length > 0 ? filters.categories.join(',') : undefined,
      audience: filters.audience.length > 0 ? filters.audience.join(',') : undefined,
      sort: filters.sort,
      page: String(filters.page),
    }),
    [filters]
  );

  const { data: dealsData, isLoading, isError } = useGetDeals(searchParams);
  const { data: filterValues } = useGetDealFilterValues();

  const handleSortChange = useCallback(
    (sort: string) => {
      setFilters({ sort: sort as 'newest' | 'alphabetical', page: 1 });
    },
    [setFilters]
  );

  const handleShowMore = useCallback(async () => {
    setLoadingMore(true);
    await setFilters({ page: filters.page + 1 });
    setLoadingMore(false);
  }, [filters.page, setFilters]);

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

  if (isAccessLoading || !hasAccess) {
    return <DealsSkeletonLoader />;
  }

  if (isError) {
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

      {/* Mobile filters + sort (visible on mobile only) */}
      {filterValues && (
        <MobileFilterWrapper
          filterCount={filters.categories.length + filters.audience.length + (filters.q ? 1 : 0)}
          currentSort={filters.sort}
          sortOptions={sortOptions}
          onSortChange={handleSortChange}
          renderFilter={(onClose) => (
            <DealsFilter
              filterValues={filterValues}
              searchQuery={filters.q}
              selectedCategories={filters.categories}
              selectedAudiences={filters.audience}
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
        <EmptyResult />
      )}
    </div>
  );
}

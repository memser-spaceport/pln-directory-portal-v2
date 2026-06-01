'use client';

import { useMemo } from 'react';
import { SortDropdown } from '@/components/common/filters/SortDropdown';
import { Pagination } from '@/components/common/Pagination/Pagination';
import { useGetFounders } from '@/services/founders/hooks/useGetFounders';
import { DEFAULT_PAGE_SIZE } from '@/services/founders/constants';
import type { FounderListParams } from '@/services/founders/types';
import type { foundersFilterParsers } from '@/app/founders/(founders-page)/searchParams';
import type { useQueryStates } from 'nuqs';
import { FounderTable } from '../FounderTable/FounderTable';
import { useFoundersAnalytics } from '@/analytics/founders.analytics';
import s from './FoundersTableSection.module.scss';

type Filters = ReturnType<typeof useQueryStates<typeof foundersFilterParsers>>[0];
type SetFilters = ReturnType<typeof useQueryStates<typeof foundersFilterParsers>>[1];

interface Props {
  filters: Filters;
  setFilters: SetFilters;
  canEdit: boolean;
  canView: boolean;
}

const SORT_OPTIONS = [
  { label: 'Alignment (high–low)', value: 'alignmentMax:desc' },
  { label: 'Alignment (low–high)', value: 'alignmentMax:asc' },
  { label: 'PLVS Score (high–low)', value: 'plvsScore:desc' },
  { label: 'Name A–Z', value: 'name:asc' },
  { label: 'Name Z–A', value: 'name:desc' },
] as const;

function hasActiveFilters(filters: Filters): boolean {
  return (
    !!filters.q ||
    filters.fund.length > 0 ||
    filters.status.length > 0 ||
    filters.source.length > 0 ||
    filters.minAlignment > 0 ||
    filters.minPlnProximity > 0
  );
}

export default function FoundersTableSection({ filters, setFilters, canView }: Props) {
  const analytics = useFoundersAnalytics();

  const params: FounderListParams = useMemo(
    () => ({
      q: filters.q || undefined,
      fund: filters.fund.length ? filters.fund : undefined,
      status: filters.status.length ? filters.status : undefined,
      source: filters.source.length ? filters.source : undefined,
      minAlignment: filters.minAlignment > 0 ? filters.minAlignment : undefined,
      minPlnProximity: filters.minPlnProximity > 0 ? filters.minPlnProximity : undefined,
      sort: filters.sort || undefined,
      page: filters.page,
      limit: DEFAULT_PAGE_SIZE,
    }),
    [filters],
  );

  const { data, isLoading, isError } = useGetFounders(params, canView);

  const founders = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / DEFAULT_PAGE_SIZE);
  const filtersActive = hasActiveFilters(filters);

  const handleSortChange = (value: string) => {
    setFilters({ sort: value || null, page: 1 } as never);
    analytics.onFilterApplied('sort', value);
  };

  const handlePageChange = (page: number) => {
    setFilters({ page } as never);
  };

  const handleClearFilters = () => {
    setFilters({
      q: null,
      fund: null,
      status: null,
      source: null,
      minAlignment: null,
      minPlnProximity: null,
      page: null,
    } as never);
  };

  if (isError) {
    return <div className={s.error}>Couldn&apos;t load founders. Try again in a moment.</div>;
  }

  return (
    <div className={s.root}>
      <div className={s.actionBar}>
        <div className={s.actionBarLeft}>
          <span className={s.countLabel}>
            {total > 0 ? `${total.toLocaleString()} founders` : isLoading ? '' : '0 founders'}
          </span>
        </div>
        <div className={s.actionBarRight}>
          <SortDropdown options={SORT_OPTIONS} currentSort={filters.sort} onSortChange={handleSortChange} />
        </div>
      </div>

      <FounderTable
        founders={founders}
        selectedFounderId={filters.founderId || null}
        onRowClick={(id) => setFilters({ founderId: id } as never, { history: 'push' } as never)}
        isLoading={isLoading}
      />

      {!isLoading && founders.length === 0 && filtersActive && (
        <div className={s.empty}>
          <p>No founders match your filters.</p>
          <button className={s.clearBtn} onClick={handleClearFilters}>
            Clear filters
          </button>
        </div>
      )}

      {!isLoading && founders.length === 0 && !filtersActive && data && (
        <div className={s.empty}>
          <p>No founders found.</p>
        </div>
      )}

      <div className={s.footer}>
        <span className={s.footerCount}>
          {total > 0 ? `${total.toLocaleString()} founders total` : ''}
        </span>
      </div>

      {totalPages > 1 && (
        <div className={s.paginationWrapper}>
          <Pagination count={totalPages} page={filters.page} onChange={handlePageChange} />
        </div>
      )}
    </div>
  );
}

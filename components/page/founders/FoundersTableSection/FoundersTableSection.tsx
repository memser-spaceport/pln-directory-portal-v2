'use client';

import { useCallback, useMemo } from 'react';
import { SortDropdown } from '@/components/common/filters/SortDropdown';
import { useGetFounders } from '@/services/founders/hooks/useGetFounders';
import { DEFAULT_PAGE_SIZE } from '@/services/founders/constants';
import type { FounderListParams } from '@/services/founders/types';
import type { foundersFilterParsers } from '@/app/founders/(founders-page)/searchParams';
import type { useQueryStates } from 'nuqs';
import { FounderTable } from '../FounderTable/FounderTable';
import { FounderColumnChooser } from '../FounderColumnChooser/FounderColumnChooser';
import { useFounderColumnStore } from '@/services/founders/store';
import { exportFoundersCsv } from '../utils/exportCsv';
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
  const visibleColumns = useFounderColumnStore((s) => s.visibleColumns);

  const params: FounderListParams = useMemo(
    () => ({
      q: filters.q || undefined,
      fund: filters.fund.length ? filters.fund : undefined,
      status: filters.status.length ? filters.status : undefined,
      source: filters.source.length ? filters.source : undefined,
      minAlignment: filters.minAlignment > 0 ? filters.minAlignment : undefined,
      minPlnProximity: filters.minPlnProximity > 0 ? filters.minPlnProximity : undefined,
      sort: filters.sort || undefined,
      limit: DEFAULT_PAGE_SIZE,
    }),
    [filters],
  );

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetFounders(params, canView);

  const founders = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);
  const total = data?.pages.at(-1)?.total ?? 0;
  const filtersActive = hasActiveFilters(filters);

  const handleSortChange = (value: string) => {
    setFilters({ sort: value || null } as never);
    analytics.onFilterApplied('sort', value);
  };

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleClearFilters = () => {
    setFilters({
      q: null,
      fund: null,
      status: null,
      source: null,
      minAlignment: null,
      minPlnProximity: null,
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
          <FounderColumnChooser />
          <button
            className={s.exportBtn}
            onClick={() => exportFoundersCsv(founders, visibleColumns, `founders-${new Date().toISOString().slice(0, 10)}.csv`)}
            disabled={founders.length === 0}
          >
            <ExportIcon />
            Export CSV
          </button>
        </div>
      </div>

      <FounderTable
        founders={founders}
        selectedFounderId={filters.founderId || null}
        onRowClick={(id) => setFilters({ founderId: id } as never, { history: 'push' } as never)}
        isLoading={isLoading}
        visibleColumns={visibleColumns}
        onLoadMore={handleLoadMore}
        hasMore={hasNextPage ?? false}
        isFetchingMore={isFetchingNextPage}
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
    </div>
  );
}

const ExportIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 15V3" />
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="m7 10 5 5 5-5" />
  </svg>
);

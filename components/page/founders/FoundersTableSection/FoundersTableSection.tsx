'use client';

import { useCallback, useMemo, useState } from 'react';
import { Dialog } from '@base-ui-components/react/dialog';
import { useSwipeable } from 'react-swipeable';
import { SortDropdown } from '@/components/common/filters/SortDropdown';
import { useGetFounders } from '@/services/founders/hooks/useGetFounders';
import { DEFAULT_PAGE_SIZE } from '@/services/founders/constants';
import type { FounderListParams } from '@/services/founders/types';
import type { foundersFilterParsers } from '@/app/founders/(founders-page)/searchParams';
import type { useQueryStates } from 'nuqs';
import { FounderTable } from '../FounderTable/FounderTable';
import { FounderColumnChooser } from '../FounderColumnChooser/FounderColumnChooser';
import { FoundersFilterRail } from '../FoundersFilterRail/FoundersFilterRail';
import { useFounderColumnStore } from '@/services/founders/store';
import { exportFoundersCsv } from '../utils/exportCsv';
import { useFoundersAnalytics } from '@/analytics/founders.analytics';
import { CloseIcon, PlusIcon } from '@/components/icons';
import { Button } from '@/components/common/Button';
import s from './FoundersTableSection.module.scss';

type Filters = ReturnType<typeof useQueryStates<typeof foundersFilterParsers>>[0];
type SetFilters = ReturnType<typeof useQueryStates<typeof foundersFilterParsers>>[1];

interface Props {
  filters: Filters;
  setFilters: SetFilters;
  canEdit: boolean;
  canView: boolean;
  onHowScored?: () => void;
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

function countActiveFilters(filters: Filters): number {
  let n = 0;
  if (filters.q) n++;
  n += filters.fund.length;
  n += filters.status.length;
  n += filters.source.length;
  if (filters.minAlignment > 0) n++;
  if (filters.minPlnProximity > 0) n++;
  return n;
}

export default function FoundersTableSection({ filters, setFilters, canView, onHowScored }: Props) {
  const analytics = useFoundersAnalytics();
  const visibleColumns = useFounderColumnStore((s) => s.visibleColumns);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const swipeHandlers = useSwipeable({
    onSwipedDown: () => setFiltersOpen(false),
  });

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
  const filterCount = countActiveFilters(filters);

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
          {onHowScored && (
            <button type="button" className={s.howScoredLink} onClick={onHowScored}>
              How are scores calculated?
            </button>
          )}
        </div>
        <div className={s.actionBarRight}>
          <button type="button" className={s.mobileFilterBtn} onClick={() => setFiltersOpen(true)}>
            <PlusIcon color="#455468" />
            Filters
            {filterCount > 0 && <span className={s.mobileFilterBadge}>{filterCount}</span>}
          </button>
          <SortDropdown options={SORT_OPTIONS} currentSort={filters.sort} onSortChange={handleSortChange} />
          <FounderColumnChooser />
          <button
            className={s.exportBtn}
            onClick={() => exportFoundersCsv(founders, visibleColumns, `founders-${new Date().toISOString().slice(0, 10)}.csv`)}
            disabled={founders.length === 0}
          >
            <ExportIcon />
            <span className={s.exportBtnLabel}>Export CSV</span>
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

      <Dialog.Root open={filtersOpen} onOpenChange={setFiltersOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className={s.drawerBackdrop} />
          <Dialog.Popup className={s.drawerPopup}>
            <div className={s.drawerHandle} {...swipeHandlers} />
            <div className={s.drawerHeader} {...swipeHandlers}>
              <Dialog.Title className={s.drawerTitle}>Filters</Dialog.Title>
              <button className={s.drawerClose} onClick={() => setFiltersOpen(false)}>
                <CloseIcon />
              </button>
            </div>
            <div className={s.drawerContent}>
              <FoundersFilterRail filters={filters} setFilters={setFilters} />
            </div>
            <div className={s.drawerFooter}>
              <Button style="border" onClick={handleClearFilters}>Clear filters</Button>
              <Button onClick={() => setFiltersOpen(false)}>Apply filters</Button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
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

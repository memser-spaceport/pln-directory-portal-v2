'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryStates } from 'nuqs';
import { Tabs } from '@/components/common/Tabs/Tabs';
import { SortDropdown, SortOption } from '@/components/common/filters/SortDropdown';
import { useGetInvestors } from '@/services/investors/hooks/useGetInvestors';
import { useGetCoInvestorTeams } from '@/services/investors/hooks/useGetCoInvestorTeams';
import { useInvestorColumnStore, useSavedViewsStore } from '@/services/investors/store';
import { useInvestorsAccess } from '@/services/rbac/hooks/useInvestorsAccess';
import { investorsFilterParsers } from '@/app/investors/(investors-page)/searchParams';
import type { InvestorListParams } from '@/services/investors/types';
import { OutreachInvestorTable } from '../OutreachInvestorTable/OutreachInvestorTable';
import { InvestorsTableSkeleton } from '../OutreachInvestorTable/InvestorsTableSkeleton';
import { ColumnChooser } from '../ColumnChooser/ColumnChooser';
import { SaveViewPopover } from '../SaveViewPopover/SaveViewPopover';
import { exportInvestorsCsv } from '../utils/exportCsv';
import s from './InvestorsTableSection.module.scss';

interface Props {
  tabDefaults?: Partial<InvestorListParams>;
  tab: 'all' | 'co-investors';
  tabs: Array<{ value: string; label: string; badge?: string }>;
  activeTab: string;
  onTabChange: (tab: string) => void;
  enableSaveView?: boolean;
  onCountChange?: (count: number) => void;
}

const SORT_OPTIONS: readonly SortOption[] = [
  { value: '', label: 'Most engaged first' },
  { value: 'last_name:asc', label: 'Name (A-Z)' },
  { value: 'last_name:desc', label: 'Name (Z-A)' },
  { value: 'last_sent_date:desc', label: 'Recently engaged' },
];

function hasActiveFilters(filters: ReturnType<typeof useQueryStates<typeof investorsFilterParsers>>[0]): boolean {
  return (
    !!filters.q ||
    filters.source.length > 0 ||
    filters.investor_type.length > 0 ||
    filters.stage_focus.length > 0 ||
    filters.sector_tags.length > 0 ||
    !!filters.geo_focus ||
    filters.email_status.length > 0 ||
    filters.engagement_tier.length > 0 ||
    filters.enrichment_status.length > 0 ||
    filters.in_lab_os ||
    filters.is_co_investor ||
    !!filters.co_invested_team_id ||
    filters.tags.length > 0
  );
}

export function InvestorsTableSection({
  tabDefaults = {},
  tab,
  tabs,
  activeTab,
  onTabChange,
  enableSaveView = true,
  onCountChange,
}: Props) {
  const [filters, setFilters] = useQueryStates(investorsFilterParsers, {
    history: 'replace',
    shallow: true,
  });
  const access = useInvestorsAccess();
  const visibleColumns = useInvestorColumnStore((s) => s.visibleColumns);
  const saveView = useSavedViewsStore((s) => s.actions.saveView);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const params: InvestorListParams = useMemo(
    () => ({
      q: filters.q || undefined,
      source: filters.source.length ? (filters.source as InvestorListParams['source']) : undefined,
      investor_type: filters.investor_type.length
        ? (filters.investor_type as InvestorListParams['investor_type'])
        : undefined,
      stage_focus: filters.stage_focus.length ? (filters.stage_focus as InvestorListParams['stage_focus']) : undefined,
      sector_tags: filters.sector_tags.length ? (filters.sector_tags as InvestorListParams['sector_tags']) : undefined,
      geo_focus: filters.geo_focus || undefined,
      email_status: filters.email_status.length
        ? (filters.email_status as InvestorListParams['email_status'])
        : undefined,
      engagement_tier: filters.engagement_tier.length
        ? (filters.engagement_tier as InvestorListParams['engagement_tier'])
        : undefined,
      enrichment_status: filters.enrichment_status.length
        ? (filters.enrichment_status as InvestorListParams['enrichment_status'])
        : undefined,
      tags: filters.tags.length ? filters.tags : undefined,
      in_lab_os: filters.in_lab_os || tabDefaults.in_lab_os,
      is_co_investor: filters.is_co_investor || tabDefaults.is_co_investor,
      co_invested_team_id: filters.co_invested_team_id || tabDefaults.co_invested_team_id,
      sort: filters.sort || undefined,
    }),
    [filters, tabDefaults],
  );

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetInvestors(
    params,
    access.canView,
  );
  const { data: teams } = useGetCoInvestorTeams(access.canView);

  const investors = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);
  const total = data?.pages.at(-1)?.total ?? 0;
  const teamLookup = useMemo(() => (teams ? new Map(teams.map((t) => [t.team_id, t])) : undefined), [teams]);

  const filtersActive = hasActiveFilters(filters);

  useEffect(() => {
    if (data) onCountChange?.(total);
  }, [total, data, onCountChange]);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleExport = () => {
    if (selectedIds.size > 0) {
      const selected = investors.filter((i) => selectedIds.has(i.investor_id));
      exportInvestorsCsv(selected, visibleColumns, `investors-selected-${Date.now()}.csv`);
    } else {
      exportInvestorsCsv(investors, visibleColumns, `investors-${tab}-${Date.now()}.csv`);
    }
  };

  const handleSaveView = (name: string) => {
    saveView(name, tab, params as Record<string, unknown>);
  };

  const handleSortChange = (value: string) => {
    setFilters({ sort: value || null, page: 1 });
  };

  const saveViewSlot =
    enableSaveView && filtersActive && access.canEdit && !filters.view ? (
      <SaveViewPopover onSave={handleSaveView} />
    ) : null;

  if (isError) {
    return <div className={s.error}>Couldn&apos;t load investors. Try again in a moment.</div>;
  }

  return (
    <div className={s.root}>
      <div className={s.actionBar}>
        <div className={s.actionBarLeft}>
          <Tabs
            tabs={tabs}
            value={activeTab}
            onValueChange={onTabChange}
            variant="underline"
            classes={{ tab: s.tab, badge: s.tabBadge }}
          />
        </div>
        <div className={s.actionBarRight}>
          {saveViewSlot}
          <div className={s.sortWrap}>
            <SortDropdown options={SORT_OPTIONS} currentSort={filters.sort} onSortChange={handleSortChange} className={s.sortTrigger} />
          </div>
          <ColumnChooser />
          {access.canEdit && (
            <button className={s.exportBtn} onClick={handleExport} disabled={investors.length === 0}>
              <ExportIcon />
              <span className={s.exportBtnLabel}>
                Export CSV{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}
              </span>
            </button>
          )}
        </div>
      </div>

      {/*{selectedIds.size > 0 && (*/}
      {/*  <div className={s.selectionBar}>*/}
      {/*    <strong>{selectedIds.size}</strong> selected*/}
      {/*    <button className={s.linkBtn} onClick={() => setSelectedIds(new Set())}>Clear</button>*/}
      {/*  </div>*/}
      {/*)}*/}

      {isLoading && investors.length === 0 ? (
        <InvestorsTableSkeleton />
      ) : (
        <OutreachInvestorTable
          investors={investors}
          visibleColumns={visibleColumns}
          onRowClick={(id) => setFilters({ investorId: id })}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          teamLookup={teamLookup}
          canEdit={access.canEdit}
          onLoadMore={handleLoadMore}
          hasMore={hasNextPage}
          sortValue={filters.sort}
          onSortChange={handleSortChange}
        />
      )}

      <div className={s.footer}>
        <span className={s.footerCount}>
          {total > 0 ? `${total.toLocaleString()} investors total` : `${investors.length.toLocaleString()} investors`}
        </span>
      </div>
    </div>
  );
}

const ExportIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
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

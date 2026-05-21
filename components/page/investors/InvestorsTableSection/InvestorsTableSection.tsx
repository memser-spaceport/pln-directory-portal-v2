'use client';

import { useCallback, useMemo, useState } from 'react';
import { useQueryStates } from 'nuqs';
import { useGetInvestors } from '@/services/investors/hooks/useGetInvestors';
import { useGetCoInvestorTeams } from '@/services/investors/hooks/useGetCoInvestorTeams';
import { useInvestorColumnStore, useSavedViewsStore } from '@/services/investors/store';
import { useInvestorsAccess } from '@/services/rbac/hooks/useInvestorsAccess';
import { investorsFilterParsers } from '@/app/investors/(investors-page)/searchParams';
import type { InvestorListParams } from '@/services/investors/types';
import { OutreachInvestorTable } from '../OutreachInvestorTable/OutreachInvestorTable';
import { InvestorsTableSkeleton } from '../OutreachInvestorTable/InvestorsTableSkeleton';
import { InvestorsToolbar } from '../InvestorsToolbar/InvestorsToolbar';
import { exportInvestorsCsv } from '../utils/exportCsv';
import s from './InvestorsTableSection.module.scss';

interface Props {
  /** Default flags injected for the tab. e.g. Co-investors sets `is_co_investor=true`. */
  tabDefaults?: Partial<InvestorListParams>;
  /** Tab id — used in CSV filename + saved-view scoping. */
  tab: 'all' | 'co-investors';
  /** Title shown in the toolbar (e.g. "All Investors", "Co-investors"). */
  title: string;
  /** Optional right-side slot for tab-specific actions (e.g. "Find warm intros" CTA). */
  toolbarRightSlot?: React.ReactNode;
  /** When true (default), show the Save-view button on the action bar when filters differ from default. */
  enableSaveView?: boolean;
}

const SORT_OPTIONS = [
  { value: '', label: 'Default (most engaged first)' },
  { value: 'last_name:asc', label: 'Name (A-Z)' },
  { value: 'last_name:desc', label: 'Name (Z-A)' },
  { value: 'last_sent_date:desc', label: 'Recently engaged' },
] as const;

/**
 * Detects whether any filter has been applied vs the default state.
 * Drives the visibility of the "Save view" button (only show when there's
 * something worth saving).
 */
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
  title,
  toolbarRightSlot,
  enableSaveView = true,
}: Props) {
  const [filters, setFilters] = useQueryStates(investorsFilterParsers, {
    history: 'replace',
    shallow: true,
  });
  const access = useInvestorsAccess();
  const visibleColumns = useInvestorColumnStore((s) => s.visibleColumns);
  const saveView = useSavedViewsStore((s) => s.actions.saveView);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [savingView, setSavingView] = useState(false);
  const [newViewName, setNewViewName] = useState('');

  // Combine URL filter state + tab defaults into the API params shape
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
  const appliedFiltersCount = useMemo(() => {
    let n = 0;
    if (filters.q) n++;
    n += filters.source.length;
    n += filters.investor_type.length;
    n += filters.stage_focus.length;
    n += filters.sector_tags.length;
    if (filters.geo_focus) n++;
    n += filters.email_status.length;
    n += filters.engagement_tier.length;
    n += filters.enrichment_status.length;
    n += filters.tags.length;
    if (filters.in_lab_os) n++;
    if (filters.is_co_investor) n++;
    if (filters.co_invested_team_id) n++;
    return n;
  }, [filters]);

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

  const handleSaveView = () => {
    if (!newViewName.trim()) return;
    saveView(newViewName.trim(), tab, params as Record<string, unknown>);
    setNewViewName('');
    setSavingView(false);
  };

  const handleSortChange = (value: string) => {
    setFilters({ sort: value || null, page: 1 });
  };

  const handleMobileFilterClick = () => {
    // Mobile: dispatch the same EVENTS.SHOW_FILTER pattern other modules use,
    // OR scroll the filter rail into view. For V1 prototype we just scroll —
    // mobile filter slide-out is a follow-up.
    document.querySelector('aside[class*="filters"]')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (isError) {
    return <div className={s.error}>Couldn&apos;t load investors. Try again in a moment.</div>;
  }

  return (
    <div className={s.root}>
      <InvestorsToolbar
        title={title}
        total={total}
        sortValue={filters.sort}
        sortOptions={SORT_OPTIONS}
        onSortChange={handleSortChange}
        appliedFiltersCount={appliedFiltersCount}
        onFilterClick={handleMobileFilterClick}
        rightSlot={toolbarRightSlot}
      />

      {enableSaveView && filtersActive && access.canEdit && (
        <div className={s.actionBar}>
          <div className={s.actionBar_right}>
            {savingView ? (
              <div className={s.saveViewForm}>
                <div className={s.saveViewRow}>
                  <input
                    type="text"
                    autoFocus
                    placeholder="Name this view…"
                    value={newViewName}
                    onChange={(e) => setNewViewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveView();
                      if (e.key === 'Escape') setSavingView(false);
                    }}
                    className={s.input}
                  />
                  <button
                    className={s.btnPrimary}
                    onClick={handleSaveView}
                    disabled={!newViewName.trim() || newViewName.length > 200}
                  >
                    Save
                  </button>
                  <button className={s.btnGhost} onClick={() => setSavingView(false)}>
                    Cancel
                  </button>
                </div>
                {newViewName.length > 200 ? (
                  <span className={s.saveViewError}>
                    Name must be 200 characters or fewer ({newViewName.length}/200)
                  </span>
                ) : newViewName.length >= 180 ? (
                  <span className={s.saveViewError}>{newViewName.length}/200 characters</span>
                ) : null}
              </div>
            ) : (
              <button className={s.btn} onClick={() => setSavingView(true)}>
                💾 Save view
              </button>
            )}
          </div>
        </div>
      )}

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
          onExport={access.canEdit ? handleExport : undefined}
          onLoadMore={handleLoadMore}
          hasMore={hasNextPage}
        />
      )}
    </div>
  );
}

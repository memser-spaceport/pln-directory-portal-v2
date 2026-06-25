'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import DashboardPagesLayout from '@/components/core/dashboard-pages-layout/DashboardPagesLayout';
import KpiSummaryStripV0 from './KpiSummaryStripV0';
import { mockFounders, mockKpiSummary, mockPage } from './mocks';
import { DEFAULT_FILTERS, applyPatch, type Filters, type FilterPatch } from './state';
import { FoundersFilterRailMock } from './FoundersFilterRailMock';
import { FoundersTableSectionMock } from './FoundersTableSectionMock';
import FounderDrawerMock from './FounderDrawerMock';
import { FounderMethodologyModalMock } from './FounderMethodologyModalMock';
import s from './FounderDbPrototype.module.scss';

function FoundersContent({
  filters,
  setFilters,
  visibleColumns,
  toggleColumn,
}: {
  filters: Filters;
  setFilters: (patch: FilterPatch, options?: unknown) => void;
  visibleColumns: string[];
  toggleColumn: (col: string) => void;
}) {
  const [aboutOpen, setAboutOpen] = useState(false);
  const aboutTriggerRef = useRef<HTMLButtonElement>(null);

  return (
    <div className={s.root}>
      <div className={s.pageHeader}>
        <div className={s.pageTitleRow}>
          <h1 className={s.pageTitle}>{mockPage.title}</h1>
          <span className={s.internalBadge}>{mockPage.badge}</span>
        </div>
        <p className={s.pageSubtitle}>{mockPage.subtitle}</p>
      </div>

      <KpiSummaryStripV0 founders={mockFounders} kpi={mockKpiSummary} />

      <div className={s.body}>
        <FoundersTableSectionMock
          founders={mockFounders}
          filters={filters}
          setFilters={setFilters}
          visibleColumns={visibleColumns}
          toggleColumn={toggleColumn}
          onAboutData={() => setAboutOpen(true)}
        />
      </div>

      <FounderDrawerMock
        founderId={filters.founderId || null}
        onClose={() => setFilters({ founderId: '' }, { history: 'push' })}
      />

      <FounderMethodologyModalMock open={aboutOpen} onClose={() => setAboutOpen(false)} triggerRef={aboutTriggerRef} />
    </div>
  );
}

export default function FounderDbPrototype() {
  // Client-only render keeps SSR === first client render (the production page is a
  // client component behind auth — here we mock that away) and avoids hydration drift.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [filters, setFiltersState] = useState<Filters>(DEFAULT_FILTERS);
  // v0: Alignment is visible by default (production default columns dropped it).
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'name',
    'fundTags',
    'alignmentMax',
    'sources',
    'plnProximity',
    'reviewState',
  ]);

  const setFilters = useCallback((patch: FilterPatch) => {
    setFiltersState((current) => applyPatch(current, patch));
  }, []);

  const toggleColumn = useCallback((col: string) => {
    setVisibleColumns((cols) => (cols.includes(col) ? cols.filter((c) => c !== col) : [...cols, col]));
  }, []);

  if (!mounted) return <div className={s.root} />;

  return (
    <DashboardPagesLayout
      filters={<FoundersFilterRailMock filters={filters} setFilters={setFilters} />}
      content={
        <FoundersContent
          filters={filters}
          setFilters={setFilters}
          visibleColumns={visibleColumns}
          toggleColumn={toggleColumn}
        />
      }
    />
  );
}

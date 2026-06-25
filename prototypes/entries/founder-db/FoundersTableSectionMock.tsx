'use client';

import { useMemo, useState } from 'react';
import { Dialog } from '@base-ui-components/react/dialog';
import { useSwipeable } from 'react-swipeable';
import { SortDropdown } from '@/components/common/filters/SortDropdown';
import { getFundTag } from '@/services/founders/types';
import type { FounderDetail } from '@/services/founders/types';
import { CloseIcon, PlusIcon } from '@/components/icons';
import { Button } from '@/components/common/Button';
import { exportFoundersCsv } from '@/components/page/founders/utils/exportCsv';
// Reuse the production section styling so the prototype tracks production 1:1.
import s from '@/components/page/founders/FoundersTableSection/FoundersTableSection.module.scss';
import { FounderTableMock } from './FounderTableMock';
import { FounderColumnChooserMock } from './FounderColumnChooserMock';
import { MoreMenuMock } from './MoreMenuMock';
import { FoundersFilterRailMock } from './FoundersFilterRailMock';
import type { Filters, SetFilters } from './state';
import bb from './FoundersTableSectionMock.module.scss';

interface Props {
  founders: FounderDetail[];
  filters: Filters;
  setFilters: SetFilters;
  visibleColumns: string[];
  toggleColumn: (col: string) => void;
  onAboutData?: () => void;
}

// v0 re-adds the Alignment sort options on top of the production set
// (Last signal, Name). Alignment-desc is the default in the prototype.
const SORT_OPTIONS = [
  { label: 'Alignment (high–low)', value: 'alignmentMax:desc' },
  { label: 'Alignment (low–high)', value: 'alignmentMax:asc' },
  { label: 'Last signal (newest)', value: 'lastSignalAt:desc' },
  { label: 'Last signal (oldest)', value: 'lastSignalAt:asc' },
  { label: 'Name A–Z', value: 'name:asc' },
  { label: 'Name Z–A', value: 'name:desc' },
] as const;

function hasActiveFilters(filters: Filters): boolean {
  return (
    !!filters.q ||
    filters.fund.length > 0 ||
    filters.status.length > 0 ||
    filters.source.length > 0 ||
    filters.focusArea.length > 0 ||
    filters.isRaising
  );
}

function countActiveFilters(filters: Filters): number {
  let n = 0;
  if (filters.q) n++;
  n += filters.fund.length;
  n += filters.status.length;
  n += filters.source.length;
  n += filters.focusArea.length;
  if (filters.isRaising) n++;
  return n;
}

// Mirrors the server-side query in useGetFounders: filter, then sort.
function selectFounders(founders: FounderDetail[], filters: Filters): FounderDetail[] {
  const q = filters.q.trim().toLowerCase();
  const fundSet = new Set(filters.fund);
  const statusSet = new Set(filters.status);
  const sourceSet = new Set(filters.source.map((x) => x.toLowerCase()));
  const focusSet = new Set(filters.focusArea.map((x) => x.toLowerCase()));

  const filtered = founders.filter((f) => {
    const headline = (f.criteriaHeadline ?? f.whyNow ?? '').toLowerCase();
    if (q && !f.name.toLowerCase().includes(q) && !headline.includes(q)) return false;
    if (fundSet.size) {
      const tags = (f.rawPayload?.fund_tags ?? []).map((t) => getFundTag(t)).filter(Boolean) as string[];
      if (!tags.some((t) => fundSet.has(t as never))) return false;
    }
    if (statusSet.size && !statusSet.has(f.reviewState.status)) return false;
    if (sourceSet.size && !f.sources.some((src) => sourceSet.has(src.toLowerCase()))) return false;
    if (focusSet.size) {
      const area = (f.focusArea ?? f.rawPayload?.focus_area ?? '').toLowerCase();
      if (!focusSet.has(area)) return false;
    }
    if (filters.isRaising && !f.isRaising) return false;
    return true;
  });

  const [field, dir] = (filters.sort || 'alignmentMax:desc').split(':');
  const sign = dir === 'asc' ? 1 : -1;
  return [...filtered].sort((a, b) => {
    if (field === 'name') return sign * a.name.localeCompare(b.name);
    if (field === 'lastSignalAt') return sign * (a.lastSignalAt ?? '').localeCompare(b.lastSignalAt ?? '');
    if (field === 'plvsScore') return sign * ((a.plvsScore ?? 0) - (b.plvsScore ?? 0));
    return sign * ((a.alignmentMax ?? 0) - (b.alignmentMax ?? 0));
  });
}

export function FoundersTableSectionMock({
  founders,
  filters,
  setFilters,
  visibleColumns,
  toggleColumn,
  onAboutData,
}: Props) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const swipeHandlers = useSwipeable({
    onSwipedDown: () => setFiltersOpen(false),
  });

  const visible = useMemo(() => selectFounders(founders, filters), [founders, filters]);
  const total = visible.length;

  // ── Row selection (same behavior as the Investors table: select highlights the
  // row and the Export button exports the selection) ────────────────────────────
  const selectedFounders = visible.filter((f) => selectedIds.has(f.founderId));
  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const toggleSelectAll = () =>
    setSelectedIds((prev) => {
      const ids = visible.map((f) => f.founderId);
      const allSelected = ids.length > 0 && ids.every((id) => prev.has(id));
      const next = new Set(prev);
      ids.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
      return next;
    });
  // "Strong fit · top 10" header only makes sense on the Alignment-desc spine.
  const showCutLine = (filters.sort || 'alignmentMax:desc') === 'alignmentMax:desc';
  const filtersActive = hasActiveFilters(filters);
  const filterCount = countActiveFilters(filters);

  const handleSortChange = (value: string) => setFilters({ sort: value || null });
  const handleExport = () => exportFoundersCsv(selectedFounders.length > 0 ? selectedFounders : visible, visibleColumns);

  const handleClearFilters = () => {
    setFilters({
      q: null,
      fund: null,
      status: null,
      source: null,
      focusArea: null,
      isRaising: null,
    });
  };

  return (
    <div className={`${s.root} ${bb.tightStack}`}>
      <div className={`${s.actionBar} ${bb.flatActionBar}`}>
        <div className={s.actionBarLeft}>
          <span className={s.countLabel}>{total > 0 ? `${total.toLocaleString()} founders` : '0 founders'}</span>
          {onAboutData && (
            <button type="button" className={s.howScoredLink} onClick={onAboutData}>
              About this data
            </button>
          )}
        </div>
        <div className={`${s.actionBarRight} ${bb.actionBarRightWrap}`}>
          <button type="button" className={s.mobileFilterBtn} onClick={() => setFiltersOpen(true)}>
            <PlusIcon color="#455468" />
            Filters
            {filterCount > 0 && <span className={s.mobileFilterBadge}>{filterCount}</span>}
          </button>
          {/* Sort + the mobile "More" stay together as one unit (More sits right
              next to Sort, even when the toolbar wraps). */}
          <span className={bb.sortGroup}>
            <SortDropdown options={SORT_OPTIONS} currentSort={filters.sort} onSortChange={handleSortChange} />
            <span className={bb.mobileOnly}>
              <MoreMenuMock
                visibleColumns={visibleColumns}
                toggleColumn={toggleColumn}
                onExport={handleExport}
                exportCount={selectedFounders.length}
                exportDisabled={visible.length === 0}
              />
            </span>
          </span>

          {/* Desktop: Columns + Export inline. */}
          <span className={bb.desktopOnly}>
            <FounderColumnChooserMock visibleColumns={visibleColumns} toggleColumn={toggleColumn} />
          </span>
          <span className={bb.desktopOnly}>
            <button className={s.exportBtn} onClick={handleExport} disabled={visible.length === 0}>
              <ExportIcon />
              <span className={s.exportBtnLabel}>
                Export CSV{selectedFounders.length > 0 ? ` (${selectedFounders.length})` : ''}
              </span>
            </button>
          </span>
        </div>
      </div>

      <FounderTableMock
        founders={visible}
        onRowClick={(id) => setFilters({ founderId: id }, { history: 'push' })}
        visibleColumns={visibleColumns}
        showCutLine={showCutLine}
        selectable
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onToggleSelectAll={toggleSelectAll}
      />

      {visible.length === 0 && filtersActive && (
        <div className={s.empty}>
          <p>No founders match your filters.</p>
          <button className={s.clearBtn} onClick={handleClearFilters}>
            Clear filters
          </button>
        </div>
      )}

      <div className={s.footer}>
        <span className={s.footerCount}>{total > 0 ? `${total.toLocaleString()} founders total` : ''}</span>
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
              <FoundersFilterRailMock filters={filters} setFilters={setFilters} />
            </div>
            <div className={s.drawerFooter}>
              <Button style="border" onClick={handleClearFilters}>
                Clear filters
              </Button>
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

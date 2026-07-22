'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryStates } from 'nuqs';
import clsx from 'clsx';
import { investorsFilterParsers } from '@/app/investors/(investors-page)/searchParams';
import { FilterSelect } from '@/components/common/filters/FilterSelect/FilterSelect';
import type { Option } from '@/components/form/FormSelect/types';
import { useDebounce } from '@/hooks/useDebounce';
import { useInvestorsAnalytics } from '@/analytics/investors.analytics';
import { useWarmIntrosV2Facets } from '@/services/investors/hooks/useWarmIntrosV2Facets';
import { useWarmIntrosV2Paths } from '@/services/investors/hooks/useWarmIntrosV2Paths';
import { listWarmIntrosV2Paths } from '@/services/investors/warm-intros-v2.service';
import {
  WARM_INTROS_V2_CSV_EXPORT_LIMIT,
  WARM_INTROS_V2_TARGET_SET_LABEL,
  WARM_INTROS_V2_TARGET_SETS,
  type WarmIntrosV2InvestorSummary,
  type WarmIntrosV2PathListItem,
  type WarmIntrosV2TargetSet,
} from '@/services/investors/warm-intros-v2.types';
import { exportWarmIntrosV2Csv } from './exportWarmIntrosV2Csv';
import { MasterProfileModal } from './MasterProfileModal';
import { WarmIntrosV2GlossaryDrawer } from './WarmIntrosV2GlossaryDrawer';
import { WarmIntrosV2InvestorDrawer } from './WarmIntrosV2InvestorDrawer';
import { WarmIntrosV2Table } from './WarmIntrosV2Table';
import s from './WarmIntrosV2Workspace.module.scss';

interface Props {
  onCountChange?: (count: number) => void;
}

const PAGE_LIMIT = 50;
const SEARCH_DEBOUNCE_MS = 300;

const TARGET_SET_OPTIONS: Option[] = WARM_INTROS_V2_TARGET_SETS.map((value) => ({
  value,
  label: WARM_INTROS_V2_TARGET_SET_LABEL[value],
}));

/**
 * Warm Intros v2 workspace: filter bar + polished table + glossary + CSV + investor drawer + MasterProfile modal.
 */
export function WarmIntrosV2Workspace({ onCountChange }: Props) {
  const analytics = useInvestorsAnalytics();
  const [filters, setFilters] = useQueryStates(investorsFilterParsers, {
    history: 'replace',
    shallow: true,
  });

  const targetSet = (filters.wi2_target_set ?? 'neuro-fund-i') as WarmIntrosV2TargetSet;
  const [searchInput, setSearchInput] = useState(filters.wi2_q);
  const debouncedSearch = useDebounce(searchInput, SEARCH_DEBOUNCE_MS);
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedProfileUid, setSelectedProfileUid] = useState<string | null>(null);
  const [drawerRow, setDrawerRow] = useState<WarmIntrosV2PathListItem | null>(null);

  // Push debounced search into the URL (shareable). Do not pull URL → input on every
  // wi2_q write — that races mid-typing when an earlier debounce lands.
  useEffect(() => {
    const next = debouncedSearch.trim();
    if (next !== filters.wi2_q) {
      void setFilters({ wi2_q: next || null });
    }
  }, [debouncedSearch, filters.wi2_q, setFilters]);

  const listParams = useMemo(
    () => ({
      targetSet,
      search: debouncedSearch.trim() || undefined,
      connectorProfileUid: filters.wi2_connector || undefined,
      sector: filters.wi2_sector || undefined,
      rank: 1,
      limit: PAGE_LIMIT,
      offset: 0,
    }),
    [targetSet, debouncedSearch, filters.wi2_connector, filters.wi2_sector],
  );

  const { data, isLoading, isError, error } = useWarmIntrosV2Paths(listParams);
  const { data: facets } = useWarmIntrosV2Facets(targetSet);

  const paths = data?.paths ?? [];
  const total = data?.total ?? paths.length;

  useEffect(() => {
    if (data) onCountChange?.(total);
  }, [data, total, onCountChange]);

  const targetSetValue = TARGET_SET_OPTIONS.find((o) => o.value === targetSet) ?? TARGET_SET_OPTIONS[0];

  const connectorOptions = useMemo<Option[]>(
    () =>
      (facets?.connectors ?? []).map((c) => ({
        value: c.profileUid,
        label: `${c.name} (${c.pathCount})`,
      })),
    [facets],
  );

  const connectorValue = connectorOptions.find((o) => o.value === filters.wi2_connector) ?? null;

  const sectorOptions = useMemo<Option[]>(
    () =>
      (facets?.sectors ?? []).map((sec) => ({
        value: sec.value,
        label: `${sec.value} (${sec.count})`,
      })),
    [facets],
  );

  const sectorValue = sectorOptions.find((o) => o.value === filters.wi2_sector) ?? null;

  const onPickTargetSet = useCallback(
    (opt: Option | null) => {
      const next = (opt?.value as WarmIntrosV2TargetSet | undefined) ?? 'neuro-fund-i';
      void setFilters({
        wi2_target_set: next,
        wi2_connector: null,
        wi2_sector: null,
      });
    },
    [setFilters],
  );

  const onExportCsv = useCallback(async () => {
    setExporting(true);
    try {
      const res = await listWarmIntrosV2Paths({
        ...listParams,
        limit: WARM_INTROS_V2_CSV_EXPORT_LIMIT,
        offset: 0,
      });
      const rows = res.paths;
      if (rows.length === 0) return;
      const stamp = new Date().toISOString().slice(0, 10);
      exportWarmIntrosV2Csv(rows, `warm-intros-v2-${targetSet}-${stamp}.csv`);
      analytics.trackExport({ count: rows.length, teamName: WARM_INTROS_V2_TARGET_SET_LABEL[targetSet] });
    } finally {
      setExporting(false);
    }
  }, [listParams, targetSet, analytics]);

  const onOpenMasterProfile = useCallback((investor: WarmIntrosV2InvestorSummary) => {
    setSelectedProfileUid(investor.profileUid);
  }, []);

  const onOpenProfileUid = useCallback((uid: string) => {
    setSelectedProfileUid(uid);
  }, []);

  const onViewAllPaths = useCallback((row: WarmIntrosV2PathListItem) => {
    setDrawerRow(row);
  }, []);

  const onRowClick = useCallback((row: WarmIntrosV2PathListItem) => {
    setDrawerRow(row);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchInput('');
    void setFilters({ wi2_q: null });
  }, [setFilters]);

  return (
    <div className={s.root}>
      <section className={s.builder}>
        <header className={s.builderH}>
          <div className={s.builderHMain}>
            <h2 className={s.title}>Warm Intros v2</h2>
            <p className={s.desc}>
              Who at PL can introduce you — MasterProfile + LLM paths for Neuro and Gold. Pick a list, then filter.
            </p>
          </div>
          <button
            type="button"
            className={s.howScoredLink}
            onClick={() => {
              analytics.trackGlossaryOpened();
              setGlossaryOpen(true);
            }}
          >
            What do these terms mean?
          </button>
        </header>

        <div className={s.filterBar}>
          <div className={s.filterBarItem} style={{ minWidth: 140 }}>
            <FilterSelect
              options={TARGET_SET_OPTIONS}
              value={targetSetValue}
              placeholder="Investors list"
              aria-label="Investors list"
              onChange={onPickTargetSet}
            />
          </div>

          <div className={clsx(s.filterBarItem, s.filterBarSearch)}>
            <div className={s.searchWrap}>
              <span className={s.searchIcon} aria-hidden>
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="9" r="6" />
                  <path d="M15 15l-3.5-3.5" strokeLinecap="round" />
                </svg>
              </span>
              <input
                className={s.searchInput}
                type="text"
                inputMode="search"
                autoComplete="off"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search name or email…"
                aria-label="Search name or email"
              />
              {searchInput ? (
                <button type="button" className={s.searchClear} onClick={clearSearch} aria-label="Clear search">
                  <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
                    <path d="M2 2l6 6M8 2L2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              ) : null}
            </div>
          </div>

          <div className={s.filterBarItem} style={{ minWidth: 160 }}>
            <FilterSelect
              options={connectorOptions}
              value={connectorValue}
              placeholder="PL member"
              isClearable
              isSearchable
              aria-label="PL member"
              onChange={(opt) => void setFilters({ wi2_connector: opt?.value || null })}
            />
          </div>

          <div className={s.filterBarItem} style={{ minWidth: 160 }}>
            <FilterSelect
              options={sectorOptions}
              value={sectorValue}
              placeholder="Industry / Sector"
              isClearable
              isSearchable
              aria-label="Industry / Sector"
              onChange={(opt) => void setFilters({ wi2_sector: opt?.value || null })}
            />
          </div>

          <div className={s.filterBarItem}>
            <button
              type="button"
              className={s.exportBtn}
              onClick={() => void onExportCsv()}
              disabled={exporting || (!isLoading && paths.length === 0)}
            >
              {exporting ? 'Exporting…' : 'Export CSV'}
            </button>
          </div>
        </div>
      </section>

      {isLoading && <div className={s.state}>Loading paths…</div>}

      {isError && (
        <div className={s.stateError}>
          Failed to load Warm Intros v2
          {error instanceof Error && error.message ? `: ${error.message}` : ''}.
        </div>
      )}

      {!isLoading && !isError && paths.length === 0 && <div className={s.state}>No paths match these filters.</div>}

      {!isLoading && !isError && paths.length > 0 && (
        <div className={s.listWrap}>
          <div className={s.meta}>
            Showing {paths.length}
            {total > paths.length ? ` of ${total}` : ''} paths · {WARM_INTROS_V2_TARGET_SET_LABEL[targetSet]}
          </div>
          <WarmIntrosV2Table
            rows={paths}
            onOpenMasterProfile={onOpenMasterProfile}
            onOpenProfileUid={onOpenProfileUid}
            onViewAllPaths={onViewAllPaths}
            onRowClick={onRowClick}
          />
        </div>
      )}

      <WarmIntrosV2GlossaryDrawer open={glossaryOpen} onClose={() => setGlossaryOpen(false)} />

      <WarmIntrosV2InvestorDrawer
        key={drawerRow?.uid ?? 'closed'}
        row={drawerRow}
        open={!!drawerRow}
        onClose={() => setDrawerRow(null)}
        onOpenMasterProfile={(uid) => setSelectedProfileUid(uid)}
      />

      <MasterProfileModal
        profileUid={selectedProfileUid}
        open={!!selectedProfileUid}
        onClose={() => setSelectedProfileUid(null)}
      />
    </div>
  );
}

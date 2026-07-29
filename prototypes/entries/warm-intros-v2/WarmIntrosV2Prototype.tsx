'use client';

/**
 * Warm Intros v2 — mocked clone of the production workspace.
 *
 * Reused from production (imported, not copied):
 *   WarmIntrosV2GlossaryDrawer, ScorePercentPill, PathProfileChip,
 *   ProximityCodeBadge, SectorTagsList, FilterSelect, Drawer, Modal, CopyButton,
 *   exportWarmIntrosV2Csv, parseWarmPathHopChain, masterProfileDisplay.util,
 *   and every WarmIntrosV2Workspace `.module.scss` — so this tracks production 1:1.
 *
 * Copied + simplified here (they call the API in production):
 *   WarmIntrosV2Workspace  → this file            (nuqs + react-query → local state + mocks)
 *   WarmIntrosV2InvestorDrawer → InvestorDrawerMock.tsx
 *   MasterProfileModal     → MasterProfileModalMock.tsx
 *   WarmIntrosV2Table      → WarmIntrosV2TableMock.tsx (Team + Industry/Sector columns dropped)
 *
 * Design changes on top of production:
 *   - the list picker gains an "All investor lists" option, and opens on it
 *   - under that scope each row carries a list badge, so mixed results stay readable
 *
 * Deliberate simplifications, all data-layer only:
 *   - filters live in component state instead of the URL (no nuqs in prototypes)
 *   - the 14 mocked rows fit on one page, so infinite scroll / pagination is dropped
 *   - PostHog analytics calls are dropped
 */

import { useCallback, useMemo, useState } from 'react';
import clsx from 'clsx';
import { FilterSelect } from '@/components/common/filters/FilterSelect/FilterSelect';
import type { Option } from '@/components/form/FormSelect/types';
import { useDebounce } from '@/hooks/useDebounce';
import { exportWarmIntrosV2Csv } from '@/components/page/investors/WarmIntrosV2Workspace/exportWarmIntrosV2Csv';
import { WarmIntrosV2GlossaryDrawer } from '@/components/page/investors/WarmIntrosV2Workspace/WarmIntrosV2GlossaryDrawer';
import {
  WARM_INTROS_V2_LIST_SLUG_BY_TARGET_SET,
  WARM_INTROS_V2_TARGET_SET_LABEL,
  WARM_INTROS_V2_TARGET_SETS,
  type WarmIntrosV2InvestorSummary,
  type WarmIntrosV2PathListItem,
} from '@/services/investors/warm-intros-v2.types';
import s from '@/components/page/investors/WarmIntrosV2Workspace/WarmIntrosV2Workspace.module.scss';
import {
  ALL_LISTS,
  ALL_LISTS_LABEL,
  ALL_LISTS_MEMBER_COUNT,
  MOCK_INVESTOR_LISTS,
  facetsForTargetSet,
  filterPaths,
  type TargetSetScope,
} from './mocks';
import shell from './PageShell.module.scss';
import { InvestorDrawerMock } from './InvestorDrawerMock';
import { WarmIntrosV2TableMock } from './WarmIntrosV2TableMock';
import { MasterProfileModalMock } from './MasterProfileModalMock';

const SEARCH_DEBOUNCE_MS = 300;

export default function WarmIntrosV2Prototype() {
  // Opens unscoped: "All investor lists" is the default, the two real lists narrow it.
  const [targetSet, setTargetSet] = useState<TargetSetScope>(ALL_LISTS);
  const [connectorUid, setConnectorUid] = useState<string | null>(null);
  const [sector, setSector] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, SEARCH_DEBOUNCE_MS);

  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedProfileUid, setSelectedProfileUid] = useState<string | null>(null);
  const [drawerRow, setDrawerRow] = useState<WarmIntrosV2PathListItem | null>(null);

  const paths = useMemo(
    () =>
      filterPaths({
        targetSet,
        search: debouncedSearch.trim() || undefined,
        connectorProfileUid: connectorUid || undefined,
        sector: sector || undefined,
      }),
    [targetSet, debouncedSearch, connectorUid, sector],
  );
  const total = paths.length;

  const facets = useMemo(() => facetsForTargetSet(targetSet), [targetSet]);

  const targetSetOptions = useMemo<Option[]>(() => {
    const withCount = (name: string, count: number | undefined) =>
      typeof count === 'number' ? `${name} · ${count.toLocaleString()} ${count === 1 ? 'member' : 'members'}` : name;

    const lists = WARM_INTROS_V2_TARGET_SETS.map((value) => {
      const list = MOCK_INVESTOR_LISTS.find((l) => l.slug === WARM_INTROS_V2_LIST_SLUG_BY_TARGET_SET[value]);
      const name = list?.name ?? WARM_INTROS_V2_TARGET_SET_LABEL[value];
      return { value, label: withCount(name, list?.member_count) };
    });

    // "All" leads the list — it is the default scope, not a clear-filter action.
    return [{ value: ALL_LISTS, label: withCount(ALL_LISTS_LABEL, ALL_LISTS_MEMBER_COUNT) }, ...lists];
  }, []);

  const targetSetValue = targetSetOptions.find((o) => o.value === targetSet) ?? targetSetOptions[0];

  const scopeLabel = targetSet === ALL_LISTS ? ALL_LISTS_LABEL : WARM_INTROS_V2_TARGET_SET_LABEL[targetSet];

  const connectorOptions = useMemo<Option[]>(
    () => facets.connectors.map((c) => ({ value: c.profileUid, label: `${c.name} (${c.pathCount})` })),
    [facets],
  );
  const connectorValue = connectorOptions.find((o) => o.value === connectorUid) ?? null;

  const sectorOptions = useMemo<Option[]>(
    () => facets.sectors.map((sec) => ({ value: sec.value, label: `${sec.value} (${sec.count})` })),
    [facets],
  );
  const sectorValue = sectorOptions.find((o) => o.value === sector) ?? null;

  const onPickTargetSet = useCallback((opt: Option | null) => {
    setTargetSet((opt?.value as TargetSetScope | undefined) ?? ALL_LISTS);
    setConnectorUid(null);
    setSector(null);
  }, []);

  const onExportCsv = useCallback(() => {
    setExporting(true);
    try {
      if (paths.length === 0) return;
      exportWarmIntrosV2Csv(paths, `warm-intros-v2-${targetSet}-mock.csv`);
    } finally {
      setExporting(false);
    }
  }, [paths, targetSet]);

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

  const clearSearch = useCallback(() => setSearchInput(''), []);

  return (
    <div className={shell.page}>
      <div className={s.root}>
        <section className={s.builder}>
          <header className={s.builderH}>
            <div className={s.builderHMain}>
              <h2 className={s.title}>Warm Intros v2</h2>
              <p className={s.desc}>
                Who at PL can introduce you — MasterProfile + LLM paths for Neuro and Gold. Pick a list, then filter.
              </p>
            </div>
            <button type="button" className={s.howScoredLink} onClick={() => setGlossaryOpen(true)}>
              What do these terms mean?
            </button>
          </header>

          <div className={s.filterBar}>
            <div className={s.filterBarItem} style={{ minWidth: 280 }}>
              <FilterSelect
                options={targetSetOptions}
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
                onChange={(opt) => setConnectorUid(opt?.value || null)}
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
                onChange={(opt) => setSector(opt?.value || null)}
              />
            </div>

            <div className={s.filterBarItem}>
              <button type="button" className={s.exportBtn} onClick={onExportCsv} disabled={exporting || total === 0}>
                {exporting ? 'Exporting…' : 'Export CSV'}
              </button>
            </div>
          </div>
        </section>

        {total === 0 && <div className={s.state}>No paths match these filters.</div>}

        {total > 0 && (
          <div className={s.listWrap}>
            <div className={s.meta}>
              Showing {paths.length} paths · {scopeLabel}
            </div>
            <WarmIntrosV2TableMock
              rows={paths}
              onOpenMasterProfile={onOpenMasterProfile}
              onOpenProfileUid={onOpenProfileUid}
              onViewAllPaths={onViewAllPaths}
              onRowClick={onRowClick}
              // Only under "All investor lists" — inside a single list every
              // badge would just repeat the picker.
              showListName={targetSet === ALL_LISTS}
            />
          </div>
        )}

        <WarmIntrosV2GlossaryDrawer open={glossaryOpen} onClose={() => setGlossaryOpen(false)} />

        <InvestorDrawerMock
          key={drawerRow?.uid ?? 'closed'}
          row={drawerRow}
          open={!!drawerRow}
          onClose={() => setDrawerRow(null)}
          onOpenMasterProfile={(uid) => setSelectedProfileUid(uid)}
        />

        <MasterProfileModalMock
          profileUid={selectedProfileUid}
          open={!!selectedProfileUid}
          onClose={() => setSelectedProfileUid(null)}
        />
      </div>
    </div>
  );
}

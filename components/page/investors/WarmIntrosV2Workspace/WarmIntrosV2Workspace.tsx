'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryStates } from 'nuqs';
import clsx from 'clsx';
import { investorsFilterParsers } from '@/app/investors/(investors-page)/searchParams';
import { FilterMultiSelect } from '@/components/common/filters/FilterSelect/FilterMultiSelect';
import { FilterSelect } from '@/components/common/filters/FilterSelect/FilterSelect';
import type { Option } from '@/components/form/FormSelect/types';
import { useDebounce } from '@/hooks/useDebounce';
import { useInvestorsAnalytics } from '@/analytics/investors.analytics';
import { useGetInvestorLists } from '@/services/investors/hooks/useGetInvestorLists';
import { useWarmIntrosV2Facets } from '@/services/investors/hooks/useWarmIntrosV2Facets';
import { useWarmIntrosV2Paths } from '@/services/investors/hooks/useWarmIntrosV2Paths';
import { listWarmIntrosV2Paths } from '@/services/investors/warm-intros-v2.service';
import { useInvestorsAccess } from '@/services/rbac/hooks/useInvestorsAccess';
import {
  WARM_INTROS_V2_ALL_TARGET_SET,
  WARM_INTROS_V2_CSV_EXPORT_LIMIT,
  WARM_INTROS_V2_DEFAULT_TARGET_SET,
  WARM_INTROS_V2_LIST_SLUG_BY_TARGET_SET,
  WARM_INTROS_V2_MIN_SCORE,
  WARM_INTROS_V2_TARGET_SET_LABEL,
  WARM_INTROS_V2_TARGET_SETS,
  type WarmIntrosV2Facets,
  type WarmIntrosV2InvestorSummary,
  type WarmIntrosV2PathListItem,
  type WarmIntrosV2SelectorValue,
} from '@/services/investors/warm-intros-v2.types';
import type { SelectedMember } from './alsoViaMembers';
import { exportWarmIntrosV2Csv } from './exportWarmIntrosV2Csv';
import { MasterProfileModal } from './MasterProfileModal';
import { PathFeedbackQueuePanel } from './PathFeedbackQueuePanel';
import { describePathVia, PathViaSelect } from './PathViaSelect';
import { usePathViaFilter } from './usePathViaFilter';
import { WarmIntrosV2GlossaryDrawer } from './WarmIntrosV2GlossaryDrawer';
import { WarmIntrosV2InvestorDrawer } from './WarmIntrosV2InvestorDrawer';
import { WarmIntrosV2Table } from './WarmIntrosV2Table';
import s from './WarmIntrosV2Workspace.module.scss';
// Active-filter pills + Clear all already exist in Warm Intros v1 — same feature
// family, same bar. Reused rather than re-styled.
import v1 from '../WarmIntrosWorkspace/WarmIntrosWorkspace.module.scss';

interface Props {
  onCountChange?: (count: number) => void;
}

const PAGE_LIMIT = 50;
const SEARCH_DEBOUNCE_MS = 300;
const EMPTY_FACETS: WarmIntrosV2Facets = { connectors: [], sectors: [], kinds: [], bridges: [], plBackerCount: 0 };

/**
 * Warm Intros v2 workspace: filter bar + polished table + glossary + CSV + investor drawer + MasterProfile modal.
 */
export function WarmIntrosV2Workspace({ onCountChange }: Props) {
  const access = useInvestorsAccess();
  const analytics = useInvestorsAnalytics();
  const [filters, setFilters] = useQueryStates(investorsFilterParsers, {
    history: 'replace',
    shallow: true,
  });

  const selectorValue = (filters.wi2_target_set ?? WARM_INTROS_V2_DEFAULT_TARGET_SET) as WarmIntrosV2SelectorValue;
  /** Omit targetSet on API when "All" is selected. */
  const apiTargetSet = selectorValue === WARM_INTROS_V2_ALL_TARGET_SET ? undefined : selectorValue;
  const pathVia = usePathViaFilter(filters, setFilters);
  const [searchInput, setSearchInput] = useState(filters.wi2_q);
  const debouncedSearch = useDebounce(searchInput, SEARCH_DEBOUNCE_MS);
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [feedbackQueueOpen, setFeedbackQueueOpen] = useState(false);
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

  const pathViaKinds = useMemo(
    () => pathVia.value.filter((v) => v.type === 'kind').map((v) => v.value),
    [pathVia.value],
  );
  const pathViaMembers = useMemo(
    () => pathVia.value.filter((v) => v.type === 'member').map((v) => v.value),
    [pathVia.value],
  );
  const pathViaBridges = useMemo(
    () => pathVia.value.filter((v) => v.type === 'bridge').map((v) => v.value),
    [pathVia.value],
  );

  const listParams = useMemo(
    () => ({
      targetSet: apiTargetSet,
      search: debouncedSearch.trim() || undefined,
      connectorProfileUid: pathViaMembers.length ? pathViaMembers : undefined,
      sector: filters.wi2_sector.length ? filters.wi2_sector : undefined,
      relationKind: pathViaKinds.length ? pathViaKinds : undefined,
      bridgeProfileUid: pathViaBridges.length ? pathViaBridges : undefined,
      plBacker: filters.wi2_pl_backer === true || undefined,
      minScore: WARM_INTROS_V2_MIN_SCORE,
      rank: 1,
      limit: PAGE_LIMIT,
    }),
    [apiTargetSet, debouncedSearch, pathViaMembers, pathViaKinds, pathViaBridges, filters.wi2_sector, filters.wi2_pl_backer],
  );

  const { data, isLoading, isError, error, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useWarmIntrosV2Paths(listParams);
  const { data: facets } = useWarmIntrosV2Facets(apiTargetSet);
  const { data: lists } = useGetInvestorLists(true);

  const paths = useMemo(() => data?.pages.flatMap((p) => p.paths) ?? [], [data]);
  const total = data?.pages.at(-1)?.total ?? paths.length;
  const hasRows = paths.length > 0;

  const targetSetOptions = useMemo<Option[]>(() => {
    const cohortOptions = WARM_INTROS_V2_TARGET_SETS.map((value) => {
      const list = lists?.find((l) => l.slug === WARM_INTROS_V2_LIST_SLUG_BY_TARGET_SET[value]);
      const name = list?.name ?? WARM_INTROS_V2_TARGET_SET_LABEL[value];
      const count = list?.member_count;
      const label =
        typeof count === 'number' ? `${name} · ${count.toLocaleString()} ${count === 1 ? 'member' : 'members'}` : name;
      return { value, label };
    });
    return [{ value: WARM_INTROS_V2_ALL_TARGET_SET, label: WARM_INTROS_V2_TARGET_SET_LABEL.all }, ...cohortOptions];
  }, [lists]);

  const scrollRootRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    const root = scrollRootRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel || !hasNextPage || !hasRows) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) handleLoadMore();
      },
      { root, rootMargin: '80px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleLoadMore, hasNextPage, hasRows]);

  useEffect(() => {
    if (data) onCountChange?.(total);
  }, [data, total, onCountChange]);

  const targetSetValue = targetSetOptions.find((o) => o.value === selectorValue) ?? targetSetOptions[0];

  const sectorOptions = useMemo<Option[]>(
    () =>
      (facets?.sectors ?? []).map((sec) => ({
        value: sec.value,
        label: `${sec.value} (${sec.count})`,
      })),
    [facets],
  );

  const sectorValue = useMemo(
    () => sectorOptions.filter((o) => filters.wi2_sector.includes(o.value)),
    [sectorOptions, filters.wi2_sector],
  );

  const onPickTargetSet = useCallback(
    (opt: Option | null) => {
      const next = (opt?.value as WarmIntrosV2SelectorValue | undefined) ?? WARM_INTROS_V2_DEFAULT_TARGET_SET;
      void setFilters({
        wi2_target_set: next,
        wi2_path_kind: [],
        wi2_path_members: [],
        wi2_path_bridges: [],
        wi2_sector: [],
      });
    },
    [setFilters],
  );

  const plBacker = filters.wi2_pl_backer === true;

  // Backed PL/FIL describes the investor, not the route to them, so it's independent
  // of — and combines freely with — the Path via selection (both AND together server-side).
  const togglePlBacker = useCallback(() => {
    void setFilters({ wi2_pl_backer: plBacker ? null : true });
  }, [plBacker, setFilters]);

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
      exportWarmIntrosV2Csv(rows, `warm-intros-v2-${selectorValue}-${stamp}.csv`);
      analytics.trackExport({ count: rows.length, teamName: WARM_INTROS_V2_TARGET_SET_LABEL[selectorValue] });
    } finally {
      setExporting(false);
    }
  }, [listParams, selectorValue, analytics]);

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

  const onOpenInvestorFromFeedback = useCallback(
    (targetProfileUid: string) => {
      const existing = paths.find((p) => p.targetProfileUid === targetProfileUid);
      if (existing) {
        setDrawerRow(existing);
        return;
      }
      setDrawerRow({
        uid: `feedback-open-${targetProfileUid}`,
        targetProfileUid,
        targetSet: apiTargetSet ?? WARM_INTROS_V2_DEFAULT_TARGET_SET,
        rank: 1,
        score: 0,
        hopCount: 1,
        hopChain: null,
        bestConnectorProfileUid: null,
        alternateConnectorProfileUids: [],
        proximityCode: '',
        caliber: null,
        scorePercent: 0,
        investor: {
          profileUid: targetProfileUid,
          personKey: '',
          name: targetProfileUid,
          email: null,
          currentOrg: null,
          currentTitle: null,
          sectors: [],
          affinityPersonId: null,
          memberUid: null,
        },
        bestConnector: null,
        pathSummary: { explanation: null, alternateCount: 0 },
      });
    },
    [apiTargetSet, paths],
  );

  const clearSearch = useCallback(() => {
    setSearchInput('');
    void setFilters({ wi2_q: null });
  }, [setFilters]);

  const plBackerAvailable = facets?.plBackerCount ?? 0;

  // A PL-member filter matches the best connector OR an alternate one, but the table
  // draws only the best connector's chain — so rows can match on someone the chain
  // never names. Hand the table the selection (names resolved the same way the active
  // pill resolves them) so it can say so per row.
  const selectedPathViaMembers = useMemo<SelectedMember[]>(
    () =>
      pathVia.value
        .filter((via) => via.type === 'member')
        .map((via) => ({ uid: via.value, name: describePathVia(via, facets ?? EMPTY_FACETS) })),
    [pathVia.value, facets],
  );

  const clearAll = useCallback(() => {
    pathVia.setValue([]);
    void setFilters({ wi2_sector: [], wi2_pl_backer: null });
    clearSearch();
  }, [pathVia, setFilters, clearSearch]);

  /**
   * What's currently on, and how to switch each thing off individually. The list
   * picker is deliberately absent — it always has a value, so a pill for it would
   * never be removable.
   */
  const activePills = useMemo(() => {
    const pills: Array<{ key: string; label: string; value: string; onRemove: () => void }> = [];

    // One pill per selection, not one pill listing them all — each has to be
    // removable on its own.
    for (const via of pathVia.value) {
      pills.push({
        key: `pathVia:${via.type}:${via.value}`,
        label: 'Path via',
        value: describePathVia(via, facets ?? EMPTY_FACETS),
        onRemove: () =>
          pathVia.setValue(pathVia.value.filter((v) => !(v.type === via.type && v.value === via.value))),
      });
    }
    for (const sec of filters.wi2_sector) {
      pills.push({
        key: `sector:${sec}`,
        label: 'Sector',
        value: sec,
        onRemove: () => void setFilters({ wi2_sector: filters.wi2_sector.filter((s) => s !== sec) }),
      });
    }
    if (plBacker) {
      pills.push({ key: 'plBacker', label: 'Backed', value: 'PL / Filecoin', onRemove: () => void togglePlBacker() });
    }
    if (searchInput.trim()) {
      pills.push({ key: 'search', label: 'Search', value: searchInput.trim(), onRemove: clearSearch });
    }
    return pills;
  }, [pathVia, filters.wi2_sector, setFilters, plBacker, togglePlBacker, searchInput, clearSearch, facets]);

  return (
    <div className={s.root}>
      <section className={s.builder}>
        <header className={s.builderH}>
          <div className={s.builderHMain}>
            <h2 className={s.title}>Warm Intros v2</h2>
            <p className={s.desc}>
              Who at PL can introduce you — MasterProfile + LLM paths for Neuro and Gold. Pick a list (or All), then
              filter.
            </p>
          </div>
          <div className={s.headerLinks}>
            {access.canEdit ? (
              <button type="button" className={s.howScoredLink} onClick={() => setFeedbackQueueOpen(true)}>
                Path feedback
              </button>
            ) : null}
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
          </div>
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

          <div className={s.filterBarItem} style={{ minWidth: 200 }}>
            <PathViaSelect
              facets={facets ?? EMPTY_FACETS}
              value={pathVia.value}
              onChange={pathVia.setValue}
            />
          </div>

          <div className={s.filterBarItem} style={{ minWidth: 200 }}>
            <FilterMultiSelect
              options={sectorOptions}
              value={sectorValue}
              placeholder="Industry / Sector"
              isSearchable
              aria-label="Industry / Sector"
              checkbox
              onChange={(opts) => void setFilters({ wi2_sector: opts.map((o) => o.value) })}
            />
          </div>

          {/* Not part of the "Path via" axis: this one is about the investor, not
              the route to them. Disabled rather than hidden when nothing in the
              current set qualifies — a control that vanishes is worse. */}
          <div className={clsx(s.filterBarItem, s.quickFilters)} role="group" aria-label="Investor filters">
            <button
              type="button"
              className={clsx(s.quickChip, s.backedToggle, plBacker && s.quickChipActive)}
              aria-pressed={plBacker}
              disabled={!plBacker && plBackerAvailable === 0}
              title="Investors whose firm has already backed Protocol Labs or Filecoin"
              onClick={togglePlBacker}
            >
              Backed PL/FIL ({plBackerAvailable})
            </button>
          </div>
        </div>

        {activePills.length > 0 ? (
          <div className={v1.filterPills}>
            {activePills.map((pill) => (
              <span key={pill.key} className={v1.pill}>
                {pill.label}: <strong>{pill.value}</strong>
                <button
                  type="button"
                  className={v1.pillRemove}
                  onClick={pill.onRemove}
                  aria-label={`Remove ${pill.label} filter`}
                >
                  ×
                </button>
              </span>
            ))}
            <button type="button" className={v1.clearAll} onClick={clearAll}>
              Clear all
            </button>
          </div>
        ) : null}
      </section>

      {isLoading && <div className={s.state}>Loading paths…</div>}

      {isError && (
        <div className={s.stateError}>
          Failed to load Warm Intros v2
          {error instanceof Error && error.message ? `: ${error.message}` : ''}.
        </div>
      )}

      {!isLoading && !isError && paths.length === 0 && (
        <div className={clsx(s.state, s.emptyState)}>
          <span>No paths match these filters.</span>
          {activePills.length > 0 ? (
            <button type="button" className={v1.clearAll} onClick={clearAll}>
              Clear all
            </button>
          ) : null}
        </div>
      )}

      {!isLoading && !isError && paths.length > 0 && (
        <div className={s.listWrap}>
          <div className={clsx(s.meta, s.metaRow)}>
            <span>
              Showing {paths.length}
              {total > paths.length ? ` of ${total}` : ''} paths · {WARM_INTROS_V2_TARGET_SET_LABEL[selectorValue]}
            </span>
            {/* Export is an action on the result set, so it belongs with the
                sentence that says how many there are, not the row of controls
                that changes which results there are. */}
            <button
              type="button"
              className={clsx(s.exportPrimary, s.metaRowSpacer)}
              onClick={() => void onExportCsv()}
              disabled={exporting || (!isLoading && paths.length === 0)}
            >
              {exporting ? 'Exporting…' : 'Export CSV'}
            </button>
          </div>
          <WarmIntrosV2Table
            rows={paths}
            onOpenMasterProfile={onOpenMasterProfile}
            onOpenProfileUid={onOpenProfileUid}
            onViewAllPaths={onViewAllPaths}
            onRowClick={onRowClick}
            showListName={selectorValue === WARM_INTROS_V2_ALL_TARGET_SET}
            alsoViaSelected={selectedPathViaMembers}
            scrollRootRef={scrollRootRef}
            sentinelRef={sentinelRef}
            footer={isFetchingNextPage ? <div className={s.sentinelLoader}>Loading more…</div> : null}
          />
        </div>
      )}

      <WarmIntrosV2GlossaryDrawer open={glossaryOpen} onClose={() => setGlossaryOpen(false)} />

      <PathFeedbackQueuePanel
        open={feedbackQueueOpen}
        onClose={() => setFeedbackQueueOpen(false)}
        canEdit={access.canEdit}
        onOpenInvestor={onOpenInvestorFromFeedback}
      />

      <WarmIntrosV2InvestorDrawer
        key={drawerRow?.uid ?? 'closed'}
        row={drawerRow}
        open={!!drawerRow}
        onClose={() => setDrawerRow(null)}
        onOpenMasterProfile={(uid) => setSelectedProfileUid(uid)}
        canEdit={access.canEdit}
      />

      <MasterProfileModal
        profileUid={selectedProfileUid}
        open={!!selectedProfileUid}
        onClose={() => setSelectedProfileUid(null)}
      />
    </div>
  );
}

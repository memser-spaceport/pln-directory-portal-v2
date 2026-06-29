'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { useQueryStates } from 'nuqs';
import clsx from 'clsx';
import { useGetCoInvestorTeams } from '@/services/investors/hooks/useGetCoInvestorTeams';
import { useGetInvestorLists } from '@/services/investors/hooks/useGetInvestorLists';
import { useGetListFacets } from '@/services/investors/hooks/useGetListFacets';
import { useGetListMembers } from '@/services/investors/hooks/useGetListMembers';
import { useInvestorsAccess } from '@/services/rbac/hooks/useInvestorsAccess';
import { investorsFilterParsers } from '@/app/investors/(investors-page)/searchParams';
import { FilterSelect } from '@/components/common/filters/FilterSelect/FilterSelect';
import type { Option } from '@/components/form/FormSelect/types';
import { CheckboxDropdown } from './CheckboxDropdown';

import {
  CHECK_SIZE_RANGES,
  INDUSTRY_SECTOR_LABEL,
  SECTOR_TAGS,
  SECTOR_TAG_LABEL,
  STAGE_FOCUSES,
  STAGE_FOCUS_LABEL,
} from '@/services/investors/constants';

import type {
  CheckSizeRange,
  InvestorList,
  OutreachInvestor,
  SectorTag,
  StageFocus,
  WarmIntroTier,
} from '@/services/investors/types';
import { useInvestorsAnalytics } from '@/analytics/investors.analytics';
import { LabOsBadge } from '../LabOsBadge/LabOsBadge';
import { EngagementTierBadge } from '../EngagementTierBadge/EngagementTierBadge';
import { SectorTagsList } from '../SectorTagsList/SectorTagsList';
import { ProximityCodeBadge } from '../ProximityCodeBadge/ProximityCodeBadge';
import { RouteChip } from '../RouteChip/RouteChip';
import { CrosswalkReviewPanel } from '../CrosswalkReviewPanel/CrosswalkReviewPanel';
import { exportInvestorsCsv } from '../utils/exportCsv';
import { AddToListButton } from './AddToListButton';
import { GlossaryModal } from './GlossaryModal';
import { CLEAR_CONNECTOR_LENS, selectionToConnectorFilter } from './connectorLensFilters';
import { UnifiedSearchSelect, type UnifiedSelection } from './UnifiedSearchSelect';
import s from './WarmIntrosWorkspace.module.scss';

interface Props {
  onCountChange?: (count: number) => void;
}

const REL_FILTERS: { tier: WarmIntroTier; label: string }[] = [
  { tier: 'co_invested', label: 'Co-invested' },
  { tier: 'engaged', label: 'Engaged' },
];

const STAGE_OPTIONS: Option[] = STAGE_FOCUSES.filter((st) => st !== 'unknown').map((st) => ({
  value: st,
  label: STAGE_FOCUS_LABEL[st],
}));

const CHECK_SIZE_OPTIONS: Option[] = CHECK_SIZE_RANGES.filter((c) => c !== 'unknown').map((c) => ({
  value: c,
  label: c,
}));

const SECTOR_OPTIONS: Option[] = SECTOR_TAGS.map((s) => ({ value: s, label: SECTOR_TAG_LABEL[s] }));

const PAGE_LIMIT = 200;

// Derive the relationship tier off the investor record (list members are plain
// OutreachInvestor, not WarmIntroCandidate): co-invested > engaged > cold.
function relationshipTier(inv: OutreachInvestor): WarmIntroTier {
  if (inv.co_invested_team_ids.length > 0) return 'co_invested';
  if (inv.engagement_tier && inv.engagement_tier !== 'T4_cold') return 'engaged';
  return 'cold_match';
}

// Warmer first: caliber A < B < none, then fewer hops; cold (no path) last.
function proximityRank(inv: OutreachInvestor): number {
  if (!inv.has_path || !inv.best_proximity_code) return 999;
  const code = inv.best_proximity_code;
  const cal = code.slice(-1);
  const calRank = cal === 'A' ? 0 : cal === 'B' ? 1 : 2;
  const hopMatch = code.match(/\+(\d)/);
  const hops = hopMatch ? Number(hopMatch[1]) : 9;
  return calRank * 10 + hops;
}

export function WarmIntrosWorkspace({ onCountChange }: Props) {
  const access = useInvestorsAccess();
  const analytics = useInvestorsAnalytics();
  const [filters, setFilters] = useQueryStates(investorsFilterParsers, {
    history: 'replace',
    shallow: true,
  });

  const { data: lists } = useGetInvestorLists(access.canView);
  const { data: teams } = useGetCoInvestorTeams(access.canView);

  // ── Target list selection ───────────────────────────────────────────────────
  const selectedList = useMemo<InvestorList | undefined>(
    () => (lists ? lists.find((l) => l.id === filters.wi_list_id) : undefined),
    [lists, filters.wi_list_id],
  );

  // Default-select the first list once they load (keeps the workspace useful out
  // of the box; v1 = Neuro + Gold).
  useEffect(() => {
    if (!filters.wi_list_id && lists && lists.length > 0) {
      // Default to the primary LP pipeline (neuro-lp) when present, else the first
      // GRAPHED list (proximity is meaningful), else the first list.
      const def =
        lists.find((l) => l.slug === 'neuro-lp' && l.is_graphed) ?? lists.find((l) => l.is_graphed) ?? lists[0];
      setFilters({ wi_list_id: def.id });
    }
  }, [filters.wi_list_id, lists, setFilters]);

  const onPickList = (list: InvestorList) => {
    setFilters({
      wi_list_id: list.id,
      wi_pl_members: null,
      wi_any_founder: null,
      wi_founder_uids: null,
      wi_direct_only: null,
      ...CLEAR_CONNECTOR_LENS,
    });
    setSelectedIds(new Set());
    analytics.trackListSelected({ listId: list.id, listName: list.name, isGraphed: list.is_graphed });
  };

  // ── Relationship lens (client chips, server filter) ─────────────────────────
  const [relFilter, setRelFilter] = useState<Record<WarmIntroTier, boolean>>({
    co_invested: true,
    engaged: true,
    cold_match: false,
  });

  const enabled = access.canView && !!filters.wi_list_id;

  const { data: facets } = useGetListFacets(filters.wi_list_id, enabled);

  const plMemberOptions = useMemo<{ value: string; label: string }[]>(
    () => (facets?.plMembers ?? []).map((m) => ({ value: m.memberUid ?? m.name, label: `${m.name} (${m.count})` })),
    [facets],
  );

  const founderOptions = useMemo<{ value: string; label: string }[]>(
    () =>
      (facets?.founders ?? []).map((f) => ({
        value: f.name,
        label: `${f.name} (${f.count})`,
      })),
    [facets],
  );

  // Connector lens (task 04): filtered SERVER-SIDE so it spans the whole list, not
  // just the loaded page. The chosen connector's labels flow to the members
  // endpoint, which keeps only LPs with a warm path through that connector.
  const connectorLabel = filters.wi_connector;
  const connectorExactLabels =
    filters.wi_connector_labels.length > 0 ? filters.wi_connector_labels : connectorLabel ? [connectorLabel] : [];
  const connectorContainsLabels = filters.wi_connector_contains;

  const { data, isLoading, isFetching, isFetchingNextPage, fetchNextPage, hasNextPage } = useGetListMembers(
    filters.wi_list_id,
    {
      stage_focus: filters.wi_stage ? [filters.wi_stage as StageFocus] : undefined,
      sector_tags: filters.wi_sectors.length ? (filters.wi_sectors as SectorTag[]) : undefined,
      check_size_range: filters.wi_check_size ? [filters.wi_check_size as CheckSizeRange] : undefined,
      connector_labels: connectorExactLabels.length ? connectorExactLabels : undefined,
      connector_labels_contains: connectorContainsLabels.length ? connectorContainsLabels : undefined,
      pl_member_uids: filters.wi_pl_members.length ? filters.wi_pl_members : undefined,
      founder_names: filters.wi_founder_uids.length && !filters.wi_any_founder ? filters.wi_founder_uids : undefined,
      any_founder: filters.wi_any_founder ?? undefined,
      direct_only: filters.wi_direct_only ?? undefined,
      limit: PAGE_LIMIT,
    },
    enabled,
  );

  /** True while (re)fetching the connector-filtered set (not paginating it). */
  const lensLoading = !!connectorLabel && isFetching && !isFetchingNextPage;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [addListOpen, setAddListOpen] = useState(false);
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [crosswalkOpen, setCrosswalkOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const members = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);
  const total = data?.pages.at(-1)?.total ?? 0;

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) handleLoadMore();
      },
      { rootMargin: '300px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleLoadMore]);

  // Members arrive server-filtered (connector, PL member, founder, direct-only, sector,
  // stage, check); relationship chips refine the loaded set further, client-side.
  const visible = useMemo(() => {
    const anyRelActive = relFilter.co_invested || relFilter.engaged;
    const rows = members.filter((m) => {
      if (anyRelActive && !relFilter[relationshipTier(m)]) return false;
      return true;
    });
    return rows.slice().sort((a, b) => proximityRank(a) - proximityRank(b) || a.last_name.localeCompare(b.last_name));
  }, [members, relFilter]);

  // Report the total list size (not the filtered subset) to the tab badge.
  useEffect(() => {
    if (data) onCountChange?.(total);
  }, [total, data, onCountChange]);

  const onUnifiedSelect = (sel: UnifiedSelection) => {
    setFilters(selectionToConnectorFilter(sel));
    analytics.trackConnectorLensApplied({ nodeLabel: sel.displayLabel, kind: sel.kind });
  };

  const hasAnyFilter =
    !!filters.wi_stage ||
    filters.wi_sectors.length > 0 ||
    !!filters.wi_check_size ||
    filters.wi_pl_members.length > 0 ||
    !!filters.wi_any_founder ||
    filters.wi_founder_uids.length > 0 ||
    !!filters.wi_connector ||
    filters.wi_connector_labels.length > 0 ||
    filters.wi_connector_contains.length > 0;

  const filterPills = useMemo(() => {
    const pills: { key: string; label: string; value: string; onRemove: () => void }[] = [];

    if (filters.wi_stage) {
      pills.push({
        key: 'stage',
        label: 'Stage',
        value: STAGE_FOCUS_LABEL[filters.wi_stage as StageFocus] ?? filters.wi_stage,
        onRemove: () => setFilters({ wi_stage: null }),
      });
    }
    if (filters.wi_check_size) {
      pills.push({
        key: 'check',
        label: 'Check',
        value: filters.wi_check_size,
        onRemove: () => setFilters({ wi_check_size: null }),
      });
    }
    for (const sec of filters.wi_sectors) {
      const secCopy = sec;
      pills.push({
        key: `sector-${sec}`,
        label: 'Industry / Sector',
        value: SECTOR_TAG_LABEL[sec as SectorTag] ?? sec,
        onRemove: () => {
          const next = (filters.wi_sectors as SectorTag[]).filter((x) => x !== secCopy);
          setFilters({ wi_sectors: next.length ? next : null });
        },
      });
    }
    for (const uid of filters.wi_pl_members) {
      const uidCopy = uid;
      const name = facets?.plMembers.find((m) => m.memberUid === uid)?.name ?? uid;
      pills.push({
        key: `plm-${uid}`,
        label: 'PL member',
        value: name,
        onRemove: () => setFilters({ wi_pl_members: filters.wi_pl_members.filter((x) => x !== uidCopy) }),
      });
    }
    if (filters.wi_any_founder) {
      pills.push({
        key: 'any_founder',
        label: 'Founder',
        value: 'Any',
        onRemove: () => setFilters({ wi_any_founder: null }),
      });
    }
    for (const name of filters.wi_founder_uids) {
      const nameCopy = name;
      pills.push({
        key: `founder-${name}`,
        label: 'Founder',
        value: name,
        onRemove: () => setFilters({ wi_founder_uids: filters.wi_founder_uids.filter((x) => x !== nameCopy) }),
      });
    }
    if (filters.wi_connector) {
      pills.push({
        key: 'connector',
        label: 'Connector',
        value: filters.wi_connector,
        onRemove: () => setFilters(CLEAR_CONNECTOR_LENS),
      });
    }
    return pills;
  }, [
    filters.wi_stage,
    filters.wi_check_size,
    filters.wi_sectors,
    filters.wi_pl_members,
    filters.wi_any_founder,
    filters.wi_founder_uids,
    filters.wi_connector,
    facets,
    setFilters,
  ]);

  const clear = () => {
    setFilters({
      wi_stage: null,
      wi_sectors: null,
      wi_check_size: null,
      wi_pl_members: null,
      wi_any_founder: null,
      wi_founder_uids: null,
      ...CLEAR_CONNECTOR_LENS,
    });
    setSelectedIds(new Set());
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const exportSelectedCsv = () => {
    const rows = visible.filter((m) => selectedIds.has(m.investor_id));
    if (rows.length === 0) return;
    const cols = [
      'name',
      'firm',
      'title',
      'email',
      'investor_type',
      'stage_focus',
      'sector_tags',
      'best_proximity_code',
    ];
    const slug = selectedList ? selectedList.slug || selectedList.name.toLowerCase().replace(/\s+/g, '-') : 'list';
    exportInvestorsCsv(rows, cols, `warm-intros-${slug}-${new Date().getTime()}.csv`);
    analytics.trackExport({ count: rows.length, teamName: selectedList?.name });
  };

  const canSelect = access.canEdit;

  const allChecked = visible.length > 0 && visible.every((i) => selectedIds.has(i.investor_id));
  const someChecked = !allChecked && visible.some((i) => selectedIds.has(i.investor_id));
  const toggleAll = () => {
    if (allChecked) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        visible.forEach((i) => next.delete(i.investor_id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        visible.forEach((i) => next.add(i.investor_id));
        return next;
      });
    }
  };

  // ── Derived filter values for controlled selects ────────────────────────────
  const listOptions = useMemo<Option[]>(
    () =>
      (lists ?? []).map((l) => ({
        value: l.id,
        label: `${l.name} · ${l.member_count.toLocaleString()} ${l.member_count === 1 ? 'member' : 'members'}${l.is_graphed ? '' : ' · not graphed'}`,
      })),
    [lists],
  );
  const listValue = listOptions.find((o) => o.value === filters.wi_list_id) ?? null;

  const stageValue = STAGE_OPTIONS.find((o) => o.value === filters.wi_stage) ?? null;
  const checkSizeValue = CHECK_SIZE_OPTIONS.find((o) => o.value === filters.wi_check_size) ?? null;

  const columns = useMemo<ColumnDef<OutreachInvestor>[]>(
    () => [
      {
        id: 'investor',
        header: 'Investor',
        cell: ({ row }) => (
          <>
            <div className={s.nameCell}>
              <span className={s.nameText}>
                {row.original.first_name} {row.original.last_name}
              </span>
              <LabOsBadge profile={row.original.lab_os_profile} variant="icon" />
            </div>
            {row.original.email && <div className={s.subtle}>{row.original.email}</div>}
          </>
        ),
      },
      {
        id: 'team',
        header: 'Team',
        cell: ({ row }) => <TeamCell investor={row.original} />,
        size: 200,
      },
      {
        id: 'sector',
        header: INDUSTRY_SECTOR_LABEL,
        cell: ({ row }) => <SectorTagsList tags={row.original.sector_tags} max={3} />,
        size: 200,
      },
      {
        id: 'proximity',
        header: 'Proximity',
        cell: ({ row }) => {
          const inv = row.original;
          if (!inv.best_proximity_code && inv.has_path !== false) return <span className={s.muted}>—</span>;
          return (
            <ProximityCodeBadge
              code={inv.best_proximity_code}
              cold={inv.has_path === false}
              confidence={inv.best_route_score ?? undefined}
            />
          );
        },
        size: 120,
      },
      {
        id: 'path',
        header: 'Path',
        cell: ({ row }) => {
          const inv = row.original;
          if (!inv.best_route_nodes?.length && !inv.has_path) return <span className={s.muted}>—</span>;
          return (
            <div className={s.pathCell}>
              {inv.best_route_nodes && inv.best_route_nodes.length > 0 && (
                <div className={s.miniRoute}>
                  {inv.best_route_nodes.map((n, i) => (
                    <span key={`${inv.investor_id}-${n.id}-${i}`} className={s.miniRouteNode}>
                      {i > 0 && <span className={s.miniArrow}>→</span>}
                      <RouteChip node={n} />
                    </span>
                  ))}
                </div>
              )}
              <button
                type="button"
                className={s.viewAllLink}
                onClick={(e) => {
                  e.stopPropagation();
                  setFilters({ investorId: inv.investor_id });
                }}
              >
                View all{inv.path_count != null ? ` (${inv.path_count})` : ''}
              </button>
            </div>
          );
        },
        size: 260,
      },
    ],
    [setFilters],
  );

  const table = useReactTable({ data: visible, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div className={s.root}>
      {/* ── List picker + search + filter bar ───────────────────────────────── */}
      <section className={s.builder}>
        <header className={s.builderH}>
          <div className={s.builderTitleRow}>
            <h2 className={s.title}>Find warm investor intros</h2>
            <div className={s.titleActions}>
              {access.canEdit && (
                <button type="button" className={s.howScoredLink} onClick={() => setCrosswalkOpen(true)}>
                  Crosswalk review
                </button>
              )}
              <button type="button" className={s.howScoredLink} onClick={() => setGlossaryOpen(true)}>
                What do these terms mean?
              </button>
            </div>
          </div>
          <p className={s.desc}>Pick a list, then search or filter it down to see the warmest paths PL can reach.</p>
        </header>

        {/* Compact single-row filter bar */}
        <div className={s.filterBar}>
          {/* List picker */}
          <div className={s.filterBarItem} style={{ minWidth: 220 }}>
            <FilterSelect
              options={listOptions}
              value={listValue}
              placeholder="Select list…"
              aria-label="Target list"
              onChange={(opt) => {
                const next = (lists ?? []).find((l) => l.id === opt?.value);
                if (next) onPickList(next);
              }}
            />
          </div>

          {/* Search with magnifier icon */}
          <div className={clsx(s.filterBarItem, s.filterBarSearch)}>
            <div className={s.searchWrap}>
              <span className={s.searchIcon} aria-hidden>
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="9" r="6" />
                  <path d="M15 15l-3.5-3.5" strokeLinecap="round" />
                </svg>
              </span>
              <UnifiedSearchSelect teams={teams} onSelect={onUnifiedSelect} />
            </div>
          </div>

          {/* PL member filter — multi-select from facets */}
          <div className={s.filterBarItem} style={{ minWidth: 160 }}>
            <CheckboxDropdown
              options={plMemberOptions}
              value={filters.wi_pl_members}
              placeholder="PL member"
              aria-label="PL member"
              onChange={(vals) => {
                setFilters({ wi_pl_members: vals.length ? vals : null });
                setSelectedIds(new Set());
              }}
            />
          </div>

          {/* Founder filter — specific-founder multi-select */}
          <div className={s.filterBarItem} style={{ minWidth: 160 }}>
            <CheckboxDropdown
              options={founderOptions}
              value={filters.wi_founder_uids}
              placeholder="Founder"
              aria-label="Specific founder"
              disabled={!!filters.wi_any_founder}
              onChange={(vals) => {
                setFilters({ wi_founder_uids: vals.length ? vals : null });
                setSelectedIds(new Set());
              }}
            />
          </div>

          {/* Stage filter */}
          <div className={s.filterBarItem} style={{ minWidth: 150 }}>
            <FilterSelect
              options={STAGE_OPTIONS}
              value={stageValue}
              placeholder="Stage"
              isClearable
              aria-label="Stage focus"
              onChange={(opt) => {
                setFilters({ wi_stage: opt?.value || null });
                setSelectedIds(new Set());
              }}
            />
          </div>

          {/* Check size filter */}
          <div className={s.filterBarItem} style={{ minWidth: 150 }}>
            <FilterSelect
              options={CHECK_SIZE_OPTIONS}
              value={checkSizeValue}
              placeholder="Check size"
              isClearable
              aria-label="Check size"
              onChange={(opt) => {
                setFilters({ wi_check_size: opt?.value || null });
                setSelectedIds(new Set());
              }}
            />
          </div>

          {/* Industry / Sector multi-select */}
          <div className={s.filterBarItem} style={{ minWidth: 180 }}>
            <CheckboxDropdown
              options={SECTOR_OPTIONS}
              value={filters.wi_sectors}
              placeholder={INDUSTRY_SECTOR_LABEL}
              aria-label="Industry / Sector"
              onChange={(vals) => {
                setFilters({ wi_sectors: vals.length ? (vals as SectorTag[]) : null });
                setSelectedIds(new Set());
              }}
            />
          </div>
        </div>

        {filterPills.length > 0 && (
          <div className={s.filterPills}>
            {filterPills.map((pill) => (
              <span key={pill.key} className={s.pill}>
                {pill.label}: <strong>{pill.value}</strong>
                <button
                  type="button"
                  className={s.pillRemove}
                  onClick={pill.onRemove}
                  aria-label={`Remove ${pill.label} filter`}
                >
                  ×
                </button>
              </span>
            ))}
            <button type="button" className={s.clearAll} onClick={clear}>
              Clear All
            </button>
          </div>
        )}
      </section>

      {!enabled && (
        <div className={s.placeholder}>
          <div className={s.placeholderIcon}>⚡</div>
          <div className={s.placeholderTitle}>Pick a target list to begin</div>
          <div className={s.placeholderDesc}>
            Choose a list above to see its members ranked by how warmly PL can reach them.
          </div>
        </div>
      )}

      {enabled && (
        <section className={s.results}>
          <div className={s.resultsHeader}>
            <div className={s.resultsCount}>
              {isLoading && members.length === 0 ? (
                'Loading members…'
              ) : (
                <>
                  <strong>{visible.length}</strong> shown · {members.length.toLocaleString()} loaded ·{' '}
                  {total.toLocaleString()} in {selectedList?.name ?? 'list'}
                  {connectorLabel && lensLoading ? ' · finding paths…' : ''} · sorted by proximity (warmest first)
                </>
              )}
            </div>
            <div className={s.resultsActions}>
              <div className={s.relChips}>
                <label className={s.directOnlyToggle}>
                  Direct only
                  <span className={s.toggleTrack} aria-hidden>
                    <input
                      type="checkbox"
                      className={s.toggleInput}
                      checked={!!filters.wi_direct_only}
                      onChange={() => setFilters({ wi_direct_only: filters.wi_direct_only ? null : true })}
                    />
                    <span className={s.toggleThumb} />
                  </span>
                </label>
                {REL_FILTERS.map(({ tier, label }) => (
                  <button
                    key={tier}
                    type="button"
                    className={clsx(s.relChip, relFilter[tier] && s.relChipOn)}
                    onClick={() => setRelFilter((r) => ({ ...r, [tier]: !r[tier] }))}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {access.canEdit && (
                <div className={s.resultsActionsRow}>
                  <AddToListButton
                    lists={lists ?? []}
                    investorIds={[...selectedIds]}
                    open={addListOpen}
                    onOpenChange={setAddListOpen}
                  />
                  <button className={s.btnPrimary} onClick={exportSelectedCsv} disabled={selectedIds.size === 0}>
                    ⤓ Export CSV ({selectedIds.size})
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  {canSelect && (
                    <th className={s.checkboxCol}>
                      <input
                        type="checkbox"
                        checked={allChecked}
                        ref={(el) => {
                          if (el) el.indeterminate = someChecked;
                        }}
                        onChange={toggleAll}
                      />
                    </th>
                  )}
                  {table.getHeaderGroups()[0]?.headers.map((h) => (
                    <th
                      key={h.id}
                      className={clsx(
                        s.th,
                        h.id === 'investor' && s.frozenName,
                        h.id === 'investor' && (canSelect ? s.frozenNameWithCheckbox : s.frozenNameNoCheckbox),
                      )}
                      style={
                        h.column.columnDef.size !== undefined
                          ? { width: h.column.getSize(), maxWidth: h.column.getSize() }
                          : undefined
                      }
                    >
                      {flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className={clsx(s.row, selectedIds.has(row.original.investor_id) && s.rowSelected)}
                    onClick={(e) => {
                      const t = e.target as HTMLElement;
                      if (t.closest('input[type="checkbox"]') || t.closest('a') || t.closest('button')) return;
                      setFilters({ investorId: row.original.investor_id });
                    }}
                  >
                    {canSelect && (
                      <td className={s.checkboxCol}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(row.original.investor_id)}
                          onChange={() => toggleSelected(row.original.investor_id)}
                        />
                      </td>
                    )}
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={clsx(
                          s.td,
                          cell.column.id === 'investor' && s.frozenName,
                          cell.column.id === 'investor' &&
                            (canSelect ? s.frozenNameWithCheckbox : s.frozenNameNoCheckbox),
                        )}
                        style={
                          cell.column.columnDef.size !== undefined
                            ? { width: cell.column.getSize(), maxWidth: cell.column.getSize() }
                            : undefined
                        }
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={s.mobileCards}>
            {visible.map((inv) => {
              const tier = relationshipTier(inv);
              const relLabel = tier === 'co_invested' ? 'Co-invested' : tier === 'engaged' ? 'Engaged' : 'Cold';
              const relCls = tier === 'co_invested' ? s.relCo : tier === 'engaged' ? s.relEngaged : s.relCold;
              return (
                <div
                  key={inv.investor_id}
                  className={s.mobileCard}
                  onClick={() => setFilters({ investorId: inv.investor_id })}
                >
                  <div className={s.cardHeader}>
                    <span className={s.cardName}>
                      {inv.first_name} {inv.last_name}
                    </span>
                    {(inv.best_proximity_code || inv.has_path === false) && (
                      <ProximityCodeBadge
                        code={inv.best_proximity_code}
                        cold={inv.has_path === false}
                        confidence={inv.best_route_score ?? undefined}
                      />
                    )}
                  </div>
                  {inv.email && <div className={s.cardEmail}>{inv.email}</div>}
                  <div className={s.cardRelRow}>
                    <span className={clsx(s.relPill, relCls)}>{relLabel}</span>
                    {inv.firm && <span className={s.cardFirm}>{inv.firm}</span>}
                  </div>
                  {inv.sector_tags?.length > 0 && <SectorTagsList tags={inv.sector_tags} max={4} />}
                  {inv.best_route_nodes && inv.best_route_nodes.length > 0 && (
                    <div className={s.cardPath}>
                      {inv.best_route_nodes.map((n, i) => (
                        <span key={`${inv.investor_id}-${n.id}-${i}`} className={s.miniRouteNode}>
                          {i > 0 && <span className={s.miniArrow}>→</span>}
                          <RouteChip node={n} />
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div ref={sentinelRef} className={s.sentinel} />
          {isFetchingNextPage && <div className={s.sentinelLoader}>Loading more…</div>}

          {!isLoading && members.length === 0 && (
            <div className={s.empty}>
              {lensLoading ? (
                <>Finding warm paths for {connectorLabel}…</>
              ) : connectorLabel ? (
                <>No warm path exists for {connectorLabel} on this list.</>
              ) : (
                <>No members match the current filters -- adjust the relationship chips.</>
              )}
            </div>
          )}
          {!isLoading && members.length > 0 && visible.length === 0 && (
            <div className={s.empty}>
              {`${members.length} member${members.length === 1 ? '' : 's'} hidden by the relationship filter — adjust the relationship chips above.`}
            </div>
          )}
        </section>
      )}

      <GlossaryModal open={glossaryOpen} onClose={() => setGlossaryOpen(false)} />
      <CrosswalkReviewPanel open={crosswalkOpen} onClose={() => setCrosswalkOpen(false)} canEdit={access.canEdit} />
    </div>
  );
}

function TeamCell({ investor }: { investor: OutreachInvestor }) {
  const [expanded, setExpanded] = useState(false);
  const extra = investor.affiliations?.length ?? 0;
  const shown = expanded ? (investor.affiliations ?? []) : [];

  return (
    <>
      <div className={s.teamCell}>{investor.firm || <span className={s.muted}>—</span>}</div>
      {investor.title && <div className={s.subtle}>{investor.title}</div>}
      {extra > 0 && (
        <div className={s.affiliationsList}>
          {shown.map((a) =>
            a.firm_domain ? (
              <a
                key={a.firm}
                href={`https://${a.firm_domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className={s.affiliationLink}
                onClick={(e) => e.stopPropagation()}
              >
                {a.firm} ↗
              </a>
            ) : (
              <span key={a.firm} className={s.affiliationName}>
                {a.firm}
              </span>
            ),
          )}
          <button
            type="button"
            className={s.affiliationToggle}
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((v) => !v);
            }}
          >
            {expanded ? 'Show less' : `+${extra} more`}
          </button>
        </div>
      )}
    </>
  );
}

function RelationshipCell({ investor }: { investor: OutreachInvestor }) {
  const tier = relationshipTier(investor);
  const { label, cls } =
    tier === 'co_invested'
      ? { label: 'Co-invested', cls: s.relCo }
      : tier === 'engaged'
        ? { label: 'Engaged', cls: s.relEngaged }
        : { label: 'Cold', cls: s.relCold };
  return (
    <div className={s.relCell}>
      <span className={clsx(s.relPill, cls)}>{label}</span>
      {tier === 'engaged' && investor.engagement_tier !== 'T4_cold' && (
        <EngagementTierBadge tier={investor.engagement_tier} compact />
      )}
    </div>
  );
}

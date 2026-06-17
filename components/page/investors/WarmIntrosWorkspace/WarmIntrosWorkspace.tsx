'use client';

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryStates } from 'nuqs';
import clsx from 'clsx';
import { useGetCoInvestorTeams } from '@/services/investors/hooks/useGetCoInvestorTeams';
import { useGetInvestorLists } from '@/services/investors/hooks/useGetInvestorLists';
import { useGetListMembers } from '@/services/investors/hooks/useGetListMembers';
import { useInvestorsAccess } from '@/services/rbac/hooks/useInvestorsAccess';
import { investorsFilterParsers } from '@/app/investors/(investors-page)/searchParams';

import {
  CHECK_SIZE_RANGES,
  INDUSTRY_SECTOR_LABEL,
  INVESTOR_TYPE_LABEL,
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
import { WarmPathDetail } from '../WarmPathDetail/WarmPathDetail';
import { CrosswalkReviewPanel } from '../CrosswalkReviewPanel/CrosswalkReviewPanel';
import { exportInvestorsCsv } from '../utils/exportCsv';
import { GlossaryModal } from './GlossaryModal';
import { ListPicker } from './ListPicker';
import { CLEAR_CONNECTOR_LENS, selectionToConnectorFilter } from './connectorLensFilters';
import { UnifiedSearchSelect, type UnifiedSelection } from './UnifiedSearchSelect';
import s from './WarmIntrosWorkspace.module.scss';

interface Props {
  onCountChange?: (count: number) => void;
}

const REL_FILTERS: { tier: WarmIntroTier; label: string }[] = [
  { tier: 'co_invested', label: 'Co-invested' },
  { tier: 'engaged', label: 'Engaged' },
  { tier: 'cold_match', label: 'Cold' },
];

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

type Draft = {
  stage: string;
  sectors: SectorTag[];
  check: string;
};

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
      // GRAPHED list (proximity is meaningful), else the first list. Now that Gold
      // is also graphed, a bare find(is_graphed) would pick Gold (sorts first by
      // name), so prefer the flagship neuro list explicitly.
      const def =
        lists.find((l) => l.slug === 'neuro-lp' && l.is_graphed) ?? lists.find((l) => l.is_graphed) ?? lists[0];
      setFilters({ wi_list_id: def.id });
    }
  }, [filters.wi_list_id, lists, setFilters]);

  const onPickList = (list: InvestorList) => {
    setFilters({ wi_list_id: list.id, ...CLEAR_CONNECTOR_LENS });
    setExpandedIds(new Set());
    setSelectedIds(new Set());
    analytics.trackListSelected({ listId: list.id, listName: list.name, isGraphed: list.is_graphed });
  };

  // ── In-list refinement: draft (form) vs applied (URL) ───────────────────────
  const [draft, setDraft] = useState<Draft>(() => ({
    stage: filters.wi_stage,
    sectors: filters.wi_sectors as SectorTag[],
    check: filters.wi_check_size,
  }));

  // Keep draft in sync when URL params change externally (browser back/forward,
  // deep-link navigation). Skip the first mount since useState already captured
  // the initial values.
  const isMounted = useRef(false);
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }

    setDraft({
      stage: filters.wi_stage,
      sectors: filters.wi_sectors as SectorTag[],
      check: filters.wi_check_size,
    });
  }, [filters.wi_stage, filters.wi_sectors, filters.wi_check_size]);

  const applied = useMemo(
    () => ({
      stage: filters.wi_stage as StageFocus | '',
      sectors: filters.wi_sectors as SectorTag[],
      check: filters.wi_check_size as CheckSizeRange | '',
    }),
    [filters.wi_stage, filters.wi_sectors, filters.wi_check_size],
  );

  const toggleDraftSector = (sec: SectorTag) =>
    setDraft((d) => ({
      ...d,
      sectors: d.sectors.includes(sec) ? d.sectors.filter((x) => x !== sec) : [...d.sectors, sec],
    }));

  const apply = () => {
    setFilters({
      wi_stage: draft.stage || null,
      wi_sectors: draft.sectors.length ? draft.sectors : null,
      wi_check_size: draft.check || null,
    });
    setSelectedIds(new Set());
    setExpandedIds(new Set());
  };

  const clear = () => {
    setDraft({ stage: '', sectors: [], check: '' });
    setFilters({ wi_stage: null, wi_sectors: null, wi_check_size: null, ...CLEAR_CONNECTOR_LENS });
    setSelectedIds(new Set());
    setExpandedIds(new Set());
  };

  // ── Relationship lens (client chips, server filter) ─────────────────────────
  const [relFilter, setRelFilter] = useState<Record<WarmIntroTier, boolean>>({
    co_invested: true,
    engaged: true,
    // Show cold by default: an LP pipeline is mostly prospects with NO co-invest
    // or engagement relationship yet (their value is the warm PATH, not an existing
    // relationship). Hiding cold emptied the whole table for the real neuro list.
    cold_match: true,
  });

  const enabled = access.canView && !!filters.wi_list_id;

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
      stage_focus: applied.stage ? [applied.stage] : undefined,
      sector_tags: applied.sectors.length ? applied.sectors : undefined,
      check_size_range: applied.check ? [applied.check] : undefined,
      connector_labels: connectorExactLabels.length ? connectorExactLabels : undefined,
      connector_labels_contains: connectorContainsLabels.length ? connectorContainsLabels : undefined,
      limit: PAGE_LIMIT,
    },
    enabled,
  );

  /** True while (re)fetching the connector-filtered set (not paginating it). */
  const lensLoading = !!connectorLabel && isFetching && !isFetchingNextPage;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
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

  // Members already arrive connector-filtered from the server (task 04); the
  // relationship chips refine the loaded set further, client-side.
  const visible = useMemo(() => {
    const rows = members.filter((m) => relFilter[relationshipTier(m)]);
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

  const toggleExpanded = (id: string, bestProximityCode?: string | null) => {
    const isExpanding = !expandedIds.has(id);
    setExpandedIds((prev) => {
      const next = new Set(prev);
      isExpanding ? next.add(id) : next.delete(id);
      return next;
    });
    if (isExpanding) analytics.trackPathExpanded({ investorId: id, bestProximityCode });
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
  const colCount = (canSelect ? 1 : 0) + 7;

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
          <p className={s.desc}>
            Pick a target list, then search for an investor or fund — or filter the list down — to see the warmest paths
            PL can use to reach them.
          </p>
        </header>

        <div className={clsx(s.field, s.fieldMb)}>
          <label className={s.label}>Target list</label>
          <ListPicker lists={lists} selectedId={filters.wi_list_id} onSelect={onPickList} />
        </div>

        <div className={clsx(s.field, s.fieldMb)}>
          <label className={s.label}>Search investors, funds, founders or teams</label>
          <UnifiedSearchSelect teams={teams} onSelect={onUnifiedSelect} />
        </div>

        {connectorLabel && (
          <div className={s.lensBar}>
            <span className={s.lensLabel}>Connector lens:</span>
            <span className={s.lensChip}>
              paths through <strong>{connectorLabel}</strong>
              <button
                type="button"
                className={s.lensClear}
                onClick={() => setFilters(CLEAR_CONNECTOR_LENS)}
                aria-label="Clear connector lens"
              >
                &times;
              </button>
            </span>
          </div>
        )}

        <div className={s.builderRow}>
          <div className={s.field}>
            <label className={s.label}>Stage focus</label>
            <select
              className={s.select}
              value={draft.stage}
              onChange={(e) => setDraft((d) => ({ ...d, stage: e.target.value }))}
            >
              <option value="">Any</option>
              {STAGE_FOCUSES.filter((st) => st !== 'unknown').map((st) => (
                <option key={st} value={st}>
                  {STAGE_FOCUS_LABEL[st]}
                </option>
              ))}
            </select>
          </div>

          <div className={s.field}>
            <label className={s.label}>Check size</label>
            <select
              className={s.select}
              value={draft.check}
              onChange={(e) => setDraft((d) => ({ ...d, check: e.target.value }))}
            >
              <option value="">Any</option>
              {CHECK_SIZE_RANGES.filter((c) => c !== 'unknown').map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className={s.actions}>
            <button className={s.btnPrimary} onClick={apply}>
              Apply
            </button>
            <button className={s.btn} onClick={clear}>
              Clear
            </button>
          </div>
        </div>

        <div className={clsx(s.field, s.fieldMt)}>
          <label className={s.label}>{INDUSTRY_SECTOR_LABEL}</label>
          <div className={s.sectorChips}>
            {SECTOR_TAGS.map((sec) => (
              <button
                key={sec}
                className={clsx(s.chip, draft.sectors.includes(sec) && s.chipOn)}
                onClick={() => toggleDraftSector(sec)}
              >
                {SECTOR_TAG_LABEL[sec]}
              </button>
            ))}
          </div>
        </div>
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
                <button className={s.btnPrimary} onClick={exportSelectedCsv} disabled={selectedIds.size === 0}>
                  ⤓ Export CSV ({selectedIds.size})
                </button>
              )}
            </div>
          </div>

          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  {canSelect && <th className={s.checkboxCol}></th>}
                  <th>Investor</th>
                  <th>Team</th>
                  <th>{INDUSTRY_SECTOR_LABEL}</th>
                  <th>Stage</th>
                  <th>Type</th>
                  <th>Relationship</th>
                  <th>Proximity</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((inv) => {
                  const isExpanded = expandedIds.has(inv.investor_id);
                  const hasProximity = !!inv.best_proximity_code || inv.has_path === false;
                  return (
                    <Fragment key={inv.investor_id}>
                      <tr className={s.row} onClick={() => setFilters({ investorId: inv.investor_id })}>
                        {canSelect && (
                          <td className={s.checkboxCol}>
                            <input
                              type="checkbox"
                              checked={selectedIds.has(inv.investor_id)}
                              onClick={(e) => e.stopPropagation()}
                              onChange={() => toggleSelected(inv.investor_id)}
                            />
                          </td>
                        )}
                        <td>
                          <div className={s.nameCell}>
                            {inv.first_name} {inv.last_name}
                            <LabOsBadge profile={inv.lab_os_profile} variant="icon" />
                          </div>
                          <div className={s.subtle}>{inv.email}</div>
                        </td>
                        <td>
                          <div className={s.teamCell}>{inv.firm || <span className={s.muted}>—</span>}</div>
                          {inv.title && <div className={s.subtle}>{inv.title}</div>}
                        </td>
                        <td>
                          <SectorTagsList tags={inv.sector_tags} max={3} />
                        </td>
                        <td>{STAGE_FOCUS_LABEL[inv.stage_focus] ?? <span className={s.muted}>—</span>}</td>
                        <td>{INVESTOR_TYPE_LABEL[inv.investor_type] ?? <span className={s.muted}>—</span>}</td>
                        <td>
                          <RelationshipCell investor={inv} />
                        </td>
                        <td>
                          <div className={s.proximityCell}>
                            {hasProximity ? (
                              <ProximityCodeBadge code={inv.best_proximity_code} cold={inv.has_path === false} />
                            ) : (
                              <span className={s.muted}>—</span>
                            )}
                            <button
                              type="button"
                              className={s.expandBtn}
                              aria-expanded={isExpanded}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpanded(inv.investor_id, inv.best_proximity_code);
                              }}
                            >
                              {isExpanded ? 'Hide' : 'View paths'}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className={s.detailRow}>
                          <td colSpan={colCount} onClick={(e) => e.stopPropagation()}>
                            <WarmPathDetail
                              key={inv.investor_id}
                              investorId={inv.investor_id}
                              bestProximityCode={inv.best_proximity_code}
                              canEdit={access.canEdit}
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
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
                <>This list has no matching members. Try widening the sectors or removing the check-size constraint.</>
              )}
            </div>
          )}
          {!isLoading && members.length > 0 && visible.length === 0 && (
            <div className={s.empty}>
              {members.length} member{members.length === 1 ? '' : 's'} hidden by the current filters — adjust the
              relationship chips{connectorLabel ? ' or clear the connector lens' : ''}.
            </div>
          )}
        </section>
      )}

      <GlossaryModal open={glossaryOpen} onClose={() => setGlossaryOpen(false)} />
      <CrosswalkReviewPanel open={crosswalkOpen} onClose={() => setCrosswalkOpen(false)} canEdit={access.canEdit} />
    </div>
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

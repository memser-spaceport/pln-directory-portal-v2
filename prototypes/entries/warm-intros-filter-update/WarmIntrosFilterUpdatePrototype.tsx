'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import {
  CHECK_SIZE_RANGES,
  INDUSTRY_SECTOR_LABEL,
  INVESTOR_TYPE_LABEL,
  SECTOR_TAGS,
  SECTOR_TAG_LABEL,
  STAGE_FOCUSES,
  STAGE_FOCUS_LABEL,
} from '@/services/investors/constants';
import type { CheckSizeRange, InvestorList, SectorTag, StageFocus, WarmIntroTier } from '@/services/investors/types';
import { ProximityCodeBadge } from '@/components/page/investors/ProximityCodeBadge/ProximityCodeBadge';
import { EngagementTierBadge } from '@/components/page/investors/EngagementTierBadge/EngagementTierBadge';
import { SectorTagsList } from '@/components/page/investors/SectorTagsList/SectorTagsList';
import { Tag } from '@/components/ui/Tag/Tag';
import { ListPicker } from '@/components/page/investors/WarmIntrosWorkspace/ListPicker';
import { GlossaryModal } from '@/components/page/investors/WarmIntrosWorkspace/GlossaryModal';
import { Drawer } from '@/components/common/Drawer/Drawer';
import { Tabs } from '@/components/common/Tabs/Tabs';
// Reuse the production workspace styling so the prototype tracks production 1:1.
import s from '@/components/page/investors/WarmIntrosWorkspace/WarmIntrosWorkspace.module.scss';
import { DEFAULT_LIST_ID, MOCK_INVESTOR_LISTS, MOCK_LISTS, MOCK_MEMBERS, pathChainNodes, type MockInvestor } from './mocks';
import { PeopleChain } from './PeopleChain';
import { ArrowUpRightIcon } from '@/components/icons';
import { WorkspaceSearch } from './WorkspaceSearch';
import { InvestorDrawerMock } from './InvestorDrawerMock';
import { AddToListButton } from './AddToListButton';
import x from './WarmIntrosImprovements.module.scss';

const REL_FILTERS: { tier: WarmIntroTier; label: string }[] = [
  { tier: 'co_invested', label: 'Co-invested' },
  { tier: 'engaged', label: 'Engaged' },
  { tier: 'cold_match', label: 'Cold' },
];

const VISUAL_TABS = [
  { value: 'all', label: 'All Investors' },
  { value: 'warm-intros', label: 'Warm Intros' },
];

function relationshipMeta(rel: WarmIntroTier): { label: string; cls: string } {
  if (rel === 'co_invested') return { label: 'Co-invested', cls: s.relCo };
  if (rel === 'engaged') return { label: 'Engaged', cls: s.relEngaged };
  return { label: 'Cold', cls: s.relCold };
}

// Warmer first: caliber A < B < none, then fewer hops; cold (no path) last.
function proximityRank(inv: MockInvestor): number {
  if (!inv.has_path || !inv.best_proximity_code) return 999;
  const code = inv.best_proximity_code;
  const cal = code.slice(-1);
  const calRank = cal === 'A' ? 0 : cal === 'B' ? 1 : 2;
  const hopMatch = code.match(/\+(\d)/);
  const hops = hopMatch ? Number(hopMatch[1]) : 9;
  return calRank * 10 + hops;
}

// Does any path for this investor route through the searched node?
function matchesConnector(inv: MockInvestor, label: string): boolean {
  const full = `${inv.first_name} ${inv.last_name}`;
  if (full === label) return true;
  return inv.paths.some(
    (p) =>
      p.contact?.name === label ||
      p.orgConnector?.name === label ||
      p.team?.name === label ||
      p.chain.some((c) => c.label === label),
  );
}

type Draft = { stage: string; sectors: SectorTag[]; check: string };

export default function WarmIntrosFilterUpdatePrototype() {
  // Reuse interactive, client-only widgets — gate render on mount so SSR === first
  // client render (avoids hydration mismatches).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Track mobile so the detail drawer goes full-screen (our inline width on the
  // Drawer would otherwise override its built-in mobile 100vw rule).
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const [members, setMembers] = useState<MockInvestor[]>(MOCK_MEMBERS);
  const [currentListId, setCurrentListId] = useState(DEFAULT_LIST_ID);
  const [drawerId, setDrawerId] = useState<string | null>(null);

  const [draft, setDraft] = useState<Draft>({ stage: '', sectors: [], check: '' });
  const [applied, setApplied] = useState<Draft>({ stage: '', sectors: [], check: '' });
  const [relFilter, setRelFilter] = useState<Record<WarmIntroTier, boolean>>({
    co_invested: true,
    engaged: true,
    cold_match: true,
  });
  const [connectorLabel, setConnectorLabel] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [crosswalkOpen, setCrosswalkOpen] = useState(false);

  // Sectors collapse into a count-badge popover to keep the filter bar to one row.
  const [sectorOpen, setSectorOpen] = useState(false);
  const sectorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!sectorOpen) return;
    const onDown = (e: MouseEvent) => {
      if (sectorRef.current && !sectorRef.current.contains(e.target as Node)) setSectorOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [sectorOpen]);

  const switchList = (list: InvestorList) => {
    setCurrentListId(list.id);
    setDrawerId(null);
    setSelectedIds(new Set());
    setConnectorLabel(null);
  };

  const applyFilters = () => setApplied(draft);
  const clearFilters = () => {
    setDraft({ stage: '', sectors: [], check: '' });
    setApplied({ stage: '', sectors: [], check: '' });
    setConnectorLabel(null);
    setSelectedIds(new Set());
  };

  const toggleDraftSector = (sec: SectorTag) =>
    setDraft((d) => ({
      ...d,
      sectors: d.sectors.includes(sec) ? d.sectors.filter((x) => x !== sec) : [...d.sectors, sec],
    }));

  const toggleSelected = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const onList = useMemo(
    () => members.filter((m) => m.list_ids.includes(currentListId)),
    [members, currentListId],
  );

  const visible = useMemo(() => {
    let rows = onList;
    if (applied.stage) rows = rows.filter((m) => m.stage_focus === (applied.stage as StageFocus));
    if (applied.check) rows = rows.filter((m) => m.check_size_range === (applied.check as CheckSizeRange));
    if (applied.sectors.length) rows = rows.filter((m) => m.sector_tags.some((t) => applied.sectors.includes(t)));
    rows = rows.filter((m) => relFilter[m.relationship]);
    if (connectorLabel) rows = rows.filter((m) => matchesConnector(m, connectorLabel));
    return rows
      .slice()
      .sort((a, b) => proximityRank(a) - proximityRank(b) || a.last_name.localeCompare(b.last_name));
  }, [onList, applied, relFilter, connectorLabel]);

  // Clear only does something when a filter is actually set (draft, applied, or
  // an active connector lens) — disable it otherwise so it's not dead UI.
  const hasActiveFilters =
    !!draft.stage ||
    !!draft.check ||
    draft.sectors.length > 0 ||
    !!applied.stage ||
    !!applied.check ||
    applied.sectors.length > 0 ||
    !!connectorLabel;

  const totalOnList = members.filter((m) => m.list_ids.includes(currentListId)).length;
  const currentListName = MOCK_LISTS.find((l) => l.id === currentListId)?.name ?? 'list';
  const drawerInvestor = members.find((m) => m.investor_id === drawerId) ?? null;

  // Live list membership: derive counts from members so the picker + add menu
  // reflect add/remove. Lists are scopes; an investor can belong to several.
  const liveLists = useMemo(
    () =>
      MOCK_INVESTOR_LISTS.map((l) => ({
        ...l,
        member_count: members.filter((m) => m.list_ids.includes(l.id)).length,
      })),
    [members],
  );
  const addToList = (investorIds: string[], listId: string) =>
    setMembers((prev) =>
      prev.map((m) =>
        investorIds.includes(m.investor_id) && !m.list_ids.includes(listId)
          ? { ...m, list_ids: [...m.list_ids, listId] }
          : m,
      ),
    );
  const removeFromList = (investorId: string, listId: string) =>
    setMembers((prev) =>
      prev.map((m) => (m.investor_id === investorId ? { ...m, list_ids: m.list_ids.filter((id) => id !== listId) } : m)),
    );

  const exportCsv = () => {
    const rows = visible.filter((m) => selectedIds.has(m.investor_id));
    if (rows.length === 0) return;
    const head = ['name', 'firm', 'email', 'proximity', 'best_connector'];
    const lines = rows.map((m) =>
      [
        `${m.first_name} ${m.last_name}`,
        m.firm,
        m.email,
        m.best_proximity_code ?? 'Cold',
        m.paths[0]?.contact?.name ?? m.paths[0]?.orgConnector?.name ?? '',
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(','),
    );
    const blob = new Blob([[head.join(','), ...lines].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `warm-intros-${currentListId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!mounted) return <div className={s.root} />;

  return (
    <div className={x.page}>

      {/* Page header (mirrors the real Investors DB page) */}
      <div className={x.pageHeader}>
        <div className={x.pageTitleRow}>
          <h1 className={x.pageTitle}>Investors Database</h1>
          <span className={x.internalBadge}>Access Restricted to - PL investment team</span>
        </div>
        <p className={x.pageSubtitle}>Internal Investors database — Network, co-investors, and outreach pipeline.</p>
      </div>

      <div className={x.tabBar}>
        <Tabs
          tabs={VISUAL_TABS}
          value="warm-intros"
          onValueChange={() => {}}
          variant="underline"
          classes={{ tab: x.tab, badge: x.tabBadge }}
        />
      </div>

      {/* ── Workspace (faithful copy of WarmIntrosWorkspace) ─────────────────── */}
      <div className={s.root}>
        <section className={s.builder}>
          <header className={s.builderH}>
            <div className={s.builderTitleRow}>
              <h2 className={s.title}>Find warm investor intros</h2>
              <div className={s.titleActions}>
                <button type="button" className={s.howScoredLink} onClick={() => setCrosswalkOpen(true)}>
                  Crosswalk review
                </button>
                <button type="button" className={s.howScoredLink} onClick={() => setGlossaryOpen(true)}>
                  What do these terms mean?
                </button>
              </div>
            </div>
            <p className={s.desc}>Pick a list, then search or filter it down to see the warmest paths PL can reach.</p>
          </header>

          {/* ── Compact filter bar: list · search · stage · check · sectors · actions ── */}
          <div className={clsx(x.filterBar, x.builderRowResp)}>
            <div className={x.listField}>
              <span className={x.inlineLabel}>List</span>
              <div className={x.listPickerWrap}>
                <ListPicker lists={liveLists} selectedId={currentListId} onSelect={switchList} />
              </div>
            </div>

            <div className={x.searchField}>
              <WorkspaceSearch onSelect={setConnectorLabel} />
            </div>

            <select
              className={clsx(s.select, x.select)}
              value={draft.stage}
              onChange={(e) => setDraft((d) => ({ ...d, stage: e.target.value }))}
              aria-label="Stage focus"
            >
              <option value="">Any stage</option>
              {STAGE_FOCUSES.filter((st) => st !== 'unknown').map((st) => (
                <option key={st} value={st}>
                  {STAGE_FOCUS_LABEL[st]}
                </option>
              ))}
            </select>

            <select
              className={clsx(s.select, x.select)}
              value={draft.check}
              onChange={(e) => setDraft((d) => ({ ...d, check: e.target.value }))}
              aria-label="Check size"
            >
              <option value="">Any check size</option>
              {CHECK_SIZE_RANGES.filter((c) => c !== 'unknown').map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <div className={x.sectorPopWrap} ref={sectorRef}>
              <button
                type="button"
                className={clsx(s.select, x.select, x.sectorTrigger)}
                aria-expanded={sectorOpen}
                onClick={() => setSectorOpen((o) => !o)}
              >
                {INDUSTRY_SECTOR_LABEL}
                {draft.sectors.length > 0 && <span className={x.sectorCount}>{draft.sectors.length}</span>}
              </button>
              {sectorOpen && (
                <div className={x.sectorPop}>
                  <div className={x.sectorPopHead}>
                    <span>{INDUSTRY_SECTOR_LABEL}</span>
                    {draft.sectors.length > 0 && (
                      <button
                        type="button"
                        className={x.sectorClear}
                        onClick={() => setDraft((d) => ({ ...d, sectors: [] }))}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className={s.sectorChips}>
                    {SECTOR_TAGS.map((sec) => (
                      <Tag
                        key={sec}
                        value={SECTOR_TAG_LABEL[sec]}
                        keyValue={sec}
                        variant="secondary"
                        selected={draft.sectors.includes(sec)}
                        callback={() => toggleDraftSector(sec)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className={clsx(s.actions, x.filterActions, x.builderActions)}>
              <button className={s.btnPrimary} onClick={applyFilters}>
                Apply
              </button>
              <button className={s.btn} onClick={clearFilters} disabled={!hasActiveFilters}>
                Clear
              </button>
            </div>
          </div>

          {connectorLabel && (
            <div className={clsx(s.lensBar, x.lensBarMt)}>
              <span className={s.lensLabel}>Connector lens:</span>
              <span className={x.savedView}>
                <span className={x.lensChipText}>
                  paths through <strong>{connectorLabel}</strong>
                </span>
                <button
                  type="button"
                  className={x.savedViewDelete}
                  onClick={() => setConnectorLabel(null)}
                  aria-label="Clear connector lens"
                >
                  &times;
                </button>
              </span>
            </div>
          )}

        </section>

        <section className={s.results}>
          <div className={clsx(s.resultsHeader, x.resultsHeaderResp)}>
            <div className={s.resultsCount}>
              <strong>{visible.length}</strong> shown · {totalOnList.toLocaleString()} in {currentListName} · sorted by
              proximity (warmest first)
            </div>
            <div className={clsx(s.resultsActions, x.resultsActionsResp)}>
              <div className={s.relChips}>
                {REL_FILTERS.map(({ tier, label }) => (
                  <Tag
                    key={tier}
                    value={label}
                    keyValue={tier}
                    variant="secondary"
                    selected={relFilter[tier]}
                    className={x.relChip}
                    callback={() => setRelFilter((r) => ({ ...r, [tier]: !r[tier] }))}
                  />
                ))}
              </div>
              <AddToListButton
                lists={liveLists}
                disabled={selectedIds.size === 0}
                label={selectedIds.size ? `Add to list (${selectedIds.size})` : 'Add to list'}
                onAdd={(listId) => addToList([...selectedIds], listId)}
              />
              <button className={s.btnPrimary} onClick={exportCsv} disabled={selectedIds.size === 0}>
                ⤓ Export CSV ({selectedIds.size})
              </button>
            </div>
          </div>

          <div className={clsx(s.tableWrap, x.tableDesktop)}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th className={s.checkboxCol}></th>
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
                  const rel = relationshipMeta(inv.relationship);
                  const bestPath = inv.paths[0];
                  const hasProximity = !!inv.best_proximity_code || inv.has_path === false;
                  return (
                    <tr
                      key={inv.investor_id}
                      className={clsx(s.row, x.hoverRow)}
                      onClick={() => setDrawerId(inv.investor_id)}
                    >
                        <td className={s.checkboxCol}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(inv.investor_id)}
                            onClick={(e) => e.stopPropagation()}
                            onChange={() => toggleSelected(inv.investor_id)}
                          />
                        </td>
                        <td>
                          <div className={x.nameCellRow}>
                            <div>
                              <div className={s.nameCell}>
                                {inv.first_name} {inv.last_name}
                              </div>
                              <div className={s.subtle}>{inv.email}</div>
                            </div>
                            <span className={x.rowArrow} aria-hidden>
                              <ArrowUpRightIcon />
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className={s.teamCell}>{inv.firm || <span className={s.muted}>—</span>}</div>
                          {inv.title && <div className={s.subtle}>{inv.title}</div>}
                        </td>
                        <td>
                          <SectorTagsList tags={inv.sector_tags} max={3} />
                        </td>
                        <td>
                          {inv.stage_focus !== 'unknown' ? (
                            STAGE_FOCUS_LABEL[inv.stage_focus]
                          ) : (
                            <span className={s.muted}>—</span>
                          )}
                        </td>
                        <td>{INVESTOR_TYPE_LABEL[inv.investor_type] ?? <span className={s.muted}>—</span>}</td>
                        <td>
                          <div className={s.relCell}>
                            <span className={clsx(s.relPill, rel.cls)}>{rel.label}</span>
                            {inv.relationship === 'engaged' && inv.engagement_tier !== 'T4_cold' && (
                              <EngagementTierBadge tier={inv.engagement_tier} compact />
                            )}
                          </div>
                        </td>
                        <td>
                          <div className={x.bestPathCell}>
                            {/* People-first: the warmest connector node (investor node
                                dropped since the row is them) + the proximity badge. */}
                            <div className={x.pathRow}>
                              {hasProximity ? (
                                <ProximityCodeBadge
                                  code={inv.best_proximity_code}
                                  cold={inv.has_path === false}
                                  confidence={bestPath?.caliber_confidence}
                                />
                              ) : (
                                <span className={s.muted}>—</span>
                              )}
                              {bestPath && pathChainNodes(bestPath, inv).length > 0 && (
                                <PeopleChain nodes={pathChainNodes(bestPath, inv)} />
                              )}
                            </div>
                            {inv.paths.length > 0 && (
                              <button
                                type="button"
                                className={s.expandBtn}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDrawerId(inv.investor_id);
                                }}
                              >
                                {inv.paths.length > 1 ? `View all (${inv.paths.length})` : 'View path'}
                              </button>
                            )}
                          </div>
                        </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile: the table doesn't fit — render each investor as a tappable card. */}
          <div className={x.mobileCards}>
            {visible.map((inv) => {
              const rel = relationshipMeta(inv.relationship);
              const bestPath = inv.paths[0];
              const hasProximity = !!inv.best_proximity_code || inv.has_path === false;
              return (
                <div
                  key={inv.investor_id}
                  className={x.mCard}
                  role="button"
                  tabIndex={0}
                  onClick={() => setDrawerId(inv.investor_id)}
                >
                  <div className={x.mCardHead}>
                    <div>
                      <div className={s.nameCell}>
                        {inv.first_name} {inv.last_name}
                      </div>
                      <div className={s.subtle}>{inv.email}</div>
                    </div>
                    {hasProximity && (
                      <ProximityCodeBadge
                        code={inv.best_proximity_code}
                        cold={inv.has_path === false}
                        confidence={bestPath?.caliber_confidence}
                      />
                    )}
                  </div>
                  <div className={x.mCardMeta}>
                    <span className={clsx(s.relPill, rel.cls)}>{rel.label}</span>
                    <span className={x.mCardFirm}>{inv.firm || '—'}</span>
                  </div>
                  <SectorTagsList tags={inv.sector_tags} max={4} />
                  {bestPath && pathChainNodes(bestPath, inv).length > 0 && <PeopleChain nodes={pathChainNodes(bestPath, inv)} />}
                </div>
              );
            })}
          </div>

          {visible.length === 0 && (
            <div className={s.empty}>
              No members match the current filters — adjust the relationship chips
              {connectorLabel ? ' or clear the connector lens' : ''}.
            </div>
          )}
        </section>

        <GlossaryModal open={glossaryOpen} onClose={() => setGlossaryOpen(false)} />
        <Drawer
          isOpen={crosswalkOpen}
          onClose={() => setCrosswalkOpen(false)}
          {...(isMobile ? { fullScreen: true } : { width: 560 })}
        >
          <div style={{ padding: 24, fontFamily: 'Inter, sans-serif' }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 8px' }}>Crosswalk review</h2>
            <p style={{ fontSize: 13, color: '#455468', lineHeight: 1.55 }}>
              (Prototype stub) In production this is the entity-resolution queue where a curator confirms or rejects
              fuzzy name/firm matches the pathfinder couldn’t auto-link. Left as-is for this redesign.
            </p>
          </div>
        </Drawer>
      </div>

      {/* Tapping a row opens the detail drawer — same layout as the original */}
      <InvestorDrawerMock
        investor={drawerInvestor}
        onClose={() => setDrawerId(null)}
        fullScreen={isMobile}
        lists={liveLists}
        onAddToList={(listId) => drawerId && addToList([drawerId], listId)}
        onRemoveFromList={(listId) => drawerId && removeFromList(drawerId, listId)}
      />
    </div>
  );
}

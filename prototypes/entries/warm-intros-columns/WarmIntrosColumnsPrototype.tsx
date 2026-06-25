'use client';

import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import clsx from 'clsx';
import { Switch } from '@base-ui-components/react/switch';
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
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { ListPicker } from '@/components/page/investors/WarmIntrosWorkspace/ListPicker';
import { Tag } from '@/components/ui/Tag/Tag';
import { GlossaryModal } from '@/components/page/investors/WarmIntrosWorkspace/GlossaryModal';
import { Drawer } from '@/components/common/Drawer/Drawer';
import { Tabs } from '@/components/common/Tabs/Tabs';
// Reuse the production workspace styling so the prototype tracks production 1:1.
import s from '@/components/page/investors/WarmIntrosWorkspace/WarmIntrosWorkspace.module.scss';
import {
  DEFAULT_LIST_ID,
  MOCK_INVESTOR_LISTS,
  MOCK_LISTS,
  MOCK_MEMBERS,
  directConnector,
  firstNodeConnectors,
  founderCoverage,
  hopConnectors,
  matchesFirstNode,
  pathChainNodes,
  resolveRoute,
  type ConnCell,
  type MockInvestor,
} from './mocks';
import { PeopleChain, OrgGlyph } from './PeopleChain';
import { ProtocolLabsMark } from './ProtocolLabsMark';
import { ArrowUpRightIcon } from './ArrowUpRightIcon';
import { InvestorDrawerMock, InLabOsPill, TeamInline } from './InvestorDrawerMock';
import { AddToListButton } from './AddToListButton';
import x from './WarmIntrosImprovements.module.scss';

// One connector rendered as a small badge in the Direct / 1-hop column: PL mark
// (teammate) or avatar (founder) + name, with the path's proximity below. The
// badge is clickable to filter the spine by that connector.
function ConnectorCell({
  cell,
  pl,
  active,
  onClick,
}: {
  cell: ConnCell | null;
  pl?: boolean;
  active?: boolean;
  onClick: () => void;
}) {
  if (!cell) return <span className={s.muted}>—</span>;
  return (
    <button
      type="button"
      className={clsx(x.connColBadge, active && x.connColBadgeActive)}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={`Filter to investors via ${cell.person.name}`}
    >
      {pl ? (
        <span className={x.connColPlMark} aria-hidden>
          <ProtocolLabsMark />
        </span>
      ) : (
        <img className={x.connColAvatar} src={getDefaultAvatar(cell.person.name)} alt="" width={16} height={16} />
      )}
      <span className={x.connColName}>{cell.person.name}</span>
    </button>
  );
}

const REL_FILTERS: { tier: WarmIntroTier; label: string }[] = [
  { tier: 'co_invested', label: 'Co-invested' },
  { tier: 'engaged', label: 'Engaged' },
  { tier: 'cold_match', label: 'Cold' },
];

const VISUAL_TABS = [
  { value: 'all', label: 'All Investors' },
  { value: 'warm-intros', label: 'Warm Intros' },
];

// Relationship keeps its color coding — it's a meaningful signal.
function relationshipMeta(rel: WarmIntroTier): { label: string; cls: string } {
  if (rel === 'co_invested') return { label: 'Co-invested', cls: s.relCo };
  if (rel === 'engaged') return { label: 'Engaged', cls: s.relEngaged };
  return { label: 'Cold', cls: s.relCold };
}

// Team cell: firm + role, then the investor's other teams via the SAME "+N more"
// expander used in the drawer (TeamInline links + teamMoreBtn), placed after the role.
function TeamCell({ investor }: { investor: MockInvestor }) {
  const teams = investor.teams ?? [];
  const [expanded, setExpanded] = useState(false);
  const extra = teams.length - 1;
  return (
    <>
      <div className={s.teamCell}>{investor.firm || <span className={s.muted}>—</span>}</div>
      {investor.title && <div className={s.subtle}>{investor.title}</div>}
      {extra > 0 && (
        <div className={x.teamAffil}>
          {expanded &&
            teams.slice(1).map((t, i) => (
              <Fragment key={t.teamUid ?? t.name}>
                {i > 0 && (
                  <span className={x.teamDivider} aria-hidden>
                    ·
                  </span>
                )}
                <TeamInline team={t} />
              </Fragment>
            ))}
          <button
            type="button"
            className={x.teamMoreBtn}
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

// Neutral, unified chip for low-priority meta (industry/sector, source).
export function MetaChips({ items, max = 3 }: { items: readonly string[]; max?: number }) {
  if (!items || items.length === 0) return <span className={s.muted}>—</span>;
  const visible = items.slice(0, max);
  const overflow = items.length - visible.length;
  return (
    <span className={x.metaChips}>
      {visible.map((t) => (
        <span key={t} className={x.metaChip}>
          {t}
        </span>
      ))}
      {overflow > 0 && (
        <span className={x.metaChip} title={items.slice(max).join(', ')}>
          +{overflow}
        </span>
      )}
    </span>
  );
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

// "Path via" — ONE control answering "who makes this intro?". In our model there
// are two connector kinds: a PL teammate (a DIRECT tie, no broker) or a portfolio
// founder (the broker). There's no separate co-investor kind — those intros come
// from a PL teammate, so they live on the teammate side.
//
// A selection is a set of tokens; an investor matches if ANY token matches (OR):
//   'direct'    — reachable with no broker in between (a teammate's direct tie)
//   'founder'   — reachable through ANY portfolio founder
//   't:<name>'  — through that specific teammate
//   'f:<uid>'   — through that specific founder
function matchesToken(inv: MockInvestor, token: string): boolean {
  if (token === 'direct') return inv.paths.some((p) => !resolveRoute(p).mediator);
  if (token === 'founder') return inv.paths.some((p) => p.connector_type === 'F');
  if (token.startsWith('t:')) return matchesFirstNode(inv, token.slice(2));
  if (token.startsWith('f:')) {
    const uid = token.slice(2);
    return inv.paths.some((p) => p.connector_type === 'F' && p.contact?.memberUid === uid);
  }
  return true;
}
function matchesPathVia(inv: MockInvestor, selected: Set<string>): boolean {
  if (selected.size === 0) return true;
  return [...selected].some((t) => matchesToken(inv, t));
}

// A uniform "normal filter" dropdown: a button showing the filter name (turning a
// calm blue when active) + an optional count badge, opening a checklist that
// filters live. The body is a render-prop so each filter supplies its own rows.
function FilterDropdown({
  label,
  count = 0,
  active,
  searchable,
  placeholder,
  children,
}: {
  label: string;
  count?: number;
  active?: boolean;
  searchable?: boolean;
  placeholder?: string;
  children: (ctx: { close: () => void; query: string }) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const isActive = active ?? count > 0;
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);
  return (
    <div className={x.fdWrap} ref={ref}>
      <button
        type="button"
        className={clsx(x.fdTrigger, (open || isActive) && x.fdTriggerActive)}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span>{label}</span>
        {count > 0 && <span className={x.fdCount}>{count}</span>}
        <svg className={clsx(x.fdCaret, open && x.fdCaretOpen)} viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className={x.fdMenu}>
          {searchable && (
            <input
              className={x.fdSearch}
              placeholder={placeholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          )}
          <div className={x.fdList}>{children({ close: () => setOpen(false), query })}</div>
        </div>
      )}
    </div>
  );
}

// One option row inside a FilterDropdown menu.
function FdRow({ label, count, selected, onClick }: { label: string; count?: number; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" className={clsx(x.fdRow, selected && x.fdRowOn)} onClick={onClick}>
      <input type="checkbox" className={x.fdCheckbox} checked={selected} readOnly tabIndex={-1} aria-hidden />
      <span className={x.fdRowLabel}>{label}</span>
      {count != null && <span className={x.fdRowCount}>{count}</span>}
    </button>
  );
}

export default function WarmIntrosColumnsPrototype() {
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

  // Live filters — no Apply step; every selection filters instantly. Empty = off.
  const [stage, setStage] = useState('');
  const [check, setCheck] = useState('');
  const [sectors, setSectors] = useState<SectorTag[]>([]);
  // Relationship is a quick pill toggle (all shown by default; toggle one off to hide).
  const [relFilter, setRelFilter] = useState<Record<WarmIntroTier, boolean>>({
    co_invested: true,
    engaged: true,
    cold_match: true,
  });
  // Plain keyword search over name / firm / email (no connector lens).
  const [query, setQuery] = useState('');
  // Path via — PL member + founder connector tokens (see matchesToken). Empty = off.
  const [pathSel, setPathSel] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [crosswalkOpen, setCrosswalkOpen] = useState(false);

  // Toggle a connector token in/out of the Path via selection (also driven by the
  // table's Direct-column badge, which stays in sync with the PL member filter).
  const togglePathToken = (token: string) =>
    setPathSel((prev) => {
      const next = new Set(prev);
      next.has(token) ? next.delete(token) : next.add(token);
      return next;
    });
  const toggleSector = (sec: SectorTag) =>
    setSectors((prev) => (prev.includes(sec) ? prev.filter((x) => x !== sec) : [...prev, sec]));

  const switchList = (list: InvestorList) => {
    setCurrentListId(list.id);
    setDrawerId(null);
    setSelectedIds(new Set());
    setPathSel(new Set());
  };

  const clearAll = () => {
    setStage('');
    setCheck('');
    setSectors([]);
    setQuery('');
    setRelFilter({ co_invested: true, engaged: true, cold_match: true });
    setPathSel(new Set());
  };

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
    const q = query.trim().toLowerCase();
    if (q) {
      rows = rows.filter((m) =>
        `${m.first_name} ${m.last_name} ${m.firm} ${m.email}`.toLowerCase().includes(q),
      );
    }
    if (stage) rows = rows.filter((m) => m.stage_focus === (stage as StageFocus));
    if (check) rows = rows.filter((m) => m.check_size_range === (check as CheckSizeRange));
    if (sectors.length) rows = rows.filter((m) => m.sector_tags.some((t) => sectors.includes(t)));
    rows = rows.filter((m) => relFilter[m.relationship]);
    if (pathSel.size) rows = rows.filter((m) => matchesPathVia(m, pathSel));
    return rows
      .slice()
      .sort((a, b) => proximityRank(a) - proximityRank(b) || a.last_name.localeCompare(b.last_name));
  }, [onList, query, stage, check, sectors, relFilter, pathSel]);

  // Connector pivots — teammates (PL-side, direct) and founders (the broker),
  // each derived from the live membership of the list.
  const teamChips = useMemo(() => firstNodeConnectors(members, currentListId), [members, currentListId]);
  const founderChips = useMemo(() => founderCoverage(members, currentListId), [members, currentListId]);

  const totalOnList = members.filter((m) => m.list_ids.includes(currentListId)).length;
  const currentListName = MOCK_LISTS.find((l) => l.id === currentListId)?.name ?? 'list';
  const drawerInvestor = members.find((m) => m.investor_id === drawerId) ?? null;

  // Path via tokens split by group, for the two dropdowns' count badges + chips.
  // 'direct' is its own toggle in the relationship row — not part of PL member.
  const plMemberCount = [...pathSel].filter((t) => t.startsWith('t:')).length;
  const founderCount = [...pathSel].filter((t) => t === 'founder' || t.startsWith('f:')).length;
  const tokenLabel = (t: string): string =>
    t === 'direct'
      ? 'Any teammate'
      : t === 'founder'
        ? 'Any founder'
        : t.startsWith('t:')
          ? t.slice(2)
          : (founderChips.find((f) => `f:${f.memberUid}` === t)?.name ?? 'Founder');

  // Active-filter chips shown below the bar — each removes just its own filter.
  const activeChips: { key: string; name: string; value: string; remove: () => void }[] = [];
  if (stage) activeChips.push({ key: 'stage', name: 'Stage', value: STAGE_FOCUS_LABEL[stage as StageFocus], remove: () => setStage('') });
  if (check) activeChips.push({ key: 'check', name: 'Check', value: check, remove: () => setCheck('') });
  sectors.forEach((sec) =>
    activeChips.push({ key: `sec:${sec}`, name: INDUSTRY_SECTOR_LABEL, value: SECTOR_TAG_LABEL[sec], remove: () => toggleSector(sec) }),
  );
  [...pathSel]
    .filter((t) => t !== 'direct') // 'direct' shows as a toggle, not a chip
    .forEach((t) =>
      activeChips.push({
        key: `pv:${t}`,
        name: t === 'founder' || t.startsWith('f:') ? 'Founder' : 'PL member',
        value: tokenLabel(t),
        remove: () => togglePathToken(t),
      }),
    );

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
        <section className={clsx(s.builder, x.builderFill)}>
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

          {/* ── Filter bar: list · search · uniform live dropdown filters ──────── */}
          <div className={clsx(x.filterBar, x.builderRowResp)}>
            <div className={x.listField}>
              <span className={x.inlineLabel}>List</span>
              <div className={x.listPickerWrap}>
                <ListPicker lists={liveLists} selectedId={currentListId} onSelect={switchList} />
              </div>
            </div>

            <div className={x.searchField}>
              <svg className={x.searchIcon} viewBox="0 0 16 16" fill="none" aria-hidden>
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input
                className={x.searchInput}
                placeholder="Search investor or fund"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <FilterDropdown label="PL member" count={plMemberCount} searchable placeholder="Search teammates…">
              {({ query: q0 }) => {
                const q = q0.trim().toLowerCase();
                return (
                  <>
                    {teamChips
                      .filter((c) => !q || c.name.toLowerCase().includes(q))
                      .map((c) => (
                        <FdRow
                          key={c.name}
                          label={c.name}
                          count={c.count}
                          selected={pathSel.has(`t:${c.name}`)}
                          onClick={() => togglePathToken(`t:${c.name}`)}
                        />
                      ))}
                  </>
                );
              }}
            </FilterDropdown>

            <FilterDropdown label="Founder" count={founderCount} searchable placeholder="Search founders…">
              {({ query: q0 }) => {
                const q = q0.trim().toLowerCase();
                return (
                  <>
                    {(!q || 'any founder'.includes(q)) && (
                      <FdRow label="Any founder" selected={pathSel.has('founder')} onClick={() => togglePathToken('founder')} />
                    )}
                    {founderChips
                      .filter((f) => !q || f.name.toLowerCase().includes(q))
                      .map((f) => (
                        <FdRow
                          key={f.memberUid}
                          label={f.name}
                          count={f.investors.length}
                          selected={pathSel.has(`f:${f.memberUid}`)}
                          onClick={() => togglePathToken(`f:${f.memberUid}`)}
                        />
                      ))}
                  </>
                );
              }}
            </FilterDropdown>

            <FilterDropdown label={stage ? STAGE_FOCUS_LABEL[stage as StageFocus] : 'Stage'} active={!!stage}>
              {({ close }) => (
                <>
                  <FdRow label="Any stage" selected={!stage} onClick={() => { setStage(''); close(); }} />
                  {STAGE_FOCUSES.filter((st) => st !== 'unknown').map((st) => (
                    <FdRow
                      key={st}
                      label={STAGE_FOCUS_LABEL[st]}
                      selected={stage === st}
                      onClick={() => { setStage(st); close(); }}
                    />
                  ))}
                </>
              )}
            </FilterDropdown>

            <FilterDropdown label={check || 'Check size'} active={!!check}>
              {({ close }) => (
                <>
                  <FdRow label="Any check size" selected={!check} onClick={() => { setCheck(''); close(); }} />
                  {CHECK_SIZE_RANGES.filter((c) => c !== 'unknown').map((c) => (
                    <FdRow key={c} label={c} selected={check === c} onClick={() => { setCheck(c); close(); }} />
                  ))}
                </>
              )}
            </FilterDropdown>

            <FilterDropdown label={INDUSTRY_SECTOR_LABEL} count={sectors.length}>
              {() =>
                SECTOR_TAGS.map((sec) => (
                  <FdRow
                    key={sec}
                    label={SECTOR_TAG_LABEL[sec]}
                    selected={sectors.includes(sec)}
                    onClick={() => toggleSector(sec)}
                  />
                ))
              }
            </FilterDropdown>
          </div>

          {/* Active filters as removable chips — live, one per applied value. */}
          {activeChips.length > 0 && (
            <div className={x.chipRow}>
              {activeChips.map((c) => (
                <button key={c.key} type="button" className={x.activeChip} onClick={c.remove}>
                  <span className={x.activeChipName}>{c.name}:</span> <strong>{c.value}</strong>
                  <span className={x.activeChipX} aria-hidden>
                    &times;
                  </span>
                </button>
              ))}
              <button type="button" className={x.clearAllBtn} onClick={clearAll}>
                Clear All
              </button>
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
              {/* Binary-lens zone: Direct-only DS toggle, then the relationship pills. */}
              <div className={s.relChips}>
                <label className={x.directToggle}>
                  Direct only
                  <Switch.Root
                    className={x.directSwitch}
                    checked={pathSel.has('direct')}
                    onCheckedChange={() => togglePathToken('direct')}
                  >
                    <Switch.Thumb className={x.directThumb} />
                  </Switch.Root>
                </label>
                <span className={x.filterDivider} aria-hidden />
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
                  <th className={x.colInvestor}>Investor</th>
                  <th className={x.colTeam}>Team</th>
                  <th>{INDUSTRY_SECTOR_LABEL}</th>
                  <th>Stage</th>
                  <th>Type</th>
                  <th>Relationship</th>
                  <th>Proximity</th>
                  <th>Direct</th>
                  <th>1 hop</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((inv) => {
                  const rel = relationshipMeta(inv.relationship);
                  const direct = directConnector(inv);
                  const hops = hopConnectors(inv);
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
                        <td className={x.colInvestor}>
                          <div className={x.nameCellRow}>
                            <div className={x.nameCellMain}>
                              <div className={x.nameWithBadge}>
                                <span className={s.nameCell}>
                                  {inv.first_name} {inv.last_name}
                                </span>
                                <InLabOsPill profile={inv.lab_os_profile ?? null} />
                              </div>
                              <div className={clsx(s.subtle, x.investorEmail)}>{inv.email}</div>
                            </div>
                            <span className={x.rowArrow} aria-hidden>
                              <ArrowUpRightIcon />
                            </span>
                          </div>
                        </td>
                        <td>
                          <TeamCell investor={inv} />
                        </td>
                        <td>
                          <MetaChips items={inv.sector_tags} max={3} />
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
                          {inv.best_proximity_code || inv.has_path === false ? (
                            <ProximityCodeBadge code={inv.best_proximity_code} cold={inv.has_path === false} />
                          ) : (
                            <span className={s.muted}>—</span>
                          )}
                        </td>
                        <td>
                          <ConnectorCell
                            cell={directConnector(inv)}
                            pl
                            active={false}
                            onClick={() => direct && togglePathToken(`t:${direct.person.name}`)}
                          />
                        </td>
                        <td>
                          {hops.length === 0 ? (
                            <span className={s.muted}>—</span>
                          ) : (
                            <div className={x.hopBadges}>
                              {hops.map((h) => {
                                const isOrg = h.kind === 'org';
                                // Founders (network persons) pivot the Founder filter; other
                                // brokers (orgs, external co-investors) are display-only now.
                                const memberUid = h.kind === 'person' ? h.memberUid : undefined;
                                const token = memberUid ? `f:${memberUid}` : null;
                                // Clicking filters the rows; the badge itself doesn't take an active state.
                                const cls = clsx(x.connColBadge, isOrg && x.connColBadgeOrg);
                                const inner = (
                                  <>
                                    {isOrg ? (
                                      <span className={x.connColOrgGlyph} aria-hidden>
                                        <OrgGlyph />
                                      </span>
                                    ) : (
                                      <img className={x.connColAvatar} src={getDefaultAvatar(h.name)} alt="" width={16} height={16} />
                                    )}
                                    <span className={x.connColName}>{h.name}</span>
                                    {isOrg && (
                                      <span className={x.connColUnknown} aria-hidden title="Person unknown">
                                        ?
                                      </span>
                                    )}
                                  </>
                                );
                                return token ? (
                                  <button
                                    key={memberUid ?? h.name}
                                    type="button"
                                    className={cls}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      togglePathToken(token);
                                    }}
                                    title={`Filter to investors via ${h.name}`}
                                  >
                                    {inner}
                                  </button>
                                ) : (
                                  <span
                                    key={isOrg ? `org:${h.name}` : h.name}
                                    className={cls}
                                    title={isOrg ? `${h.name} can route the intro — ask who` : h.name}
                                  >
                                    {inner}
                                  </span>
                                );
                              })}
                            </div>
                          )}
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
                  <MetaChips items={inv.sector_tags} max={4} />
                  {bestPath && pathChainNodes(bestPath, inv).length > 0 && <PeopleChain nodes={pathChainNodes(bestPath, inv)} />}
                </div>
              );
            })}
          </div>

          {visible.length === 0 && (
            <div className={s.empty}>No members match the current filters — adjust or clear them.</div>
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

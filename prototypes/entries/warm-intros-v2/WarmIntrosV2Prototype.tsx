'use client';

/**
 * Warm Intros v2 — mocked clone of the production workspace.
 *
 * Reused from production (imported, not copied):
 *   WarmIntrosV2GlossaryDrawer, ScorePercentPill, PathProfileChip, HopRoleBadge,
 *   ProximityCodeBadge, SectorTagsList, FilterSelect, Drawer, Modal, CopyButton,
 *   exportWarmIntrosV2Csv, parseWarmPathHopChain, masterProfileDisplay.util,
 *   and every WarmIntrosV2Workspace `.module.scss` — so this tracks production 1:1.
 *
 * Synced with dev 268306185 (co-investment filters): two-hop bridge paths, hop
 * role badges, Directory-member dots and the co-investments blocks.
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
 *   - dev's `PL member` select + its three path-kind chips collapse into one
 *     grouped `PathViaSelect` — they are one axis asked at two resolutions
 *   - `Backed PL/FIL` stays its own toggle (it describes the investor, not the path)
 *   - every facet count is computed against the other live filters, so an option
 *     reading "(3)" returns three rows
 *   - active-filter pills + Clear all, and an empty state that can recover
 *   - Export CSV moves onto the results line, out of the row of filters
 *
 * See COMPONENTS.md for the full map of both the dev sync and these changes.
 *
 * Deliberate simplifications, all data-layer only:
 *   - filters live in component state instead of the URL (no nuqs in prototypes)
 *   - the 14 mocked rows fit on one page, so infinite scroll / pagination is dropped
 *   - PostHog analytics calls are dropped
 */

import { useCallback, useMemo, useState } from 'react';
import clsx from 'clsx';
// The DS search field, plus the id and label it ships without — see SearchField.tsx.
import { SearchField } from './SearchField';
import { Tabs } from '@/components/common/Tabs';
// Production's `FilterSelect`, verbatim apart from the design system's chevron in
// place of react-select's built-in caret — see FilterSelectThin.tsx.
import { FilterSelectThin } from './FilterSelectThin';
import type { Option } from '@/components/form/FormSelect/types';
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
// Active-filter pills + Clear all already exist in Warm Intros **v1** — same
// feature family, same bar. Imported rather than re-styled.
import v1 from '@/components/page/investors/WarmIntrosWorkspace/WarmIntrosWorkspace.module.scss';
import {
  ALL_LISTS,
  ALL_LISTS_LABEL,
  ALL_LISTS_MEMBER_COUNT,
  MOCK_INVESTOR_LISTS,
  filterPaths,
  pathViaFacets,
  plBackerCount,
  sectorFacets,
  type PathFilters,
  type PathVia,
  type TargetSetScope,
} from './mocks';
import { PathViaSelect, describePathVia } from './PathViaSelect';
import { CheckSelect } from './CheckSelect';
import f from './FilterBar.module.scss';
import shell from './PageShell.module.scss';
import { InvestorDrawerMock } from './InvestorDrawerMock';
import { WarmIntrosV2TableMock } from './WarmIntrosV2TableMock';
import { WarmIntrosV2WideTableMock } from './WarmIntrosV2WideTableMock';
import { MasterProfileModalMock } from './MasterProfileModalMock';

/**
 * Two answers to "the table has too many columns", kept side by side rather than
 * argued about: `compact` deletes columns, `columns` redistributes into them.
 */
type TableVariant = 'compact' | 'columns';

/**
 * Hidden, not deleted — same convention production's `PathActions` uses for its
 * `SHOW_CAN_REFER` flag. `WarmIntrosV2WideTableMock` and `WideColumns.module.scss`
 * stay wired up behind this, so flipping it back is one line rather than a rebuild.
 */
const SHOW_COLUMNS_VARIANT = false;

export default function WarmIntrosV2Prototype() {
  const [variant, setVariant] = useState<TableVariant>('compact');
  // Opens unscoped: "All investor lists" is the default, the two real lists narrow it.
  const [targetSet, setTargetSet] = useState<TargetSetScope>(ALL_LISTS);
  const [sector, setSector] = useState<string[]>([]);
  // Already debounced when it arrives — `SearchInput` holds the keystrokes and
  // only calls back after 700ms, so this state is the settled value.
  const [searchInput, setSearchInput] = useState('');

  // One value for the whole mediation axis — a shape, a PL member, or a bridge
  // person. Nothing to silently clear, because there is nothing beside it.
  const [pathVia, setPathVia] = useState<PathVia[]>([]);
  // A different question (about the investor, not the path), so it stays its own
  // control rather than joining the axis as a fourth pretend-shape.
  const [plBacker, setPlBacker] = useState(false);

  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedProfileUid, setSelectedProfileUid] = useState<string | null>(null);
  const [drawerRow, setDrawerRow] = useState<WarmIntrosV2PathListItem | null>(null);

  const filters = useMemo<PathFilters>(
    () => ({
      targetSet,
      search: searchInput.trim() || undefined,
      sector,
      pathVia,
      plBacker: plBacker || undefined,
    }),
    [targetSet, searchInput, sector, pathVia, plBacker],
  );

  const paths = useMemo(() => filterPaths(filters), [filters]);
  const total = paths.length;

  // Every facet is counted against the *other* live filters, so an option that
  // reads "(3)" returns three rows when you pick it.
  const viaFacets = useMemo(() => pathViaFacets(filters), [filters]);
  const sectors = useMemo(() => sectorFacets(filters), [filters]);
  const plBackerAvailable = useMemo(() => plBackerCount(filters), [filters]);

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

  const sectorOptions = useMemo<Option[]>(
    () => sectors.map((sec) => ({ value: sec.value, label: `${sec.value} (${sec.count})` })),
    [sectors],
  );

  const onPickTargetSet = useCallback((opt: Option | null) => {
    setTargetSet((opt?.value as TargetSetScope | undefined) ?? ALL_LISTS);
    setPathVia([]);
    setSector([]);
  }, []);

  const clearAll = useCallback(() => {
    setPathVia([]);
    setSector([]);
    setPlBacker(false);
    setSearchInput('');
  }, []);

  /**
   * What is currently on, and how to switch each thing off individually. The
   * scope picker is deliberately absent — it always has a value, so a pill for
   * it would never be removable.
   */
  const activePills = useMemo(() => {
    const pills: Array<{ key: string; label: string; value: string; onRemove: () => void }> = [];

    // One pill per selection, not one pill listing them all: each has to be
    // removable on its own, and "Path via: Direct, Mara, Priya" with a single ×
    // would only offer to drop the lot.
    for (const via of pathVia) {
      pills.push({
        key: `pathVia:${via.type}:${via.value}`,
        label: 'Path via',
        // No count on the pill: it belongs on the option you are choosing, and
        // the results line already says how many you got.
        value: describePathVia(via),
        onRemove: () => setPathVia((current) => current.filter((v) => !(v.type === via.type && v.value === via.value))),
      });
    }
    for (const sec of sector) {
      pills.push({
        key: `sector:${sec}`,
        label: 'Sector',
        value: sec,
        onRemove: () => setSector((current) => current.filter((s) => s !== sec)),
      });
    }
    if (plBacker) {
      pills.push({
        key: 'plBacker',
        label: 'Backed',
        value: 'PL / Filecoin',
        onRemove: () => setPlBacker(false),
      });
    }
    if (searchInput.trim()) {
      pills.push({
        key: 'search',
        label: 'Search',
        value: searchInput.trim(),
        onRemove: () => setSearchInput(''),
      });
    }
    return pills;
  }, [pathVia, sector, plBacker, searchInput]);

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
              <FilterSelectThin
                options={targetSetOptions}
                value={targetSetValue}
                placeholder="Investors list"
                aria-label="Investors list"
                onChange={onPickTargetSet}
              />
            </div>

            <div className={clsx(s.filterBarItem, s.filterBarSearch)}>
              {/* The design system's own search field
                  (`components/common/filters/SearchInput`), in place of the
                  wrapper + inline magnifier svg + hand-rolled × button that
                  production assembles here from `.searchWrap` / `.searchIcon` /
                  `.searchInput` / `.searchClear`.

                  It brings the DS treatment: icon on the trailing edge that hides
                  once you type, `CloseIcon` to clear, and a hover/focus ring
                  (`#5e718d` border + `0 0 0 4px rgba(27,56,96,0.12)`) that is
                  character-for-character the one `filterSelectStyles.control`
                  gives the selects beside it — so the field and the selects finally
                  respond identically. No size override needed either:
                  `DebouncedInput`'s root is already `height: 40px` / radius 8px,
                  the selects' own geometry.

                  Debouncing comes with it (`DebouncedInput`, 700ms), which is why
                  the local `useDebounce` is gone. The trade: 700ms instead of the
                  300ms this had, and `DebouncedInput` doesn't forward an
                  `aria-label`, so the field is labelled by its placeholder alone —
                  worth raising with dev rather than patching around here. */}
              <SearchField
                value={searchInput}
                onChange={setSearchInput}
                // The filter has always matched the firm too; the placeholder
                // just never said so.
                placeholder="Search name, email or firm…"
                label="Search name, email or firm"
              />
            </div>

            {/* The whole mediation axis — shape or person — in one control. */}
            <div className={s.filterBarItem} style={{ minWidth: 220 }}>
              <PathViaSelect facets={viaFacets} value={pathVia} onChange={setPathVia} />
            </div>

            <div className={s.filterBarItem} style={{ minWidth: 160 }}>
              <CheckSelect
                options={sectorOptions}
                value={sector}
                placeholder="Industry / Sector"
                aria-label="Industry / Sector"
                onChange={setSector}
              />
            </div>

            {/* Not part of the axis: this one is about the investor, not the
                route to them. Disabled rather than hidden when nothing in the
                current set qualifies — a control that vanishes is worse. */}
            <div className={clsx(s.filterBarItem, s.quickFilters)}>
              <button
                type="button"
                className={clsx(s.quickChip, f.axisToggle, plBacker && s.quickChipActive)}
                aria-pressed={plBacker}
                disabled={!plBacker && plBackerAvailable === 0}
                title="Investors whose firm has already backed Protocol Labs or Filecoin"
                onClick={() => setPlBacker((v) => !v)}
              >
                Backed PL/FIL ({plBackerAvailable})
              </button>
            </div>
          </div>

          {activePills.length > 0 && (
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
          )}
        </section>

        {total === 0 && (
          <div className={clsx(s.state, f.emptyState)}>
            <span>No paths match these filters.</span>
            <button type="button" className={v1.clearAll} onClick={clearAll}>
              Clear all
            </button>
          </div>
        )}

        {total > 0 && (
          <div className={s.listWrap}>
            <div className={clsx(s.meta, f.metaRow)}>
              <span>
                Showing {paths.length} paths · {scopeLabel}
              </span>
              {/* Changes how the same rows are drawn, so it sits with the count
                  rather than in the row of controls that change which rows. */}
              {SHOW_COLUMNS_VARIANT ? (
                <Tabs
                  variant="pill"
                  value={variant}
                  onValueChange={(v) => setVariant(v as TableVariant)}
                  tabs={[
                    { value: 'compact', label: 'Compact' },
                    { value: 'columns', label: 'Columns' },
                  ]}
                  classes={{ root: f.viewTabs, tab: f.viewTab, label: f.viewTabLabel }}
                />
              ) : null}
              {/* Export is an action on the result set, so it belongs with the
                  result count — not in a row of things that change it. */}
              <button
                type="button"
                className={clsx(s.exportBtn, f.exportPrimary, f.metaRowSpacer)}
                onClick={onExportCsv}
                disabled={exporting}
              >
                {exporting ? 'Exporting…' : 'Export CSV'}
              </button>
            </div>
            {/* Same rows, same handlers — only the column set differs, so the two
                stay comparable on identical data. */}
            {!SHOW_COLUMNS_VARIANT || variant === 'compact' ? (
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
            ) : (
              <WarmIntrosV2WideTableMock
                rows={paths}
                onOpenMasterProfile={onOpenMasterProfile}
                onOpenProfileUid={onOpenProfileUid}
                onViewAllPaths={onViewAllPaths}
                onRowClick={onRowClick}
                showListName={targetSet === ALL_LISTS}
              />
            )}
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

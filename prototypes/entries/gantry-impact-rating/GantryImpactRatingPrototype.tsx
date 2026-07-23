'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties, SVGProps } from 'react';
import { clsx } from 'clsx';

import DashboardPagesLayout from '@/components/core/dashboard-pages-layout/DashboardPagesLayout';
import { Button } from '@/components/common/Button';
import { FiltersSidePanel } from '@/components/common/filters/FiltersSidePanel';
import { StageBadge } from '@/components/page/gantry/shared/StageBadge';
import { IdeasSubmitButton } from '@/components/page/gantry/ideas/IdeasSubmitButton';
import { MobileDrawer } from '@/components/ui/MobileDrawer/MobileDrawer';
import FilterCount from '@/components/ui/filter-count';
import { useIsNarrow } from '@/hooks/useIsNarrow';
import { useRoadmapMobileNav } from '@/components/page/gantry/roadmap/hooks/useRoadmapMobileNav';
import { PlusIcon } from '@/components/icons';
import { DEFAULT_ROADMAP_VISIBLE_COLUMNS, GANTRY_STAGE_LABELS } from '@/services/gantry/constants';
import type { RoadmapColumnStage } from '@/components/page/gantry/roadmap/RoadmapFilters';

// Production roadmap styles + the sibling prototype's faithful filters copy — reused so the chrome
// matches production 1:1.
import roadmap from '@/components/page/gantry/roadmap/Roadmap.module.scss';
import filterStyles from '@/components/page/gantry/shared/GantryFilters.module.scss';
import { PrototypeRoadmapFilters } from '../gantry-saved-draft-item/PrototypeRoadmapFilters';

import ideas from '@/components/page/gantry/ideas/Ideas.module.scss';
import type { MockRoadmapItem } from './mocks';
import { mockImpactObjectives } from './mocks';
import { RoadmapImpactCard } from './RoadmapImpactCard';
import { BoostImpactPopover } from './shared/BoostImpactPopover';
import type { GantryDraft } from './shared/CreateItemModal';
import { CreateItemModal } from './shared/CreateItemModal';
import { ItemDrawer } from './shared/ItemDrawer';
import { useBoardState } from './shared/useBoardState';
import s from './GantryImpactRatingPrototype.module.scss';

type Variant = 'overall' | 'per-objective';
type Viewer = 'member' | 'curator';
import type { GoalMode } from './shared/impact';

const VIEWER_OPTIONS: { id: Viewer; label: string }[] = [
  { id: 'member', label: 'Member' },
  { id: 'curator', label: 'Team-only' },
];

// The two versions to compare: goal expressed as predefined objectives vs. as free-text user goal.
const GOAL_OPTIONS: { id: GoalMode; label: string }[] = [
  { id: 'reasoning', label: 'Reasoning' },
  { id: 'objectives', label: 'Objectives' },
];

function itemMatchesSearch(item: MockRoadmapItem, searchText: string): boolean {
  const query = searchText.trim().toLowerCase();
  if (!query) return true;
  const haystack = [
    item.title,
    item.description,
    item.type ?? '',
    ...(item.objectives ?? []).map((o) => o.title),
    ...(item.tags ?? []),
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(query);
}

// Pencil inside the "Resume draft" button — mirrors the gantry-saved-draft-item prototype.
function ResumeIcon(props?: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 18 18" fill="none" aria-hidden {...props}>
      <path
        d="M11.6 3.4l3 3M4 14h3l7.6-7.6a1.4 1.4 0 0 0 0-2L13.6 3.4a1.4 1.4 0 0 0-2 0L4 11v3z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowUpSmallIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M6 10V2m0 0L2.5 5.5M6 2L9.5 5.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (next: T) => void;
}) {
  return (
    <div className={s.control}>
      <span className={s.controlLabel}>{label}</span>
      <div className={s.segments} role="group" aria-label={label}>
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            className={clsx(s.segment, value === opt.id && s.segmentActive)}
            aria-pressed={value === opt.id}
            onClick={() => onChange(opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function GantryImpactRatingPrototype() {
  const [searchText, setSearchText] = useState('');
  const [visibleColumns, setVisibleColumns] = useState<RoadmapColumnStage[]>([...DEFAULT_ROADMAP_VISIBLE_COLUMNS]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState<GantryDraft | null>(null);
  const [viewer, setViewer] = useState<Viewer>('member');
  const [goalMode, setGoalMode] = useState<GoalMode>('reasoning');
  const curatorView = viewer === 'curator';
  // The objectives version rates impact toward each objective; the reasoning version is one score.
  const variant: Variant = goalMode === 'objectives' ? 'per-objective' : 'overall';
  const board = useBoardState(variant);

  // Client-only: this prototype reuses interactive production components (react-select, mobile nav)
  // whose markup differs pre-hydration. Gating on mount keeps SSR === first paint.
  const [mounted, setMounted] = useState(false);
  // Deliberate mount-gate so SSR markup === first client paint before reused interactive
  // production components hydrate.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  const isNarrow = useIsNarrow();
  const { effectiveActiveColumn, scrollContainerRef, columnRefs, tabsWrapperRef, handleTabChange } =
    useRoadmapMobileNav(visibleColumns, isNarrow, mounted);

  const boardItems = board.items;
  const filteredItems = useMemo(
    () =>
      boardItems.filter((item) => {
        if (!visibleColumns.includes(item.stage as RoadmapColumnStage)) return false;
        if (selectedTags.length > 0 && !selectedTags.every((tag) => item.tags?.includes(tag))) return false;
        if (selectedTypes.length > 0 && (!item.type || !selectedTypes.includes(item.type))) return false;
        if (selectedObjectives.length > 0 && !item.objectives?.some((o) => selectedObjectives.includes(o.uid)))
          return false;
        return itemMatchesSearch(item, searchText);
      }),
    [boardItems, searchText, selectedObjectives, selectedTags, selectedTypes, visibleColumns],
  );

  const itemsByStage = useMemo(() => {
    const map = Object.fromEntries(visibleColumns.map((stage) => [stage, [] as MockRoadmapItem[]])) as Record<
      RoadmapColumnStage,
      MockRoadmapItem[]
    >;
    for (const item of filteredItems) {
      if (visibleColumns.includes(item.stage as RoadmapColumnStage)) map[item.stage as RoadmapColumnStage].push(item);
    }
    return map;
  }, [filteredItems, visibleColumns]);

  const appliedFiltersCount =
    selectedTags.length + selectedTypes.length + selectedObjectives.length + (searchText.trim() ? 1 : 0);

  const clearFilters = () => {
    setVisibleColumns([...DEFAULT_ROADMAP_VISIBLE_COLUMNS]);
    setSelectedTags([]);
    setSelectedTypes([]);
    setSelectedObjectives([]);
    setSearchText('');
  };

  if (!mounted) {
    return <div className={s.root} />;
  }

  const boostStatusIndicator = (
    <div className={roadmap.boostStatusWrapper}>
      <div className={roadmap.boostStatus} aria-label="10 of 10 boosts remaining">
        <ArrowUpSmallIcon />
        <span className={roadmap.boostStatusText}>10 of 10 boosts left</span>
        <span className={roadmap.boostDots} aria-hidden>
          <span className={roadmap.boostDot} />
          <span className={roadmap.boostDot} />
          <span className={roadmap.boostDot} />
        </span>
      </div>
    </div>
  );

  const createButton = draft ? (
    <button type="button" className={ideas.submitButton} onClick={() => setCreateOpen(true)}>
      <ResumeIcon className={ideas.submitIcon} />
      Resume draft
    </button>
  ) : (
    <IdeasSubmitButton label="Create Item" onClick={() => setCreateOpen(true)} />
  );

  const popoverItem = board.popover ? board.items.find((i) => i.uid === board.popover?.uid) : undefined;
  const drawerItem = board.drawerUid ? board.items.find((i) => i.uid === board.drawerUid) : undefined;

  const protoControls = (
    <div className={s.protoBar}>
      <span className={s.protoTag}>Prototype</span>
      <Segmented label="Goal" value={goalMode} options={GOAL_OPTIONS} onChange={setGoalMode} />
      <Segmented label="View as" value={viewer} options={VIEWER_OPTIONS} onChange={setViewer} />
    </div>
  );

  const filtersPanel = (
    <PrototypeRoadmapFilters
      visibleColumns={visibleColumns}
      onVisibleColumnsChange={setVisibleColumns}
      selectedTags={selectedTags}
      onSelectedTagsChange={setSelectedTags}
      selectedTypes={selectedTypes}
      onSelectedTypesChange={setSelectedTypes}
      searchText={searchText}
      onSearchTextChange={setSearchText}
      objectives={mockImpactObjectives}
      selectedObjectives={selectedObjectives}
      onSelectedObjectivesChange={setSelectedObjectives}
    />
  );

  const renderCards = (stage: RoadmapColumnStage, emptyClassName: string) =>
    itemsByStage[stage]?.length ? (
      itemsByStage[stage].map((item) => (
        <RoadmapImpactCard
          key={item.uid}
          item={item}
          position={item.order ?? undefined}
          viewer={board.state[item.uid]}
          goalMode={goalMode}
          curatorView={curatorView}
          onToggleBoost={board.toggleBoost}
          onOpen={board.openDrawer}
        />
      ))
    ) : (
      <p className={emptyClassName}>No mocked items.</p>
    );

  const filters = (
    <FiltersSidePanel clearParams={clearFilters} appliedFiltersCount={appliedFiltersCount} hideFooter>
      {filtersPanel}
    </FiltersSidePanel>
  );

  const content = (
    <div className={roadmap.pageLayout}>
      <div className={roadmap.content}>
        <div className={roadmap.pageHeader}>
          <div className={roadmap.titleRow}>
            <div className={roadmap.titleSection}>
              <h1 className={roadmap.title}>Gantry</h1>
              <p className={roadmap.subtitle}>
                Submit what you need, see what we&rsquo;re building. Boosting an item means rating its{' '}
                <strong>Impact to goals</strong> — the score is visible to everyone.
              </p>
            </div>
            <div className={roadmap.actions}>
              {boostStatusIndicator}
              {createButton}
            </div>
          </div>
          {protoControls}
        </div>

        <div className={roadmap.boardScroll}>
          <div
            className={roadmap.columns}
            style={
              {
                '--roadmap-cols': visibleColumns.length,
                gridTemplateColumns: `repeat(${visibleColumns.length}, minmax(260px, 1fr))`,
              } as CSSProperties
            }
          >
            {visibleColumns.map((stage) => (
              <section key={stage} className={roadmap.column}>
                <div className={roadmap.columnHeader}>
                  <StageBadge stage={stage} className={roadmap.columnHeaderBadge} />
                </div>
                <div className={roadmap.list}>{renderCards(stage, roadmap.empty)}</div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const mobileLayout = (
    <div className={roadmap.pageLayout}>
      <div className={roadmap.content}>
        <div className={roadmap.pageHeader}>
          <div className={roadmap.titleRow}>
            <div className={roadmap.titleSection}>
              <div className={roadmap.titleInline}>
                <h1 className={roadmap.title}>Gantry</h1>
                {boostStatusIndicator}
              </div>
              <div className={clsx(roadmap.mobileActionsRow, s.mobileActionsSpacing)}>
                <button type="button" className={s.mobileFiltersButton} onClick={() => setFiltersOpen(true)}>
                  <PlusIcon color="#455468" />
                  Filters
                  {appliedFiltersCount > 0 && <span>&nbsp;({appliedFiltersCount})</span>}
                </button>
                {createButton}
              </div>
            </div>
          </div>
          {protoControls}
        </div>

        {visibleColumns.length === 0 ? (
          <p className={roadmap.empty}>Select at least one column to view the roadmap.</p>
        ) : (
          <>
            <div ref={tabsWrapperRef} className={clsx(roadmap.mobileTabs, s.stageNav)}>
              <div className={s.stageNavTrack} role="tablist" aria-label="Roadmap stages">
                {visibleColumns.map((stage) => {
                  const isActive = (effectiveActiveColumn ?? visibleColumns[0]) === stage;
                  return (
                    <button
                      key={stage}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      className={clsx(s.stageNavTab, isActive && s.stageNavTabActive)}
                      onClick={() => handleTabChange(stage)}
                    >
                      <span
                        className={clsx(filterStyles.stageFilterDot, filterStyles[`stageFilterDot_${stage}`])}
                        aria-hidden
                      />
                      <span className={s.stageNavLabel}>{GANTRY_STAGE_LABELS[stage]}</span>
                      <span className={s.stageNavCount}>{itemsByStage[stage]?.length ?? 0}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div ref={scrollContainerRef} className={roadmap.mobileScrollContainer}>
              {visibleColumns.map((stage) => (
                <div
                  key={stage}
                  data-stage={stage}
                  ref={(el) => {
                    if (el) columnRefs.current.set(stage, el);
                    else columnRefs.current.delete(stage);
                  }}
                  className={roadmap.mobileColumn}
                >
                  {renderCards(stage, roadmap.mobileColumnEmpty)}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className={s.root} style={{ '--app-header-height': '0px' } as CSSProperties}>
      {isNarrow ? mobileLayout : <DashboardPagesLayout filters={filters} content={content} />}

      {isNarrow && (
        <MobileDrawer
          isOpen={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          title={
            <>
              Filters
              {appliedFiltersCount > 0 && <FilterCount count={appliedFiltersCount} />}
            </>
          }
        >
          {filtersPanel}
          <div className={s.mobileFilterFooter}>
            <Button style="border" variant="neutral" className={s.mobileFilterFooterBtn} onClick={clearFilters}>
              Clear filters
            </Button>
            <Button className={s.mobileFilterFooterBtn} onClick={() => setFiltersOpen(false)}>
              Apply filters
            </Button>
          </div>
        </MobileDrawer>
      )}

      {board.popover && popoverItem && (
        <BoostImpactPopover
          pos={{ top: board.popover.top, left: board.popover.left }}
          objectives={variant === 'per-objective' ? popoverItem.objectives : undefined}
          onSave={board.savePopoverRating}
          onCancel={board.cancelPopover}
        />
      )}

      {drawerItem && (
        <ItemDrawer
          item={drawerItem}
          viewer={board.state[drawerItem.uid]}
          goalMode={goalMode}
          curatorView={curatorView}
          onToggleBoost={board.toggleBoost}
          onClose={board.closeDrawer}
        />
      )}

      {board.toast && (
        <div className={s.toast} role="status">
          <span>{board.toast}</span>
          <button type="button" className={s.toastClose} onClick={board.dismissToast} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}

      <CreateItemModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onPublish={board.publishItem}
        draft={draft}
        onDraftChange={setDraft}
        goalMode={goalMode}
      />
    </div>
  );
}

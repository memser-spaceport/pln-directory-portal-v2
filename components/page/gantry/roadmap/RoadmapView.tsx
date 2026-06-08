'use client';

import { Children, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import DashboardPagesLayout from '@/components/core/dashboard-pages-layout/DashboardPagesLayout';
import { useLocalStorageParam } from '@/hooks/useLocalStorageParam';
import { useIsNarrow } from '@/hooks/useIsNarrow';
import type { GantryItem, GantryStage } from '@/services/gantry/types';
import { useCurrentUserStore } from '@/services/auth/store';
import { useGantryAccess } from '@/services/rbac/hooks/useGantryAccess';
import { useGantryItems } from '@/services/gantry/hooks/useGantryItems';
import { useGantryTransition } from '@/services/gantry/hooks/useGantryTransition';
import { useGantryUpvote } from '@/services/gantry/hooks/useGantryUpvote';
import {
  DEFAULT_ROADMAP_VISIBLE_COLUMNS,
  GANTRY_ROADMAP_COLUMN_STAGES,
  GANTRY_VISIBLE_COLUMNS_STORAGE_KEY,
  ROADMAP_SORT_OPTIONS,
  isPreRoadmapStage,
  sortGantryItems,
  sortGantryItemsByDate,
  sortGantryItemsByDefault,
  sortRoadmapColumnStages,
  type RoadmapSortOption,
} from '@/services/gantry/constants';
import { useReorderGantryItem } from '@/services/gantry/hooks/useReorderGantryItem';
import { SortDropdown } from '@/components/common/filters/SortDropdown';
import { stripHtml } from '@/utils/forum';
import { useGantryAnalytics } from '@/analytics/gantry.analytics';
import { IdeasSubmitButton } from '@/components/page/gantry/ideas/IdeasSubmitButton';
import { SubmitIdeaModal } from '@/components/page/gantry/ideas/SubmitIdeaModal/SubmitIdeaModal';
import { DeclineIdeaModal } from '@/components/page/gantry/shared/DeclineIdeaModal';
import { useSubmitIdeaModalStore } from '@/services/gantry/store';
import { StageBadge } from '@/components/page/gantry/shared/StageBadge';
import { Tabs } from '@/components/common/Tabs/Tabs';
import { MobileDrawer } from '@/components/ui/MobileDrawer/MobileDrawer';
import { RoadmapCard, RoadmapCardDragOverlay } from './RoadmapCard';
import { RoadmapFilters, type RoadmapColumnStage } from './RoadmapFilters';
import { RoadmapFiltersContent } from './RoadmapFiltersContent';
import gantryPageStyles from '@/components/page/gantry/GantryPage.module.scss';
import s from './Roadmap.module.scss';

function RoadmapDropColumn({
  stage,
  children,
  isAdminOrdering,
  itemIds,
  dropPreviewIndex,
}: {
  stage: RoadmapColumnStage;
  children: ReactNode;
  isAdminOrdering: boolean;
  itemIds: string[];
  dropPreviewIndex?: number;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: stage });
  const childrenArray = Children.toArray(children);
  const listItems: ReactNode[] = [];
  for (let i = 0; i < childrenArray.length; i++) {
    if (dropPreviewIndex === i) {
      listItems.push(<div key="__placeholder" className={s.cardPlaceholder} aria-hidden />);
    }
    listItems.push(childrenArray[i]);
  }
  if (dropPreviewIndex !== undefined && dropPreviewIndex >= childrenArray.length) {
    listItems.push(<div key="__placeholder" className={s.cardPlaceholder} aria-hidden />);
  }
  const list = <div className={s.list}>{listItems}</div>;
  return (
    <div ref={setNodeRef} className={s.column} data-over={isOver || undefined}>
      <div className={s.columnHeader}>
        <StageBadge stage={stage} className={s.columnHeaderBadge} />
      </div>
      {isAdminOrdering ? (
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {list}
        </SortableContext>
      ) : (
        list
      )}
    </div>
  );
}

function isRoadmapColumnStage(stage: string): stage is RoadmapColumnStage {
  return (GANTRY_ROADMAP_COLUMN_STAGES as readonly string[]).includes(stage);
}

export function RoadmapView() {
  const analytics = useGantryAnalytics();
  const { currentUser } = useCurrentUserStore();
  const { canCreateIdea, canCurate, canTransition, canUpvote } = useGantryAccess();
  const { actions: submitIdeaModalActions } = useSubmitIdeaModalStore();
  const canSetStageOnCreate = canCurate || canTransition;
  const canCreate = canSetStageOnCreate || canCreateIdea;
  const createLabel = canSetStageOnCreate ? 'Create Item' : 'Share a need';
  const createVariant = canSetStageOnCreate ? 'roadmap' : 'idea';
  const [visibleColumns, setVisibleColumns] = useLocalStorageParam<RoadmapColumnStage[]>(
    GANTRY_VISIBLE_COLUMNS_STORAGE_KEY,
    [...DEFAULT_ROADMAP_VISIBLE_COLUMNS],
  );
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const handleSelectedTagsChange = (tags: string[]) => {
    setSelectedTags(tags);
    if (tags.length > 0) analytics.onTagsFiltered(tags);
  };
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const handleSelectedTypesChange = (types: string[]) => {
    setSelectedTypes(types);
    if (types.length > 0) analytics.onTypeFiltered(types);
  };
  const [searchText, setSearchText] = useState<string>('');
  const handleSearchTextChange = (text: string) => {
    setSearchText(text);
    if (text) analytics.onSearched(text);
  };
  const [sortOption, setSortOption] = useState<RoadmapSortOption>('default');
  const handleSortChange = (value: string) => {
    setSortOption(value as RoadmapSortOption);
    analytics.onSortChanged(value);
  };
  const isAdminOrdering = canCurate && sortOption === 'default';
  // Local uid-order overrides per stage, set immediately on admin drag so the display
  // doesn't depend on whether the backend has persisted the `order` field yet.
  const [adminOrderMap, setAdminOrderMap] = useState<Partial<Record<RoadmapColumnStage, string[]>>>({});
  const [declineTargetUid, setDeclineTargetUid] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeDragWidth, setActiveDragWidth] = useState<number | null>(null);
  const [dropPreview, setDropPreview] = useState<{ columnId: RoadmapColumnStage; insertIndex: number } | null>(null);

  // Mobile layout state (< 1024px)
  const isNarrow = useIsNarrow();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeColumn, setActiveColumn] = useState<RoadmapColumnStage | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const columnRefs = useRef<Map<RoadmapColumnStage, HTMLDivElement>>(new Map());
  const tabsWrapperRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScrollRef = useRef(false);

  const orderedVisibleColumns = useMemo(() => sortRoadmapColumnStages(visibleColumns), [visibleColumns]);

  const params = useMemo(
    () => ({
      stage: orderedVisibleColumns.length > 0 ? orderedVisibleColumns : undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      type: selectedTypes.length > 0 ? selectedTypes : undefined,
    }),
    [orderedVisibleColumns, selectedTags, selectedTypes],
  );

  const { data, isLoading, isError } = useGantryItems(params, !!currentUser && orderedVisibleColumns.length > 0);
  const transition = useGantryTransition();
  const upvote = useGantryUpvote();
  const reorder = useReorderGantryItem();

  useEffect(() => {
    analytics.onRoadmapViewed();
  }, [analytics]);

  // Derived: always resolves to a valid visible column even when activeColumn is stale
  const effectiveActiveColumn = useMemo(() => {
    if (orderedVisibleColumns.length === 0) return null;
    if (activeColumn && orderedVisibleColumns.includes(activeColumn)) return activeColumn;
    return orderedVisibleColumns[0];
  }, [activeColumn, orderedVisibleColumns]);

  // When effectiveActiveColumn differs from what user last set (i.e. a filter removed the active column),
  // snap the scroll container back to the new first column without animation.
  const prevEffectiveColumnRef = useRef<RoadmapColumnStage | null>(null);
  useEffect(() => {
    if (effectiveActiveColumn !== prevEffectiveColumnRef.current && !isProgrammaticScrollRef.current) {
      if (effectiveActiveColumn && prevEffectiveColumnRef.current !== null) {
        const container = scrollContainerRef.current;
        const colEl = columnRefs.current.get(effectiveActiveColumn);
        if (container && colEl) {
          container.scrollTo({ left: colEl.offsetLeft, behavior: 'instant' as ScrollBehavior });
        }
      }
    }
    prevEffectiveColumnRef.current = effectiveActiveColumn;
  }, [effectiveActiveColumn]);

  // Swipe → tab: IntersectionObserver watches columns inside the scroll container
  useEffect(() => {
    if (!isNarrow || !scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (isProgrammaticScrollRef.current) return;
        const visible = entries.find((e) => e.isIntersecting && e.intersectionRatio >= 0.5);
        if (visible) {
          const stage = visible.target.getAttribute('data-stage') as RoadmapColumnStage;
          if (stage) setActiveColumn(stage);
        }
      },
      { threshold: 0.5, root: container },
    );
    columnRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [isNarrow, orderedVisibleColumns]);

  // Active tab scroll-into-view when effectiveActiveColumn changes (driven by swipe or filter reset).
  // Uses getBoundingClientRect + direct scrollTo on the Tabs root to avoid scrolling the page.
  useEffect(() => {
    if (!isNarrow || !effectiveActiveColumn || !tabsWrapperRef.current) return;
    const tabIndex = orderedVisibleColumns.indexOf(effectiveActiveColumn);
    const tabsRoot = tabsWrapperRef.current.firstElementChild as HTMLElement | null;
    if (!tabsRoot || tabIndex < 0) return;
    const tabEl = tabsRoot.querySelectorAll<HTMLElement>('[role="tab"]')[tabIndex];
    if (!tabEl) return;
    const tabRect = tabEl.getBoundingClientRect();
    const containerRect = tabsRoot.getBoundingClientRect();
    const tabCenterInScroll = tabRect.left - containerRect.left + tabsRoot.scrollLeft + tabEl.offsetWidth / 2;
    const targetScrollLeft = tabCenterInScroll - containerRect.width / 2;
    tabsRoot.scrollTo({ left: Math.max(0, targetScrollLeft), behavior: 'smooth' });
  }, [effectiveActiveColumn, isNarrow, orderedVisibleColumns]);

  const handleTabChange = (stage: RoadmapColumnStage) => {
    setActiveColumn(stage);
    isProgrammaticScrollRef.current = true;
    const container = scrollContainerRef.current;
    const colEl = columnRefs.current.get(stage);
    if (container && colEl) {
      container.scrollTo({ left: colEl.offsetLeft, behavior: 'smooth' });
    }
    setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 500);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const itemsByStage = useMemo(() => {
    const map = Object.fromEntries(orderedVisibleColumns.map((stage) => [stage, [] as GantryItem[]])) as Record<
      RoadmapColumnStage,
      GantryItem[]
    >;

    const lowerSearch = searchText.trim().toLowerCase();

    (data?.items ?? []).forEach((item) => {
      if (!isRoadmapColumnStage(item.stage) || !(item.stage in map)) return;
      if (lowerSearch) {
        const plainDesc = stripHtml(item.description ?? '');
        const matches =
          item.title.toLowerCase().includes(lowerSearch) || plainDesc.toLowerCase().includes(lowerSearch);
        if (!matches) return;
      }
      map[item.stage].push(item);
    });

    const sortFn =
      sortOption === 'upvotes' ? sortGantryItems : sortOption === 'date' ? sortGantryItemsByDate : sortGantryItemsByDefault;
    orderedVisibleColumns.forEach((stage) => {
      map[stage] = sortFn(map[stage]);

      // Apply local admin ordering override: preserves the user's drag position even
      // when the server hasn't persisted the `order` field yet.
      const adminOrder = adminOrderMap[stage];
      if (adminOrder) {
        const itemMap = new Map(map[stage].map((item) => [item.uid, item]));
        const known = adminOrder.filter((uid) => itemMap.has(uid)).map((uid) => itemMap.get(uid)!);
        const extra = map[stage].filter((item) => !new Set(adminOrder).has(item.uid));
        map[stage] = [...known, ...extra];
      }
    });

    return map;
  }, [data?.items, orderedVisibleColumns, searchText, sortOption, adminOrderMap]);

  const applyStageChange = async (itemUid: string, item: GantryItem, nextStage: GantryStage) => {
    if (nextStage === 'DECLINED') {
      setDeclineTargetUid(itemUid);
      return;
    }

    if (isPreRoadmapStage(item.stage) && nextStage === 'PLANNED') {
      await transition.mutateAsync({ uid: itemUid, payload: { type: 'promote' } });
      return;
    }

    await transition.mutateAsync({ uid: itemUid, payload: { type: 'transition', stage: nextStage } });
  };

  const applyReorder = async (activeId: string, overId: string) => {
    const activeItem = data?.items.find((i) => i.uid === activeId);
    if (!activeItem || !isRoadmapColumnStage(activeItem.stage)) return;
    const columnItems = itemsByStage[activeItem.stage];
    const activeIdx = columnItems.findIndex((i) => i.uid === activeId);
    const overIdx = columnItems.findIndex((i) => i.uid === overId);
    if (activeIdx === -1 || overIdx === -1 || activeIdx === overIdx) return;

    const reordered = arrayMove(columnItems, activeIdx, overIdx);

    // Update local display order immediately — the visual position is driven by this,
    // not by the server `order` field, so it works even when all items have order=null.
    setAdminOrderMap((prev) => ({ ...prev, [activeItem.stage]: reordered.map((i) => i.uid) }));

    // Compute fractional order for the backend PATCH.
    const BASE = 1000;
    const prev = reordered[overIdx - 1];
    const next = reordered[overIdx + 1];
    const prevOrder = prev?.order ?? (overIdx - 1) * BASE;
    const nextOrder = next?.order ?? (overIdx + 1) * BASE;
    const newOrder = (prevOrder + nextOrder) / 2;

    analytics.onItemReordered(activeId, activeItem.stage);
    await reorder.mutateAsync({ uid: activeId, order: newOrder });
  };

  const activeDragItem = useMemo(
    () => (activeDragId ? data?.items.find((i) => i.uid === activeDragId) : undefined),
    [activeDragId, data?.items],
  );

  const clearActiveDrag = () => {
    setActiveDragId(null);
    setActiveDragWidth(null);
    setDropPreview(null);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
    setActiveDragWidth(event.active.rect.current.initial?.width ?? null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const activeId = String(event.active.id);
    const overId = event.over?.id ? String(event.over.id) : null;
    if (!overId) { setDropPreview(null); return; }

    const draggedItem = data?.items.find((i) => i.uid === activeId);
    let targetStage: RoadmapColumnStage | null = null;
    let insertIndex: number;

    if (isRoadmapColumnStage(overId)) {
      targetStage = overId;
      insertIndex = itemsByStage[overId]?.length ?? 0;
    } else {
      const overItem = data?.items.find((i) => i.uid === overId);
      if (!overItem || !isRoadmapColumnStage(overItem.stage)) { setDropPreview(null); return; }
      targetStage = overItem.stage;
      const columnItems = itemsByStage[targetStage] ?? [];
      const overIdx = columnItems.findIndex((i) => i.uid === overId);
      if (overIdx === -1) { setDropPreview(null); return; }
      const activeTranslated = event.active.rect.current.translated;
      const overRect = event.over?.rect;
      let insertBefore = true;
      if (activeTranslated && overRect) {
        const activeCenterY = activeTranslated.top + activeTranslated.height / 2;
        const overCenterY = overRect.top + overRect.height / 2;
        insertBefore = activeCenterY < overCenterY;
      }
      insertIndex = insertBefore ? overIdx : overIdx + 1;
    }

    if (!targetStage || !draggedItem || draggedItem.stage === targetStage) { setDropPreview(null); return; }
    setDropPreview({ columnId: targetStage, insertIndex });
  };

  // Pre-seeds adminOrderMap for the destination column so the card lands at the drop
  // position after the React Query refetch, not wherever the sort function would put it.
  const lockDropPosition = (activeId: string, destStage: RoadmapColumnStage, preview: typeof dropPreview) => {
    const columnUids = itemsByStage[destStage].map((i) => i.uid);
    const insertIndex = preview?.columnId === destStage ? preview.insertIndex : columnUids.length;
    const newOrder = [...columnUids.slice(0, insertIndex), activeId, ...columnUids.slice(insertIndex)];
    setAdminOrderMap((prev) => ({ ...prev, [destStage]: newOrder }));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const savedDropPreview = dropPreview; // capture before clearActiveDrag clears it
    clearActiveDrag();
    const activeId = String(event.active.id);
    const overId = event.over?.id ? String(event.over.id) : null;
    if (!overId) return;

    // over a card uid (same or different column)
    if (!isRoadmapColumnStage(overId)) {
      const activeItem = data?.items.find((i) => i.uid === activeId);
      const overItem = data?.items.find((i) => i.uid === overId);
      if (!activeItem || !overItem) return;

      // Different stages → treat as cross-column move
      if (activeItem.stage !== overItem.stage) {
        if (!canTransition || !isRoadmapColumnStage(overItem.stage) || !orderedVisibleColumns.includes(overItem.stage)) return;
        lockDropPosition(activeId, overItem.stage, savedDropPreview);
        await applyStageChange(activeId, activeItem, overItem.stage);
        return;
      }

      // Same stage → within-column reorder (admin only, default sort only)
      if (!isAdminOrdering) return;
      await applyReorder(activeId, overId);
      return;
    }

    // over a stage droppable → cross-column move
    if (!canTransition || !orderedVisibleColumns.includes(overId)) return;
    const item = data?.items.find((i) => i.uid === activeId);
    if (!item || item.stage === overId) return;
    lockDropPosition(activeId, overId, savedDropPreview);
    await applyStageChange(activeId, item, overId);
  };

  const handleDragCancel = () => {
    clearActiveDrag();
  };

  const handleDeclineConfirm = async (reason: string) => {
    if (!declineTargetUid) return;
    try {
      await transition.mutateAsync({ uid: declineTargetUid, payload: { type: 'decline', reason } });
      setDeclineTargetUid(null);
    } catch {
      // Keep modal open for retry.
    }
  };

  const handleUpvoteToggle = async (uid: string, nextHasUpvoted: boolean) => {
    await upvote.mutateAsync({ uid, nextHasUpvoted });
    if (nextHasUpvoted) analytics.onItemUpvoted(uid);
  };

  if (isNarrow) {
    return (
      <div className={s.pageLayout}>
        <div className={s.content}>
          <div className={s.pageHeader}>
            <div className={s.titleRow}>
              <div className={s.titleSection}>
                <div className={s.titleInline}>
                  <h1 className={s.title}>Gantry</h1>
                  <div className={s.mobileActionsRow}>
                    <SortDropdown
                      options={ROADMAP_SORT_OPTIONS}
                      currentSort={sortOption}
                      onSortChange={handleSortChange}
                    />
                    <button className={s.filtersButton} onClick={() => setFiltersOpen(true)} type="button">
                      <svg className={s.filtersButtonIcon} viewBox="0 0 16 16" fill="none" aria-hidden>
                        <path
                          d="M2 4h12M4.5 8h7M7 12h2"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                      Filters
                      {selectedTags.length + selectedTypes.length + (searchText ? 1 : 0) > 0 && (
                        <span className={s.filtersButtonBadge}>{selectedTags.length + selectedTypes.length + (searchText ? 1 : 0)}</span>
                      )}
                    </button>
                    {canCreate && (
                      <IdeasSubmitButton
                        label={createLabel}
                        onClick={() => submitIdeaModalActions.openModal(createVariant)}
                      />
                    )}
                  </div>
                </div>
                <p className={s.subtitle}>
                  Submit what you need, see what we are building. The shortest path to the LabOS roadmap.
                </p>
              </div>
            </div>
          </div>

          {orderedVisibleColumns.length === 0 ? (
            <p className={s.empty}>Select at least one column to view the roadmap.</p>
          ) : (
            <>
              <div ref={tabsWrapperRef} className={s.mobileTabs}>
                <Tabs
                  tabs={orderedVisibleColumns.map((stage) => ({ value: stage, label: <StageBadge stage={stage} /> }))}
                  value={effectiveActiveColumn ?? orderedVisibleColumns[0]}
                  onValueChange={(v) => handleTabChange(v as RoadmapColumnStage)}
                  classes={{
                    tab: s.mobileTab,
                  }}
                />
              </div>

              {isLoading ? (
                <div className={s.mobileScrollContainer}>
                  {orderedVisibleColumns.map((stage) => (
                    <div key={stage} className={s.mobileSkeletonColumn}>
                      {[1, 2, 3].map((i) => (
                        <div key={i} className={s.mobileSkeletonCard} />
                      ))}
                    </div>
                  ))}
                </div>
              ) : isError ? (
                <p className={s.empty}>Failed to load roadmap.</p>
              ) : (
                <div ref={scrollContainerRef} className={s.mobileScrollContainer}>
                  {orderedVisibleColumns.map((stage) => (
                    <div
                      key={stage}
                      data-stage={stage}
                      ref={(el) => {
                        if (el) columnRefs.current.set(stage, el);
                        else columnRefs.current.delete(stage);
                      }}
                      className={s.mobileColumn}
                    >
                      {itemsByStage[stage].length === 0 ? (
                        <p className={s.mobileColumnEmpty}>
                          {searchText ? 'No items match your search.' : 'No items in this stage.'}
                        </p>
                      ) : (
                        itemsByStage[stage].map((item) => (
                          <RoadmapCard
                            key={item.uid}
                            item={item}
                            canUpvote={canUpvote}
                            onUpvoteToggle={handleUpvoteToggle}
                          />
                        ))
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <MobileDrawer isOpen={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filters">
          <RoadmapFiltersContent
            visibleColumns={visibleColumns}
            onVisibleColumnsChange={setVisibleColumns}
            selectedTags={selectedTags}
            onSelectedTagsChange={handleSelectedTagsChange}
            selectedTypes={selectedTypes}
            onSelectedTypesChange={handleSelectedTypesChange}
            searchText={searchText}
            onSearchTextChange={handleSearchTextChange}
          />
        </MobileDrawer>

        <SubmitIdeaModal />
        <DeclineIdeaModal
          isOpen={declineTargetUid !== null}
          isPending={transition.isPending}
          onClose={() => setDeclineTargetUid(null)}
          onConfirm={handleDeclineConfirm}
        />
      </div>
    );
  }

  return (
    <div className={s.pageLayout}>
      <DashboardPagesLayout
        filters={
          <RoadmapFilters
            visibleColumns={visibleColumns}
            onVisibleColumnsChange={setVisibleColumns}
            selectedTags={selectedTags}
            onSelectedTagsChange={handleSelectedTagsChange}
            selectedTypes={selectedTypes}
            onSelectedTypesChange={handleSelectedTypesChange}
            searchText={searchText}
            onSearchTextChange={handleSearchTextChange}
          />
        }
        content={
          <div className={gantryPageStyles.contentShell}>
            <div className={s.content}>
              <div className={s.pageHeader}>
                <div className={s.titleRow}>
                  <div className={s.titleSection}>
                    <div className={s.titleInline}>
                      <h1 className={s.title}>Gantry</h1>
                      {canCreate && (
                        <div className={s.actionsMobile}>
                          <IdeasSubmitButton
                            label={createLabel}
                            onClick={() => submitIdeaModalActions.openModal(createVariant)}
                          />
                        </div>
                      )}
                    </div>
                    <p className={s.subtitle}>
                      Submit what you need, see what we are building. The shortest path to the LabOS roadmap.
                    </p>
                  </div>
                  <div className={s.actions}>
                    <SortDropdown
                      options={ROADMAP_SORT_OPTIONS}
                      currentSort={sortOption}
                      onSortChange={handleSortChange}
                    />
                    {canCreate && (
                      <IdeasSubmitButton
                        label={createLabel}
                        onClick={() => submitIdeaModalActions.openModal(createVariant)}
                      />
                    )}
                  </div>
                </div>
              </div>

              {orderedVisibleColumns.length === 0 ? (
                <p className={s.empty}>Select at least one column to view the roadmap.</p>
              ) : isLoading ? (
                <div className={s.boardScroll}>
                  <div
                    className={s.loadingBlock}
                    style={{ gridTemplateColumns: `repeat(${orderedVisibleColumns.length}, minmax(240px, 1fr))` }}
                  >
                    {orderedVisibleColumns.map((stage) => (
                      <div key={stage} className={s.skeletonColumn} />
                    ))}
                  </div>
                </div>
              ) : isError ? (
                <p className={s.empty}>Failed to load roadmap.</p>
              ) : (
                <div className={s.boardScroll}>
                  <DndContext
                    sensors={sensors}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                    onDragCancel={handleDragCancel}
                  >
                    <div
                      className={s.columns}
                      style={{ gridTemplateColumns: `repeat(${orderedVisibleColumns.length}, minmax(240px, 1fr))` }}
                    >
                      {orderedVisibleColumns.map((stage) => (
                        <RoadmapDropColumn
                          key={stage}
                          stage={stage}
                          isAdminOrdering={isAdminOrdering}
                          itemIds={itemsByStage[stage].map((i) => i.uid)}
                          dropPreviewIndex={dropPreview?.columnId === stage ? dropPreview.insertIndex : undefined}
                        >
                          {itemsByStage[stage].map((item) => (
                            <RoadmapCard
                              key={item.uid}
                              item={item}
                              canUpvote={canUpvote}
                              onUpvoteToggle={handleUpvoteToggle}
                            />
                          ))}
                        </RoadmapDropColumn>
                      ))}
                    </div>
                    <DragOverlay dropAnimation={null}>
                      {activeDragItem ? (
                        <RoadmapCardDragOverlay
                          item={activeDragItem}
                          width={activeDragWidth ?? undefined}
                          canUpvote={canUpvote}
                          onUpvoteToggle={handleUpvoteToggle}
                        />
                      ) : null}
                    </DragOverlay>
                  </DndContext>
                </div>
              )}
            </div>
          </div>
        }
      />

      <SubmitIdeaModal />

      <DeclineIdeaModal
        isOpen={declineTargetUid !== null}
        isPending={transition.isPending}
        onClose={() => setDeclineTargetUid(null)}
        onConfirm={handleDeclineConfirm}
      />
    </div>
  );
}

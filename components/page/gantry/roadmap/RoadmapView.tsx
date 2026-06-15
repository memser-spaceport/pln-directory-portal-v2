'use client';

import { useEffect, useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { getUiFlag, setUiFlag } from '@/utils/uiFlags';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import DashboardPagesLayout from '@/components/core/dashboard-pages-layout/DashboardPagesLayout';
import { useLocalStorageParam } from '@/hooks/useLocalStorageParam';
import { useIsNarrow } from '@/hooks/useIsNarrow';
import type { GantryItem } from '@/services/gantry/types';
import { useCurrentUserStore } from '@/services/auth/store';
import { useGantryAccess } from '@/services/rbac/hooks/useGantryAccess';
import { useGantryItems } from '@/services/gantry/hooks/useGantryItems';
import { useGantryTransition } from '@/services/gantry/hooks/useGantryTransition';
import { useGantryPin } from '@/services/gantry/hooks/useGantryPin';
import { useGantryPinStatus } from '@/services/gantry/hooks/useGantryPinStatus';
import { useGantryObjectives } from '@/services/gantry/hooks/useGantryObjectives';
import {
  DEFAULT_ROADMAP_VISIBLE_COLUMNS,
  GANTRY_VISIBLE_COLUMNS_STORAGE_KEY,
  isAdminOrderedRoadmapStage,
  sortGantryItemsByDefault,
  sortGantryItemsByTrending,
  sortRoadmapColumnStages,
} from '@/services/gantry/constants';
import { useReorderGantryItem } from '@/services/gantry/hooks/useReorderGantryItem';
import { stripHtml } from '@/utils/forum';
import { useGantryAnalytics } from '@/analytics/gantry.analytics';
import { IdeasSubmitButton } from '@/components/page/gantry/ideas/IdeasSubmitButton';
import { SubmitIdeaModal } from '@/components/page/gantry/ideas/SubmitIdeaModal/SubmitIdeaModal';
import { DeclineIdeaModal } from '@/components/page/gantry/shared/DeclineIdeaModal';
import { useSubmitIdeaModalStore } from '@/services/gantry/store';
import { StageBadge } from '@/components/page/gantry/shared/StageBadge';
import { Tabs } from '@/components/common/Tabs/Tabs';
import { MobileDrawer } from '@/components/ui/MobileDrawer/MobileDrawer';
import FilterCount from '@/components/ui/filter-count';
import { useGantryPinNote } from '@/services/gantry/hooks/useGantryPinNote';
import { PinNotePopover } from '@/components/page/gantry/shared/PinNotePopover';
import { PinSwapPicker } from '@/components/page/gantry/shared/PinSwapPicker';
import { RoadmapCard, RoadmapCardDragOverlay } from './RoadmapCard';
import { RoadmapDropColumn, isRoadmapColumnStage } from './RoadmapDropColumn';
import { RoadmapFilters, type RoadmapColumnStage } from './RoadmapFilters';
import { RoadmapFiltersContent } from './RoadmapFiltersContent';
import { useRoadmapFilters } from './hooks/useRoadmapFilters';
import { useRoadmapDnd } from './hooks/useRoadmapDnd';
import { useRoadmapMobileNav } from './hooks/useRoadmapMobileNav';
import { useRoadmapPinActions } from './hooks/useRoadmapPinActions';
import gantryPageStyles from '@/components/page/gantry/GantryPage.module.scss';
import s from './Roadmap.module.scss';

const BOOST_TIP_KEY = 'gantry_boost_tip_dismissed';

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

export function RoadmapView() {
  const analytics = useGantryAnalytics();
  const { currentUser } = useCurrentUserStore();
  const { canCreateIdea, canCurate, canTransition, canUpvote } = useGantryAccess();
  const { actions: submitIdeaModalActions } = useSubmitIdeaModalStore();
  const isAdminOrdering = canCurate;

  const canSetStageOnCreate = canCurate || canTransition;
  const canCreate = canSetStageOnCreate || canCreateIdea;
  const createLabel = canSetStageOnCreate ? 'Create Item' : 'Share a need';
  const createVariant = canSetStageOnCreate ? 'roadmap' : 'idea';

  const [visibleColumns, setVisibleColumns] = useLocalStorageParam<RoadmapColumnStage[]>(
    GANTRY_VISIBLE_COLUMNS_STORAGE_KEY,
    [...DEFAULT_ROADMAP_VISIBLE_COLUMNS],
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [adminOrderMap, setAdminOrderMap] = useState<Partial<Record<RoadmapColumnStage, string[]>>>({});
  const [showBoostTip, setShowBoostTip] = useState(false);

  const isNarrow = useIsNarrow();

  const orderedVisibleColumns = useMemo(() => sortRoadmapColumnStages(visibleColumns), [visibleColumns]);

  const filters = useRoadmapFilters(orderedVisibleColumns, analytics);

  const { data, isLoading, isError } = useGantryItems(
    filters.params,
    !!currentUser && orderedVisibleColumns.length > 0,
  );
  const { data: objectives = [] } = useGantryObjectives();
  const { data: pinStatus } = useGantryPinStatus(!!currentUser);
  const pinsRemaining = pinStatus ? pinStatus.remaining : null;

  const transition = useGantryTransition();
  const reorder = useReorderGantryItem();
  const pin = useGantryPin();
  const pinNote = useGantryPinNote();

  const { effectiveActiveColumn, scrollContainerRef, columnRefs, tabsWrapperRef, handleTabChange } =
    useRoadmapMobileNav(orderedVisibleColumns, isNarrow);
  const {
    pinStatusRef,
    pinNotePopover,
    handlePinToggle,
    handlePinNoteSave,
    swapPickerState,
    handleSwapSelect,
    handleSwapDismiss,
  } = useRoadmapPinActions(pin, pinNote, analytics, pinStatus);

  const itemsByStage = useMemo(() => {
    const map = Object.fromEntries(orderedVisibleColumns.map((stage) => [stage, [] as GantryItem[]])) as Record<
      RoadmapColumnStage,
      GantryItem[]
    >;

    const lowerSearch = filters.searchText.trim().toLowerCase();
    (data?.items ?? []).forEach((item) => {
      if (!isRoadmapColumnStage(item.stage) || !(item.stage in map)) return;
      if (lowerSearch) {
        const plainDesc = stripHtml(item.description ?? '');
        const matches = item.title.toLowerCase().includes(lowerSearch) || plainDesc.toLowerCase().includes(lowerSearch);
        if (!matches) return;
      }
      map[item.stage].push(item);
    });

    orderedVisibleColumns.forEach((stage) => {
      if (stage === 'IDEA') {
        map[stage] = sortGantryItemsByTrending(map[stage]);
        return;
      }

      if (!isAdminOrderedRoadmapStage(stage)) {
        map[stage] = sortGantryItemsByDefault(map[stage]);
        return;
      }

      map[stage] = sortGantryItemsByDefault(map[stage]);
      const adminOrder = adminOrderMap[stage];
      if (adminOrder) {
        const itemMap = new Map(map[stage].map((item) => [item.uid, item]));
        const known = adminOrder.filter((uid) => itemMap.has(uid)).map((uid) => itemMap.get(uid)!);
        const extra = map[stage].filter((item) => !new Set(adminOrder).has(item.uid));
        map[stage] = [...known, ...extra];
      }
    });

    return map;
  }, [data?.items, orderedVisibleColumns, filters.searchText, adminOrderMap]);

  const dnd = useRoadmapDnd({
    data,
    itemsByStage,
    setAdminOrderMap,
    orderedVisibleColumns,
    canTransition,
    isAdminOrdering,
    isMobile: isNarrow,
    transition,
    reorder,
    analytics,
  });

  useEffect(() => {
    analytics.onRoadmapViewed();
  }, [analytics]);

  useEffect(() => {
    if (!currentUser?.uid) {
      setShowBoostTip(false);
      return;
    }
    getUiFlag(`${BOOST_TIP_KEY}_${currentUser.uid}`).then((dismissed) => {
      setShowBoostTip(!dismissed);
    });
  }, [currentUser?.uid]);

  const dismissBoostTip = () => {
    if (currentUser?.uid) setUiFlag(`${BOOST_TIP_KEY}_${currentUser.uid}`);
    setShowBoostTip(false);
  };

  const handleClearAllFilters = () => {
    filters.handleClearAll();
    setVisibleColumns([...DEFAULT_ROADMAP_VISIBLE_COLUMNS]);
  };

  // pinStatus.pins is the authoritative source for the current user's pins.
  // viewerHasPinned on individual items can lag if the server hasn't updated
  // the list endpoint — reconcile here so the pin button always reflects reality.
  const viewerPinnedUids = useMemo(() => new Set(pinStatus?.pins.map((p) => p.item.uid) ?? []), [pinStatus?.pins]);

  const columnDragState = (stage: RoadmapColumnStage) => {
    const allowsAdminOrdering = isAdminOrdering && isAdminOrderedRoadmapStage(stage);
    const isDraggable = allowsAdminOrdering || (canTransition && !isAdminOrderedRoadmapStage(stage));
    return { allowsAdminOrdering, isDraggable };
  };

  const sharedCardProps = (item: GantryItem, index: number, stage: RoadmapColumnStage) => {
    const viewerHasPinned = item.viewerHasPinned || viewerPinnedUids.has(item.uid);
    const { allowsAdminOrdering, isDraggable } = columnDragState(stage);
    return {
      item: viewerHasPinned !== item.viewerHasPinned ? { ...item, viewerHasPinned } : item,
      position: index + 1,
      isAdminOrdering: allowsAdminOrdering,
      canDrag: isDraggable,
      canPin: canUpvote,
      onPinToggle: handlePinToggle,
      isPinDisabled: !canUpvote,
      canCurate,
      warnPinOrder: allowsAdminOrdering && stage === 'PLANNED' && index > 0 && item.pinCount > itemsByStage[stage][index - 1].pinCount,
    };
  };

  const boostStatusIndicator = pinStatus ? (
    <div className={s.boostStatusWrapper}>
      <div
        ref={pinStatusRef}
        className={s.boostStatus}
        aria-label={`${pinsRemaining} of ${pinStatus.limit} boosts remaining`}
      >
        <ArrowUpSmallIcon />
        <span className={s.boostStatusText}>
          {pinsRemaining} of {pinStatus.limit} boosts left
        </span>
        {pinStatus.limit <= 6 && (
          <span className={s.boostDots} aria-hidden>
            {Array.from({ length: pinStatus.limit }, (_, i) => (
              <span key={i} className={clsx(s.boostDot, i < pinStatus.used && s.boostDotUsed)} />
            ))}
          </span>
        )}
      </div>
      {showBoostTip && (
        <div className={s.boostTip} role="tooltip">
          <p className={s.boostTipTitle}>You have {pinStatus.limit} boosts</p>
          <p className={s.boostTipBody}>
            Spend them on what matters most — you get them back when a boosted item moves to In Progress.
          </p>
          <div className={s.boostTipFooter}>
            <button type="button" className={s.boostTipBtn} onClick={dismissBoostTip}>
              Got it
            </button>
            <span className={s.boostTipMeta}>One-time tip</span>
          </div>
        </div>
      )}
    </div>
  ) : null;

  const modals = (
    <>
      <SubmitIdeaModal objectives={objectives} />
      <DeclineIdeaModal
        isOpen={dnd.declineTargetUid !== null}
        isPending={transition.isPending}
        onClose={() => dnd.setDeclineTargetUid(null)}
        onConfirm={dnd.handleDeclineConfirm}
      />
      {pinNotePopover && (
        <PinNotePopover
          uid={pinNotePopover.uid}
          pos={{ top: pinNotePopover.top, left: pinNotePopover.left }}
          onSave={handlePinNoteSave}
        />
      )}
      {swapPickerState && (
        <PinSwapPicker
          targetItemTitle={data?.items.find((i) => i.uid === swapPickerState.uid)?.title ?? ''}
          pins={pinStatus?.pins ?? []}
          pos={{ top: swapPickerState.top, left: swapPickerState.left }}
          onSelect={handleSwapSelect}
          onDismiss={handleSwapDismiss}
        />
      )}
    </>
  );

  if (isNarrow) {
    return (
      <DndContext
        sensors={dnd.sensors}
        onDragStart={dnd.handleDragStart}
        onDragOver={dnd.handleDragOver}
        onDragEnd={dnd.handleDragEnd}
        onDragCancel={dnd.handleDragCancel}
      >
        <div className={s.pageLayout}>
          <div className={s.content}>
            <div className={s.pageHeader}>
              <div className={s.titleRow}>
                <div className={s.titleSection}>
                  <div className={s.titleInline}>
                    <h1 className={s.title}>Gantry</h1>
                    {boostStatusIndicator}
                  </div>
                  <div className={s.mobileActionsRow}>
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
                      {filters.activeFiltersCount > 0 && (
                        <span className={s.filtersButtonBadge}>{filters.activeFiltersCount}</span>
                      )}
                    </button>
                    {canCreate && (
                      <IdeasSubmitButton
                        label={createLabel}
                        onClick={() => submitIdeaModalActions.openModal(createVariant)}
                      />
                    )}
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
                    classes={{ tab: s.mobileTab }}
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
                  <div
                    ref={scrollContainerRef}
                    className={clsx(s.mobileScrollContainer, dnd.isDragging && s.mobileScrollLocked)}
                  >
                    {orderedVisibleColumns.map((stage) => {
                      const { isDraggable: canDragInColumn } = columnDragState(stage);
                      const canMoveStage =
                        canTransition && orderedVisibleColumns.length > 1 && stage !== 'DECLINED' && stage !== 'IDEA';
                      const availableStages = orderedVisibleColumns.filter((col) => col !== stage);

                      const cards = itemsByStage[stage].map((item, index) => (
                        <RoadmapCard
                          key={item.uid}
                          {...sharedCardProps(item, index, stage)}
                          canDrag={canDragInColumn}
                          isMobile
                          onMoveToStage={
                            canMoveStage
                              ? (targetStage) => dnd.moveItemToStage(item.uid, targetStage)
                              : undefined
                          }
                          availableStages={canMoveStage ? availableStages : undefined}
                          isTransitionPending={dnd.isTransitionPending}
                        />
                      ));

                      return (
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
                              {filters.searchText ? 'No items match your search.' : 'No items in this stage.'}
                            </p>
                          ) : canDragInColumn ? (
                            <SortableContext
                              items={itemsByStage[stage].map((i) => i.uid)}
                              strategy={verticalListSortingStrategy}
                            >
                              {cards}
                            </SortableContext>
                          ) : (
                            cards
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          <MobileDrawer
            isOpen={filtersOpen}
            onClose={() => setFiltersOpen(false)}
            title={
              <>
                Filters
                {filters.activeFiltersCount > 0 && <FilterCount count={filters.activeFiltersCount} />}
              </>
            }
            headerAction={
              <button className={s.drawerClearAllBtn} onClick={handleClearAllFilters} type="button">
                Clear all
              </button>
            }
          >
            <RoadmapFiltersContent
              visibleColumns={visibleColumns}
              onVisibleColumnsChange={setVisibleColumns}
              selectedTags={filters.selectedTags}
              onSelectedTagsChange={filters.handleSelectedTagsChange}
              selectedTypes={filters.selectedTypes}
              onSelectedTypesChange={filters.handleSelectedTypesChange}
              searchText={filters.searchText}
              onSearchTextChange={filters.handleSearchTextChange}
              objectives={objectives}
              selectedObjective={filters.selectedObjective}
              onSelectedObjectiveChange={filters.handleSelectedObjectiveChange}
            />
          </MobileDrawer>

          {modals}
        </div>

        <DragOverlay dropAnimation={null} className={s.mobileDragOverlay}>
          {dnd.activeDragItem ? (
            <RoadmapCardDragOverlay
              item={dnd.activeDragItem}
              width={dnd.activeDragWidth ?? undefined}
              canPin={canUpvote}
              onPinToggle={handlePinToggle}
              isPinDisabled={!canUpvote}
              canCurate={canCurate}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    );
  }

  return (
    <div className={s.pageLayout}>
      <DashboardPagesLayout
        filters={
          <RoadmapFilters
            visibleColumns={visibleColumns}
            onVisibleColumnsChange={setVisibleColumns}
            selectedTags={filters.selectedTags}
            onSelectedTagsChange={filters.handleSelectedTagsChange}
            selectedTypes={filters.selectedTypes}
            onSelectedTypesChange={filters.handleSelectedTypesChange}
            searchText={filters.searchText}
            onSearchTextChange={filters.handleSearchTextChange}
            objectives={objectives}
            selectedObjective={filters.selectedObjective}
            onSelectedObjectiveChange={filters.handleSelectedObjectiveChange}
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
                    {boostStatusIndicator}
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
                    sensors={dnd.sensors}
                    onDragStart={dnd.handleDragStart}
                    onDragOver={dnd.handleDragOver}
                    onDragEnd={dnd.handleDragEnd}
                    onDragCancel={dnd.handleDragCancel}
                  >
                    <div
                      className={s.columns}
                      style={{ gridTemplateColumns: `repeat(${orderedVisibleColumns.length}, minmax(240px, 1fr))` }}
                    >
                      {orderedVisibleColumns.map((stage) => {
                        const { isDraggable } = columnDragState(stage);
                        return (
                        <RoadmapDropColumn
                          key={stage}
                          stage={stage}
                          isDraggable={isDraggable}
                          itemIds={itemsByStage[stage].map((i) => i.uid)}
                          dropPreviewIndex={
                            dnd.dropPreview?.columnId === stage ? dnd.dropPreview.insertIndex : undefined
                          }
                        >
                          {itemsByStage[stage].map((item, index) => (
                            <RoadmapCard key={item.uid} {...sharedCardProps(item, index, stage)} />
                          ))}
                        </RoadmapDropColumn>
                        );
                      })}
                    </div>
                    <DragOverlay dropAnimation={null}>
                      {dnd.activeDragItem ? (
                        <RoadmapCardDragOverlay
                          item={dnd.activeDragItem}
                          width={dnd.activeDragWidth ?? undefined}
                          canPin={canUpvote}
                          onPinToggle={handlePinToggle}
                          isPinDisabled={!canUpvote}
                          canCurate={canCurate}
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

      {modals}
    </div>
  );
}

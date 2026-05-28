'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import DashboardPagesLayout from '@/components/core/dashboard-pages-layout/DashboardPagesLayout';
import type { GantryItem, GantryStage } from '@/services/gantry/types';
import { useCurrentUserStore } from '@/services/auth/store';
import { useGantryAccess } from '@/services/rbac/hooks/useGantryAccess';
import { useGantryItems } from '@/services/gantry/hooks/useGantryItems';
import { useGantryFocusAreas } from '@/services/gantry/hooks/useGantryFocusAreas';
import { useGantryTransition } from '@/services/gantry/hooks/useGantryTransition';
import { useGantryUpvote } from '@/services/gantry/hooks/useGantryUpvote';
import {
  DEFAULT_ROADMAP_VISIBLE_COLUMNS,
  GANTRY_ROADMAP_COLUMN_STAGES,
  sortRoadmapColumnStages,
} from '@/services/gantry/constants';
import { useGantryAnalytics } from '@/analytics/gantry.analytics';
import { GantryTabs } from '@/components/page/gantry/GantryTabs';
import { IdeasSubmitButton } from '@/components/page/gantry/ideas/IdeasSubmitButton';
import { SubmitIdeaModal } from '@/components/page/gantry/ideas/SubmitIdeaModal/SubmitIdeaModal';
import { DeclineIdeaModal } from '@/components/page/gantry/shared/DeclineIdeaModal';
import { useSubmitIdeaModalStore } from '@/services/gantry/store';
import { StageBadge } from '@/components/page/gantry/shared/StageBadge';
import { RoadmapCard, RoadmapCardDragOverlay } from './RoadmapCard';
import { RoadmapFilters, type RoadmapColumnStage } from './RoadmapFilters';
import gantryPageStyles from '@/components/page/gantry/GantryPage.module.scss';
import s from './Roadmap.module.scss';

function RoadmapDropColumn({ stage, children }: { stage: RoadmapColumnStage; children: ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({ id: stage });
  return (
    <div ref={setNodeRef} className={s.column} data-over={isOver || undefined}>
      <div className={s.columnHeader}>
        <StageBadge stage={stage} className={s.columnHeaderBadge} />
      </div>
      <div className={s.list}>{children}</div>
    </div>
  );
}

function isRoadmapColumnStage(stage: string): stage is RoadmapColumnStage {
  return (GANTRY_ROADMAP_COLUMN_STAGES as readonly string[]).includes(stage);
}

export function RoadmapView() {
  const analytics = useGantryAnalytics();
  const { currentUser } = useCurrentUserStore();
  const { canTransition, canUpvote } = useGantryAccess();
  const { actions: submitIdeaModalActions } = useSubmitIdeaModalStore();
  const [mine, setMine] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<RoadmapColumnStage[]>([...DEFAULT_ROADMAP_VISIBLE_COLUMNS]);
  const [focusAreaUids, setFocusAreaUids] = useState<string[]>([]);
  const [declineTargetUid, setDeclineTargetUid] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeDragWidth, setActiveDragWidth] = useState<number | null>(null);

  const orderedVisibleColumns = useMemo(
    () => sortRoadmapColumnStages(visibleColumns),
    [visibleColumns],
  );

  const params = useMemo(
    () => ({
      mine,
      stage: orderedVisibleColumns.length > 0 ? orderedVisibleColumns : undefined,
      focusAreaUid: focusAreaUids.length > 0 ? focusAreaUids : undefined,
    }),
    [mine, orderedVisibleColumns, focusAreaUids],
  );

  const { options: focusAreaOptions } = useGantryFocusAreas(!!currentUser);
  const { data, isLoading, isError } = useGantryItems(params, !!currentUser && orderedVisibleColumns.length > 0);
  const transition = useGantryTransition();
  const upvote = useGantryUpvote();

  useEffect(() => {
    analytics.onRoadmapViewed();
  }, [analytics]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const itemsByStage = useMemo(() => {
    const map = Object.fromEntries(orderedVisibleColumns.map((stage) => [stage, [] as GantryItem[]])) as Record<
      RoadmapColumnStage,
      GantryItem[]
    >;

    (data?.items ?? []).forEach((item) => {
      if (isRoadmapColumnStage(item.stage) && item.stage in map) {
        map[item.stage].push(item);
      }
    });

    return map;
  }, [data?.items, orderedVisibleColumns]);

  const applyStageChange = async (itemUid: string, item: GantryItem, nextStage: GantryStage) => {
    if (nextStage === 'DECLINED') {
      setDeclineTargetUid(itemUid);
      return;
    }

    if ((item.stage === 'IDEA' || item.stage === 'UNDER_REVIEW') && nextStage === 'PLANNED') {
      await transition.mutateAsync({ uid: itemUid, payload: { type: 'promote' } });
      return;
    }

    await transition.mutateAsync({ uid: itemUid, payload: { type: 'transition', stage: nextStage } });
  };

  const activeDragItem = useMemo(
    () => (activeDragId ? data?.items.find((i) => i.uid === activeDragId) : undefined),
    [activeDragId, data?.items],
  );

  const clearActiveDrag = () => {
    setActiveDragId(null);
    setActiveDragWidth(null);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
    setActiveDragWidth(event.active.rect.current.initial?.width ?? null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    clearActiveDrag();
    if (!canTransition) return;
    const itemUid = String(event.active.id);
    const nextStage = event.over?.id ? String(event.over.id) : null;
    if (!nextStage || !isRoadmapColumnStage(nextStage) || !orderedVisibleColumns.includes(nextStage)) return;

    const item = data?.items.find((i) => i.uid === itemUid);
    if (!item || item.stage === nextStage) return;

    await applyStageChange(itemUid, item, nextStage);
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

  return (
    <div className={s.pageLayout}>
      <DashboardPagesLayout
        filters={
          <RoadmapFilters
            mine={mine}
            visibleColumns={visibleColumns}
            focusAreaUids={focusAreaUids}
            focusAreaOptions={focusAreaOptions}
            onMineChange={setMine}
            onVisibleColumnsChange={setVisibleColumns}
            onFocusAreaChange={setFocusAreaUids}
          />
        }
        content={
          <div className={gantryPageStyles.contentShell}>
            <div className={gantryPageStyles.tabsRow}>
              <GantryTabs />
            </div>

            <div className={s.content}>
            <div className={s.pageHeader}>
              <div className={s.titleRow}>
                <div className={s.titleSection}>
                  <div className={s.titleInline}>
                    <h1 className={s.title}>Roadmap</h1>
                    {canTransition && (
                      <div className={s.actionsMobile}>
                        <IdeasSubmitButton
                          label="Create Roadmap Item"
                          onClick={() => submitIdeaModalActions.openModal('roadmap')}
                        />
                      </div>
                    )}
                  </div>
                </div>
                {canTransition && (
                  <div className={s.actions}>
                    <IdeasSubmitButton
                      label="Create Roadmap Item"
                      onClick={() => submitIdeaModalActions.openModal('roadmap')}
                    />
                  </div>
                )}
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
                  onDragEnd={handleDragEnd}
                  onDragCancel={handleDragCancel}
                >
                  <div
                    className={s.columns}
                    style={{ gridTemplateColumns: `repeat(${orderedVisibleColumns.length}, minmax(240px, 1fr))` }}
                  >
                    {orderedVisibleColumns.map((stage) => (
                      <RoadmapDropColumn key={stage} stage={stage}>
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

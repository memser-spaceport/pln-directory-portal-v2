import { useMemo, useState } from 'react';
import {
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import type { useGantryAnalytics } from '@/analytics/gantry.analytics';
import type { GantryItem, GantryItemListResponse, GantryStage } from '@/services/gantry/types';
import { isAdminOrderedRoadmapStage, isPreRoadmapStage } from '@/services/gantry/constants';
import type { RoadmapColumnStage } from '../RoadmapFilters';
import { isRoadmapColumnStage } from '../RoadmapDropColumn';

type Analytics = ReturnType<typeof useGantryAnalytics>;

interface TransitionAPI {
  mutateAsync: (vars: {
    uid: string;
    payload: { type: 'promote' } | { type: 'decline'; reason: string } | { type: 'transition'; stage: GantryStage };
  }) => Promise<unknown>;
  isPending: boolean;
}

interface ReorderAPI {
  mutateAsync: (vars: { uid: string; order: number }) => Promise<unknown>;
}

interface UseRoadmapDndParams {
  data: GantryItemListResponse | undefined;
  itemsByStage: Record<RoadmapColumnStage, GantryItem[]>;
  setAdminOrderMap: React.Dispatch<React.SetStateAction<Partial<Record<RoadmapColumnStage, string[]>>>>;
  orderedVisibleColumns: RoadmapColumnStage[];
  canTransition: boolean;
  isAdminOrdering: boolean;
  transition: TransitionAPI;
  reorder: ReorderAPI;
  analytics: Analytics;
}

export function useRoadmapDnd({
  data,
  itemsByStage,
  setAdminOrderMap,
  orderedVisibleColumns,
  canTransition,
  isAdminOrdering,
  transition,
  reorder,
  analytics,
}: UseRoadmapDndParams) {
  const [declineTargetUid, setDeclineTargetUid] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeDragWidth, setActiveDragWidth] = useState<number | null>(null);
  const [dropPreview, setDropPreview] = useState<{ columnId: RoadmapColumnStage; insertIndex: number } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 300, tolerance: 5 } }),
  );

  const activeDragItem = useMemo(
    () => (activeDragId ? data?.items.find((i) => i.uid === activeDragId) : undefined),
    [activeDragId, data?.items],
  );

  const clearActiveDrag = () => {
    setActiveDragId(null);
    setActiveDragWidth(null);
    setDropPreview(null);
  };

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
    if (!activeItem || !isRoadmapColumnStage(activeItem.stage) || !isAdminOrderedRoadmapStage(activeItem.stage)) {
      return;
    }
    const columnItems = itemsByStage[activeItem.stage];
    const activeIdx = columnItems.findIndex((i) => i.uid === activeId);
    const overIdx = columnItems.findIndex((i) => i.uid === overId);
    if (activeIdx === -1 || overIdx === -1 || activeIdx === overIdx) return;

    const reordered = arrayMove(columnItems, activeIdx, overIdx);
    setAdminOrderMap((prev) => ({ ...prev, [activeItem.stage]: reordered.map((i) => i.uid) }));

    const BASE = 1000;
    const prev = reordered[overIdx - 1];
    const next = reordered[overIdx + 1];
    const prevOrder = prev?.order ?? (overIdx - 1) * BASE;
    const nextOrder = next?.order ?? (overIdx + 1) * BASE;
    const newOrder = (prevOrder + nextOrder) / 2;

    analytics.onItemReordered(activeId, activeItem.stage);
    await reorder.mutateAsync({ uid: activeId, order: newOrder });
  };

  const lockDropPosition = (activeId: string, destStage: RoadmapColumnStage, preview: typeof dropPreview) => {
    if (!isAdminOrderedRoadmapStage(destStage)) return;
    const columnUids = itemsByStage[destStage].map((i) => i.uid);
    const insertIndex = preview?.columnId === destStage ? preview.insertIndex : columnUids.length;
    const newOrder = [...columnUids.slice(0, insertIndex), activeId, ...columnUids.slice(insertIndex)];
    setAdminOrderMap((prev) => ({ ...prev, [destStage]: newOrder }));
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
    setActiveDragWidth(event.active.rect.current.initial?.width ?? null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const activeId = String(event.active.id);
    const overId = event.over?.id ? String(event.over.id) : null;
    if (!overId) {
      setDropPreview(null);
      return;
    }

    const draggedItem = data?.items.find((i) => i.uid === activeId);
    let targetStage: RoadmapColumnStage | null = null;
    let insertIndex: number;

    if (isRoadmapColumnStage(overId)) {
      targetStage = overId;
      insertIndex = itemsByStage[overId]?.length ?? 0;
    } else {
      const overItem = data?.items.find((i) => i.uid === overId);
      if (!overItem || !isRoadmapColumnStage(overItem.stage)) {
        setDropPreview(null);
        return;
      }
      targetStage = overItem.stage;
      const columnItems = itemsByStage[targetStage] ?? [];
      const overIdx = columnItems.findIndex((i) => i.uid === overId);
      if (overIdx === -1) {
        setDropPreview(null);
        return;
      }
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

    if (!targetStage || !draggedItem || draggedItem.stage === targetStage) {
      setDropPreview(null);
      return;
    }
    setDropPreview({ columnId: targetStage, insertIndex });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const savedDropPreview = dropPreview;
    clearActiveDrag();
    const activeId = String(event.active.id);
    const overId = event.over?.id ? String(event.over.id) : null;
    if (!overId) return;

    if (!isRoadmapColumnStage(overId)) {
      const activeItem = data?.items.find((i) => i.uid === activeId);
      const overItem = data?.items.find((i) => i.uid === overId);
      if (!activeItem || !overItem) return;

      if (activeItem.stage !== overItem.stage) {
        if (!canTransition || !isRoadmapColumnStage(overItem.stage) || !orderedVisibleColumns.includes(overItem.stage))
          return;
        lockDropPosition(activeId, overItem.stage, savedDropPreview);
        await applyStageChange(activeId, activeItem, overItem.stage);
        return;
      }

      if (!isAdminOrdering) return;
      await applyReorder(activeId, overId);
      return;
    }

    if (!canTransition || !orderedVisibleColumns.includes(overId)) return;
    const item = data?.items.find((i) => i.uid === activeId);
    if (!item || item.stage === overId) return;
    lockDropPosition(activeId, overId, savedDropPreview);
    await applyStageChange(activeId, item, overId);
  };

  const handleDragCancel = () => clearActiveDrag();

  const handleDeclineConfirm = async (reason: string) => {
    if (!declineTargetUid) return;
    try {
      await transition.mutateAsync({ uid: declineTargetUid, payload: { type: 'decline', reason } });
      setDeclineTargetUid(null);
    } catch {
      // Keep modal open for retry.
    }
  };

  const moveItemToStage = (uid: string, targetStage: RoadmapColumnStage): void => {
    const item = data?.items.find((i) => i.uid === uid);
    if (!item) return;
    applyStageChange(uid, item, targetStage as GantryStage);
  };

  return {
    sensors,
    activeDragItem,
    activeDragWidth,
    dropPreview,
    declineTargetUid,
    setDeclineTargetUid,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
    handleDeclineConfirm,
    isDragging: !!activeDragId,
    moveItemToStage,
    isTransitionPending: transition.isPending,
  };
}

'use client';

import { Children, type ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { StageBadge } from '@/components/page/gantry/shared/StageBadge';
import { GANTRY_ROADMAP_COLUMN_STAGES } from '@/services/gantry/constants';
import type { RoadmapColumnStage } from './RoadmapFilters';
import s from './Roadmap.module.scss';

export function isRoadmapColumnStage(stage: string): stage is RoadmapColumnStage {
  return (GANTRY_ROADMAP_COLUMN_STAGES as readonly string[]).includes(stage);
}

export function RoadmapDropColumn({
  stage,
  children,
  isDraggable,
  itemIds,
  dropPreviewIndex,
}: {
  stage: RoadmapColumnStage;
  children: ReactNode;
  /** Enables SortableContext — reorder and/or cross-column stage transitions. */
  isDraggable: boolean;
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
      {isDraggable ? (
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {list}
        </SortableContext>
      ) : (
        list
      )}
    </div>
  );
}

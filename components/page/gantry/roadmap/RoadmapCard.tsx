'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { GantryItem } from '@/services/gantry/types';
import { GantryItemAuthor } from '../shared/GantryItemAuthor';
import { UpvoteButton } from '../shared/UpvoteButton';
import { useGantryCardNavigate } from '../shared/useGantryCardNavigate';
import s from './Roadmap.module.scss';

interface CardContentProps {
  readonly item: GantryItem;
  readonly canUpvote: boolean;
  readonly onUpvoteToggle: (uid: string, next: boolean) => void;
}

function RoadmapCardContent({ item, canUpvote, onUpvoteToggle }: CardContentProps) {
  return (
    <>
      <div className={s.cardHead}>
        <h3 className={s.cardTitle}>{item.title}</h3>
        <UpvoteButton
          count={item.upvoteCount}
          hasUpvoted={item.viewerHasUpvoted}
          disabled={!canUpvote}
          onToggle={(next) => onUpvoteToggle(item.uid, next)}
        />
      </div>
      <div className={s.meta}>
        <span>{item.focusArea?.title ?? 'No focus area'}</span>
        <GantryItemAuthor author={item.createdBy} backTo={`/gantry/${item.uid}`} />
      </div>
    </>
  );
}

interface Props extends CardContentProps {}

export function RoadmapCard({ item, canUpvote, onUpvoteToggle }: Props) {
  const cardNavigate = useGantryCardNavigate(item.uid);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.uid,
    data: { stage: item.stage },
  });

  const style = {
    transform: isDragging ? undefined : CSS.Translate.toString(transform),
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <article
      ref={setNodeRef}
      className={s.card}
      style={style}
      {...listeners}
      {...attributes}
      {...cardNavigate}
      onClick={(e) => {
        if (isDragging) return;
        cardNavigate.onClick(e);
      }}
    >
      <RoadmapCardContent item={item} canUpvote={canUpvote} onUpvoteToggle={onUpvoteToggle} />
    </article>
  );
}

interface DragOverlayProps extends CardContentProps {
  readonly width?: number;
}

export function RoadmapCardDragOverlay({ item, width, canUpvote, onUpvoteToggle }: DragOverlayProps) {
  return (
    <article className={s.cardDragOverlay} style={width ? { width } : undefined}>
      <RoadmapCardContent item={item} canUpvote={canUpvote} onUpvoteToggle={onUpvoteToggle} />
    </article>
  );
}

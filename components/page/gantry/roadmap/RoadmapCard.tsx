'use client';

import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { clsx } from 'clsx';
import type { GantryItem } from '@/services/gantry/types';
import { truncateText } from '@/utils/forum';
import { GantryItemAuthor } from '../shared/GantryItemAuthor';
import { PinButton } from '../shared/PinButton';
import { UpvoteButton } from '../shared/UpvoteButton';
import { useGantryCardNavigate } from '../shared/useGantryCardNavigate';
import s from './Roadmap.module.scss';

const CARD_DESCRIPTION_MAX_LENGTH = 160;

/** Strip HTML tags and decode the common entities Quill emits, yielding readable plain text. */
function toPlainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

interface CardContentProps {
  readonly item: GantryItem;
  readonly position?: number;
  readonly dragHandleProps?: SyntheticListenerMap;
  readonly canUpvote: boolean;
  readonly onUpvoteToggle: (uid: string, next: boolean) => void;
  readonly canPin: boolean;
  readonly onPinToggle: (uid: string, next: boolean, el: HTMLButtonElement) => void;
  readonly isPinDisabled: boolean;
}

function RoadmapCardContent({
  item,
  position,
  dragHandleProps,
  canUpvote,
  onUpvoteToggle,
  canPin,
  onPinToggle,
  isPinDisabled,
}: CardContentProps) {
  const descriptionPreview = truncateText(toPlainText(item.description ?? ''), CARD_DESCRIPTION_MAX_LENGTH);
  const interactionLocked = item.stage === 'IN_PROGRESS' || item.stage === 'SHIPPED' || item.stage === 'DECLINED';
  return (
    <>
      <div className={s.cardTopRow}>
        <div className={s.cardPositionBadge}>
          {dragHandleProps && (
            <button
              type="button"
              className={s.dragHandle}
              {...dragHandleProps}
              onClick={(e) => e.stopPropagation()}
              aria-label="Drag to reorder"
            >
              <DragGripIcon />
            </button>
          )}
          {position !== undefined && item.stage !== 'IDEA' && item.stage !== 'SHIPPED' && item.stage !== 'DECLINED' && (
            <span className={clsx(s[`cardPosition_${item.stage}`])}>#{position}</span>
          )}
        </div>
        <h3 className={s.cardTitle}>{item.title}</h3>
        {item.objective && (
          <span className={s.objectiveBadge}>
            <span className={s.objectiveDot} aria-hidden />
            {item.objective.code}
          </span>
        )}
      </div>

      {descriptionPreview && <p className={s.cardDescription}>{descriptionPreview}</p>}

      {item.tags && item.tags.length > 0 && (
        <div className={s.cardTags} aria-label={`Tags: ${item.tags.join(', ')}`}>
          {item.tags.map((tag) => (
            <span key={tag} className={s.cardTagChip}>{tag}</span>
          ))}
        </div>
      )}

      {item.type && (
        <div className={s.cardTypeBadge} aria-label={`Type: ${item.type}`}>
          {item.type}
        </div>
      )}

      <div className={s.meta}>
        <GantryItemAuthor author={item.createdBy} backTo={`/gantry/${item.uid}`} />
        <div className={s.cardActions}>
          <UpvoteButton
            count={item.upvoteCount}
            hasUpvoted={item.viewerHasUpvoted}
            readonly={interactionLocked}
            disabled={!canUpvote}
            onToggle={(next) => onUpvoteToggle(item.uid, next)}
          />
          <PinButton
            count={item.pinCount}
            hasPinned={item.viewerHasPinned}
            readonly={interactionLocked}
            disabled={isPinDisabled}
            onToggle={(next, el) => onPinToggle(item.uid, next, el)}
          />
        </div>
      </div>

      {item.stage === 'SHIPPED' && item.pinCount > 0 && (
        <p className={s.cardFrozenNote}>Counts frozen — entered with {item.pinCount} pins</p>
      )}
    </>
  );
}

interface Props extends CardContentProps {
  readonly isAdminOrdering: boolean;
}

export function RoadmapCard({
  item,
  position,
  isAdminOrdering,
  canUpvote,
  onUpvoteToggle,
  canPin,
  onPinToggle,
  isPinDisabled,
}: Props) {
  const cardNavigate = useGantryCardNavigate(item.uid);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.uid,
    data: { stage: item.stage },
  });

  const style = {
    transform: isDragging ? undefined : CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <article
      ref={setNodeRef}
      className={clsx(s.card, isAdminOrdering && s.cardOrdering)}
      style={style}
      {...attributes}
      {...cardNavigate}
      onClick={(e) => {
        if (isDragging) return;
        cardNavigate.onClick(e);
      }}
    >
      <RoadmapCardContent
        item={item}
        position={position}
        dragHandleProps={isAdminOrdering ? listeners : undefined}
        canUpvote={canUpvote}
        onUpvoteToggle={onUpvoteToggle}
        canPin={canPin}
        onPinToggle={onPinToggle}
        isPinDisabled={isPinDisabled}
      />
    </article>
  );
}

interface DragOverlayProps extends CardContentProps {
  readonly width?: number;
}

export function RoadmapCardDragOverlay({ item, width, position, canUpvote, onUpvoteToggle, canPin, onPinToggle, isPinDisabled }: DragOverlayProps) {
  return (
    <article className={s.cardDragOverlay} style={width ? { width } : undefined}>
      <RoadmapCardContent
        item={item}
        position={position}
        canUpvote={canUpvote}
        onUpvoteToggle={onUpvoteToggle}
        canPin={canPin}
        onPinToggle={onPinToggle}
        isPinDisabled={isPinDisabled}
      />
    </article>
  );
}

function DragGripIcon() {
  return (
    <svg width="10" height="14" viewBox="0 0 10 14" fill="none" aria-hidden>
      <circle cx="2" cy="2" r="1.5" fill="currentColor" />
      <circle cx="8" cy="2" r="1.5" fill="currentColor" />
      <circle cx="2" cy="7" r="1.5" fill="currentColor" />
      <circle cx="8" cy="7" r="1.5" fill="currentColor" />
      <circle cx="2" cy="12" r="1.5" fill="currentColor" />
      <circle cx="8" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

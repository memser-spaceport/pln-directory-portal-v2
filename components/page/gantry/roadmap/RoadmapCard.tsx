'use client';

import { useState } from 'react';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Menu } from '@base-ui-components/react/menu';
import { clsx } from 'clsx';
import type { GantryItem } from '@/services/gantry/types';
import { truncateText } from '@/utils/forum';
import { BoostersSection } from '../shared/BoostersSection';
import { GantryItemAuthor } from '../shared/GantryItemAuthor';
import { BoostButton } from '../shared/BoostButton';
import { StageBadge } from '../shared/StageBadge';
import { useGantryCardNavigate } from '../shared/useGantryCardNavigate';
import type { RoadmapColumnStage } from './RoadmapFilters';
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
  readonly showDragIndicator?: boolean;
  readonly canPin: boolean;
  readonly onPinToggle: (uid: string, next: boolean, el: HTMLButtonElement) => void;
  readonly isPinDisabled: boolean;
  readonly canCurate: boolean;
  readonly warnPinOrder?: boolean;
  readonly onMoveToStage?: (targetStage: RoadmapColumnStage) => void;
  readonly availableStages?: RoadmapColumnStage[];
  readonly isTransitionPending?: boolean;
}

function RoadmapCardContent({
  item,
  position,
  dragHandleProps,
  showDragIndicator,
  canPin,
  onPinToggle,
  isPinDisabled,
  canCurate,
  warnPinOrder,
  onMoveToStage,
  availableStages,
  isTransitionPending,
}: CardContentProps) {
  const descriptionPreview = truncateText(toPlainText(item.description ?? ''), CARD_DESCRIPTION_MAX_LENGTH);
  const interactionLocked = item.stage === 'IN_PROGRESS' || item.stage === 'SHIPPED' || item.stage === 'DECLINED';
  return (
    <>
      <div className={s.cardTopRow}>
        <div className={s.cardPositionBadge}>
          {dragHandleProps ? (
            <button
              type="button"
              className={s.dragHandle}
              {...dragHandleProps}
              onClick={(e) => e.stopPropagation()}
              aria-label="Drag to move"
            >
              <DragGripIcon />
            </button>
          ) : showDragIndicator ? (
            <span className={s.dragHandle} aria-hidden>
              <DragGripIcon />
            </span>
          ) : null}
          {position !== undefined && item.stage !== 'IDEA' && item.stage !== 'SHIPPED' && item.stage !== 'DECLINED' && (
            <span className={clsx(s[`cardPosition_${item.stage}`])}>#{position}</span>
          )}
        </div>
        <h3 className={s.cardTitle}>{item.title}</h3>
        {item.objective && (
          <span className={s.objectiveBadge}>
            <span className={s.objectiveDot} aria-hidden />O{item.objective.order}
          </span>
        )}
      </div>

      {descriptionPreview && <p className={s.cardDescription}>{descriptionPreview}</p>}

      {item.tags && item.tags.length > 0 && (
        <div className={s.cardTags} aria-label={`Tags: ${item.tags.join(', ')}`}>
          {item.tags.map((tag) => (
            <span key={tag} className={s.cardTagChip}>
              {tag}
            </span>
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
        {item.stage !== 'BACKLOG' && (
          <div className={s.cardActions}>
            <BoostButton
              count={item.pinCount}
              hasPinned={item.viewerHasPinned}
              readonly={interactionLocked}
              disabled={isPinDisabled}
              onToggle={(next, el) => onPinToggle(item.uid, next, el)}
            />
          </div>
        )}
      </div>

      {onMoveToStage && availableStages && availableStages.length > 0 && (
        <MobileCardStagePicker
          availableStages={availableStages}
          onSelect={onMoveToStage}
          disabled={isTransitionPending}
        />
      )}

      {warnPinOrder && position !== undefined && canCurate && (
        <div className={s.boostOrderWarning}>
          <WarningIcon />
          <span>
            High demand ({item.pinCount} boosts) vs. rank #{position} — revisit?
          </span>
        </div>
      )}

      {item.stage === 'IN_PROGRESS' && (
        <p className={s.cardFrozenNote}>
          <span className={s.cardFrozenBullet}>*</span> Count frozen — entered with {item.pinCount ?? 0} boosts
        </p>
      )}

      {(item.stage === 'SHIPPED' || item.stage === 'DECLINED') && (
        <p className={s.cardFinalNote}>
          <ClockIcon />
          {item.stage === 'SHIPPED' ? 'Shipped' : 'Declined'} — final: {item.pinCount ?? 0} boosts
        </p>
      )}

      {canCurate && item.pinCount > 0 && <BoostersSection item={item} />}
    </>
  );
}

interface Props extends CardContentProps {
  readonly isAdminOrdering: boolean;
  readonly canDrag: boolean;
  readonly isMobile?: boolean;
}

export function RoadmapCard({
  item,
  position,
  isAdminOrdering,
  canDrag,
  isMobile,
  canPin,
  onPinToggle,
  isPinDisabled,
  canCurate,
  warnPinOrder,
  onMoveToStage,
  availableStages,
  isTransitionPending,
}: Props) {
  const cardNavigate = useGantryCardNavigate(item.uid);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.uid,
    data: { stage: item.stage },
    disabled: !canDrag,
  });

  const style = {
    transform: isDragging ? undefined : CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    // Required for dnd-kit TouchSensor: without this the browser's scroll handler
    // claims the touch gesture before the 300ms delay can complete.
    ...(isMobile && canDrag ? { touchAction: 'none' as const } : {}),
  };

  return (
    <article
      ref={setNodeRef}
      className={clsx(s.card, canDrag && s.cardOrdering)}
      style={style}
      {...attributes}
      // On mobile: listeners on the card container so long-press anywhere activates drag.
      // On desktop: listeners go to the drag handle button via dragHandleProps.
      {...(isMobile && canDrag ? listeners : {})}
      {...cardNavigate}
      onClick={(e) => {
        if (isDragging) return;
        cardNavigate.onClick(e);
      }}
    >
      <RoadmapCardContent
        item={item}
        position={position}
        dragHandleProps={!isMobile && canDrag ? listeners : undefined}
        showDragIndicator={isMobile && canDrag}
        canPin={canPin}
        onPinToggle={onPinToggle}
        isPinDisabled={isPinDisabled}
        canCurate={canCurate}
        warnPinOrder={warnPinOrder}
        onMoveToStage={onMoveToStage}
        availableStages={availableStages}
        isTransitionPending={isTransitionPending}
      />
    </article>
  );
}

interface DragOverlayProps extends CardContentProps {
  readonly width?: number;
}

export function RoadmapCardDragOverlay({
  item,
  width,
  position,
  canPin,
  onPinToggle,
  isPinDisabled,
  canCurate,
  warnPinOrder,
}: DragOverlayProps) {
  return (
    <article className={s.cardDragOverlay} style={width ? { width } : undefined}>
      <RoadmapCardContent
        item={item}
        position={position}
        canPin={canPin}
        onPinToggle={onPinToggle}
        isPinDisabled={isPinDisabled}
        canCurate={canCurate}
        warnPinOrder={warnPinOrder}
      />
    </article>
  );
}

function MobileCardStagePicker({
  availableStages,
  onSelect,
  disabled,
}: {
  availableStages: RoadmapColumnStage[];
  onSelect: (stage: RoadmapColumnStage) => void;
  disabled?: boolean;
}) {
  return (
    <Menu.Root>
      <Menu.Trigger
        className={s.moveToStageButton}
        disabled={disabled}
        onClick={(e) => e.stopPropagation()}
        aria-label="Move to stage"
      >
        <MoveStageIcon />
        Move
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner className={s.moveToStagePositioner} sideOffset={4} align="start">
          <Menu.Popup className={s.moveToStageMenu}>
            <div className={s.moveToStageMenuHint}>Move to</div>
            {availableStages.map((stage) => (
              <Menu.Item
                key={stage}
                className={s.moveToStageMenuItem}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(stage);
                }}
              >
                <StageBadge stage={stage} />
              </Menu.Item>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

function MoveStageIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M2 6h8M7 3l3 3-3 3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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

function ClockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M6 3.5V6l1.75 1.75"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M7 1.5L13 12.5H1L7 1.5Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
      <path d="M7 5.5V8" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <circle cx="7" cy="10.25" r="0.75" fill="currentColor" />
    </svg>
  );
}

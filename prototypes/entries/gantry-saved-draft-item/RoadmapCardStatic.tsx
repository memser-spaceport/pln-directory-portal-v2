'use client';

// Prototype-local copy of the production roadmap card body (per prototypes/README "copy & simplify").
// It reuses production styles + presentational sub-components by import (read-only), but drops the
// data-bound BoostersSection so this prototype stays fully mocked. Keeps production files untouched.

import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import { clsx } from 'clsx';
import type { GantryItem } from '@/services/gantry/types';
import { truncateText } from '@/utils/forum';
import { GantryItemAuthor } from '@/components/page/gantry/shared/GantryItemAuthor';
import { BoostButton } from '@/components/page/gantry/shared/BoostButton';
import s from '@/components/page/gantry/roadmap/Roadmap.module.scss';

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

export interface CardContentProps {
  readonly item: GantryItem;
  readonly position?: number;
  readonly dragHandleProps?: SyntheticListenerMap;
  readonly canPin: boolean;
  readonly onPinToggle: (uid: string, next: boolean, el: HTMLButtonElement) => void;
  readonly isPinDisabled: boolean;
  readonly canCurate: boolean;
  readonly warnPinOrder?: boolean;
}

export function RoadmapCardContent({
  item,
  position,
  dragHandleProps,
  canPin,
  onPinToggle,
  isPinDisabled,
  canCurate,
  warnPinOrder,
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
              aria-label="Drag to move"
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
            {/* Inline style forces a perfect 6px circle regardless of flex/CSS-module quirks. */}
            <span
              aria-hidden
              style={{
                display: 'inline-block',
                flex: '0 0 auto',
                alignSelf: 'center',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'currentColor',
              }}
            />
            O{item.objective.order}
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
    </>
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
      <path d="M6 3.5V6l1.75 1.75" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
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

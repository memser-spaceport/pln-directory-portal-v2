'use client';

import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { clsx } from 'clsx';
import type { GantryItem } from '@/services/gantry/types';
import { useGantryItemPins } from '@/services/gantry/hooks/useGantryItemPins';
import { truncateText } from '@/utils/forum';
import { GantryItemAuthor } from '../shared/GantryItemAuthor';
import { PinButton } from '../shared/PinButton';
import { UpvoteButton } from '../shared/UpvoteButton';
import { useGantryCardNavigate } from '../shared/useGantryCardNavigate';
import s from './Roadmap.module.scss';

const AVATAR_COLORS = [
  { bg: '#dbeafe', text: '#1d4ed8' },
  { bg: '#dcfce7', text: '#15803d' },
  { bg: '#ede9fe', text: '#6d28d9' },
  { bg: '#fce7f3', text: '#9d174d' },
  { bg: '#fef3c7', text: '#92400e' },
  { bg: '#e0f2fe', text: '#0369a1' },
];
function avatarColor(name: string) {
  const h = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

const MAX_PINNERS_VISIBLE = 3;

function CardPinnersSection({ item }: { item: GantryItem }) {
  const { data: pinners = [], isLoading } = useGantryItemPins(item.uid, item.pinCount > 0);
  if (isLoading) return <div className={s.pinnersLoading}>Loading pinners…</div>;
  if (pinners.length === 0) return null;
  const visible = pinners.slice(0, MAX_PINNERS_VISIBLE);
  const hasMore = item.pinCount > MAX_PINNERS_VISIBLE;
  return (
    <div className={s.pinnersSection}>
      <div className={s.pinnersHeader}>
        <LockIcon />
        <span>{item.pinCount} PINNED · TEAM-ONLY</span>
      </div>
      {visible.map((p) => {
        const c = avatarColor(p.member.name);
        return (
          <div key={p.uid} className={s.pinnerRow}>
            <span className={s.pinnerAvatar} style={{ background: c.bg, color: c.text }}>
              {initials(p.member.name)}
            </span>
            <div className={s.pinnerInfo}>
              <span className={s.pinnerName}>{p.member.name}</span>
              {p.note ? (
                <span className={s.pinnerNote}>{p.note}</span>
              ) : (
                <span className={s.pinnerNoNote}>No note</span>
              )}
            </div>
          </div>
        );
      })}
      {hasMore && (
        <button type="button" className={s.showAllPinners} onClick={(e) => e.stopPropagation()}>
          Show all {item.pinCount} pinners &amp; notes
        </button>
      )}
    </div>
  );
}

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
  readonly canCurate: boolean;
  readonly warnPinOrder?: boolean;
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
            {item.objective.title}
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

      {warnPinOrder && position !== undefined && (
        <div className={s.pinOrderWarning}>
          <WarningIcon />
          <span>
            High demand ({item.pinCount} pins) vs. rank #{position} — revisit?
          </span>
        </div>
      )}

      {item.stage === 'IN_PROGRESS' && (
        <p className={s.cardFrozenNote}>
          <span className={s.cardFrozenBullet}>*</span> Counts frozen — entered with {item.pinCount ?? 0} pins
        </p>
      )}

      {(item.stage === 'SHIPPED' || item.stage === 'DECLINED') && (
        <p className={s.cardFinalNote}>
          <ClockIcon />
          {item.stage === 'SHIPPED' ? 'Shipped' : 'Declined'} — final: {item.upvoteCount} thumbs · {item.pinCount ?? 0}{' '}
          pins
        </p>
      )}

      {canCurate && item.pinCount > 0 && <CardPinnersSection item={item} />}
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
  canCurate,
  warnPinOrder,
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
        canCurate={canCurate}
        warnPinOrder={warnPinOrder}
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
  canUpvote,
  onUpvoteToggle,
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
        canUpvote={canUpvote}
        onUpvoteToggle={onUpvoteToggle}
        canPin={canPin}
        onPinToggle={onPinToggle}
        isPinDisabled={isPinDisabled}
        canCurate={canCurate}
        warnPinOrder={warnPinOrder}
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

function LockIcon() {
  return (
    <svg width="11" height="13" viewBox="0 0 11 13" fill="none" aria-hidden>
      <rect x="1.5" y="5.5" width="8" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.25" />
      <path d="M3.5 5.5V3.5a2 2 0 0 1 4 0v2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <circle cx="5.5" cy="9" r="1" fill="currentColor" />
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

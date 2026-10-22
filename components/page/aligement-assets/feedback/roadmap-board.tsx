'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FeedbackItem,
  FeedbackStatus,
  ROADMAP_COLUMNS,
  RoadmapColumn,
  RoadmapResponse,
  STATUS_LABELS,
} from '@/services/plaa/feedback/feedback.types';
import { StatusBadge, TypeBadge, VoteButton } from './feedback-bits';
import MoveToMenu from './move-to-menu';
import { lastMoveLine } from './feedback.utils';

const MOBILE_BREAKPOINT = 768;
/** §2: 20 cards per column, then "Show more". */
const PAGE_SIZE = 20;

const COLUMN_SUBTITLE: Partial<Record<RoadmapColumn, string>> = {
  completed: 'Last 90 days',
};

/**
 * Roadmap Kanban (F-5). Public features and improvements only — bugs never
 * reach this view, which the service already guarantees.
 *
 * Under 768px the four columns become tabs (AC-T7.7) rather than a horizontal
 * scroll, so a phone shows one full column instead of four clipped ones.
 */
export default function RoadmapBoard({
  roadmap,
  isAdmin,
  onVote,
  onMove,
  votesRemaining,
}: {
  roadmap: RoadmapResponse;
  isAdmin: boolean;
  onVote: (item: FeedbackItem) => void;
  onMove: (id: string, toStatus: FeedbackStatus, note?: string, duplicateOfId?: string) => void;
  votesRemaining?: number;
}) {
  const [isNarrow, setIsNarrow] = useState(false);
  const [activeColumn, setActiveColumn] = useState<RoadmapColumn>('under_review');
  const [shown, setShown] = useState<Record<string, number>>({});

  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const sync = () => setIsNarrow(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  const visibleColumns = isNarrow ? [activeColumn] : ROADMAP_COLUMNS;

  return (
    <div className="fb-board">
      {isNarrow && (
        <div className="fb-board__tabs" role="tablist" aria-label="Roadmap columns">
          {ROADMAP_COLUMNS.map((status) => (
            <button
              key={status}
              type="button"
              role="tab"
              aria-selected={activeColumn === status}
              id={`fb-board-tab-${status}`}
              aria-controls={`fb-board-panel-${status}`}
              className={`fb-board__tab ${activeColumn === status ? 'fb-board__tab--active' : ''}`}
              onClick={() => setActiveColumn(status)}
            >
              {STATUS_LABELS[status]} ({roadmap[status]?.length ?? 0})
            </button>
          ))}
        </div>
      )}

      <div className={`fb-board__columns ${isNarrow ? 'fb-board__columns--single' : ''}`}>
        {visibleColumns.map((status) => {
          const all: FeedbackItem[] = roadmap[status] ?? [];
          const limit = shown[status] ?? PAGE_SIZE;
          const items = all.slice(0, limit);

          return (
            <section
              key={status}
              className="fb-col"
              aria-label={STATUS_LABELS[status]}
              // Narrow: the column IS the tab's panel. Wide: four peer regions.
              {...(isNarrow
                ? { role: 'tabpanel', id: `fb-board-panel-${status}`, 'aria-labelledby': `fb-board-tab-${status}` }
                : {})}
            >
              <header className="fb-col__head">
                <h3 className="fb-col__title">{STATUS_LABELS[status]}</h3>
                <span className="fb-col__count">{all.length}</span>
              </header>
              {COLUMN_SUBTITLE[status] && <p className="fb-col__sub">{COLUMN_SUBTITLE[status]}</p>}

              {items.length === 0 ? (
                <p className="fb-col__empty">Nothing here yet.</p>
              ) : (
                <ul className="fb-col__list">
                  {items.map((item) => (
                    <li key={item.id} className="fb-card" data-testid={`fb-card-${item.id}`}>
                      <div className="fb-card__badges">
                        <TypeBadge type={item.type} />
                        <StatusBadge status={item.status} />
                      </div>
                      <Link href={`/alignment-asset/feedback/${item.id}`} className="fb-card__title">
                        {item.title}
                      </Link>
                      <div className="fb-card__foot">
                        <VoteButton item={item} onToggle={() => onVote(item)} votesRemaining={votesRemaining} />
                        <span className="fb-card__comments">
                          <span aria-hidden="true">💬</span> {item.comment_count}
                        </span>
                        {isAdmin && (
                          <MoveToMenu
                            currentStatus={item.status}
                            idPrefix={`fb-card-${item.id}`}
                            onMove={(toStatus, note, duplicateOfId) => onMove(item.id, toStatus, note, duplicateOfId)}
                          />
                        )}
                      </div>
                      <p className="fb-card__moved">{lastMoveLine(item.status, item.status_changed_at)}</p>
                    </li>
                  ))}
                </ul>
              )}

              {all.length > limit && (
                <button
                  type="button"
                  className="fb-btn fb-btn--ghost fb-btn--sm"
                  onClick={() => setShown((current) => ({ ...current, [status]: limit + PAGE_SIZE }))}
                >
                  Show more
                </button>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

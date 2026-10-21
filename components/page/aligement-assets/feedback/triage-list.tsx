'use client';

import Link from 'next/link';
import { FeedbackItem, FeedbackStatus } from '@/services/plaa/feedback/feedback.types';
import { EmptyState, StatusBadge, TypeBadge } from './feedback-bits';
import MoveToMenu from './move-to-menu';
import { relativeAge } from './feedback.utils';

/**
 * Triage (F-8), admins only. Oldest first, because the point is the queue.
 *
 * Each row surfaces the Linear state: an identifier link once the issue exists,
 * otherwise pending/failed with a Retry — the only place the board admits
 * Linear exists.
 */
export default function TriageList({
  items,
  onMove,
  onRetryLinear,
  retryingId,
}: {
  items: FeedbackItem[];
  onMove: (id: string, toStatus: FeedbackStatus, note?: string, duplicateOfId?: string) => void;
  onRetryLinear: (id: string) => void;
  retryingId?: string;
}) {
  if (!items.length) {
    return <EmptyState message="Nothing waiting for triage." />;
  }

  return (
    <ul className="fb-list">
      {items.map((item) => (
        <li key={item.id} className="fb-row fb-row--triage" data-testid={`fb-triage-${item.id}`}>
          <div className="fb-row__main">
            <Link href={`/alignment-asset/feedback/${item.id}`} className="fb-row__title">
              {item.title}
            </Link>
            <div className="fb-row__meta">
              <TypeBadge type={item.type} />
              <StatusBadge status={item.status} />
              {!item.is_public && <span className="fb-badge fb-badge--muted">Private</span>}
              <span className="fb-row__age">{relativeAge(item.created_at)}</span>
            </div>
          </div>

          <div className="fb-row__linear">
            {item.linear_status === 'created' && item.linear_issue_url ? (
              <a
                className="fb-linear-link"
                href={item.linear_issue_url}
                target="_blank"
                rel="noreferrer"
                data-testid={`fb-linear-${item.id}`}
              >
                {item.linear_issue_identifier}
              </a>
            ) : (
              <span className="fb-linear-state" data-testid={`fb-linear-${item.id}`}>
                Linear: {item.linear_status ?? 'pending'}
                <button
                  type="button"
                  className="fb-btn fb-btn--ghost fb-btn--sm"
                  onClick={() => onRetryLinear(item.id)}
                  disabled={retryingId === item.id}
                  data-testid={`fb-linear-retry-${item.id}`}
                >
                  {retryingId === item.id ? 'Retrying…' : 'Retry'}
                </button>
              </span>
            )}
          </div>

          <MoveToMenu
            currentStatus={item.status}
            idPrefix={`fb-triage-${item.id}`}
            onMove={(toStatus, note, duplicateOfId) => onMove(item.id, toStatus, note, duplicateOfId)}
          />
        </li>
      ))}
    </ul>
  );
}

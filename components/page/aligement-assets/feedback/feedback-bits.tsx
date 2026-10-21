'use client';

import {
  FeedbackItem,
  FeedbackStatus,
  FeedbackType,
  STATUS_LABELS,
  TYPE_LABELS,
} from '@/services/plaa/feedback/feedback.types';
import { canVote, voteDisabledReason } from './feedback.utils';

const STATUS_TONE: Record<FeedbackStatus, string> = {
  under_review: 'fb-badge--slate',
  todo: 'fb-badge--blue',
  in_progress: 'fb-badge--amber',
  completed: 'fb-badge--green',
  declined: 'fb-badge--muted',
  duplicate: 'fb-badge--muted',
};

export function StatusBadge({ status }: { status: FeedbackStatus }) {
  return <span className={`fb-badge ${STATUS_TONE[status]}`}>{STATUS_LABELS[status]}</span>;
}

export function TypeBadge({ type }: { type: FeedbackType }) {
  return <span className={`fb-badge fb-badge--type fb-badge--${type}`}>{TYPE_LABELS[type]}</span>;
}

/**
 * Vote control. `aria-pressed` carries the state (AC-T6.3); on a closed item the
 * button is disabled and says why rather than silently doing nothing.
 */
export function VoteButton({
  item,
  onToggle,
  pending,
}: {
  item: FeedbackItem;
  onToggle: () => void;
  pending?: boolean;
}) {
  const votable = canVote(item.status);
  const reason = votable ? '' : voteDisabledReason(item.status);

  return (
    <button
      type="button"
      className={`fb-vote ${item.has_voted ? 'fb-vote--on' : ''}`}
      aria-pressed={item.has_voted}
      aria-label={`${item.has_voted ? 'Remove your vote from' : 'Vote for'} ${item.title}`}
      disabled={!votable || pending}
      title={reason || undefined}
      onClick={onToggle}
      data-testid={`fb-vote-${item.id}`}
    >
      <span className="fb-vote__arrow" aria-hidden="true">
        ▲
      </span>
      <span className="fb-vote__count">{item.vote_count}</span>
    </button>
  );
}

export function EmptyState({ message, action }: { message: string; action?: React.ReactNode }) {
  return (
    <div className="fb-empty">
      <p className="fb-empty__text">{message}</p>
      {action}
    </div>
  );
}

export function LoadingRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="fb-skeletons" aria-busy="true" aria-live="polite" data-testid="fb-loading">
      <span className="fb-sr-only">Loading feedback</span>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="fb-skeleton" />
      ))}
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="fb-empty" role="alert">
      <p className="fb-empty__text">We couldn&apos;t load this just now.</p>
      <button type="button" className="fb-btn fb-btn--ghost" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}

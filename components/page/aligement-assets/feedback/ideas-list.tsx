'use client';

import Link from 'next/link';
import { FeedbackItem } from '@/services/plaa/feedback/feedback.types';
import MemberDisplay from './member-display';
import { EmptyState, StatusBadge, TypeBadge, VoteButton } from './feedback-bits';
import { relativeAge } from './feedback.utils';

export default function IdeasList({
  items,
  onVote,
  emptyMessage,
  emptyAction,
  showPrivateMarker,
  votesRemaining,
}: {
  items: FeedbackItem[];
  onVote: (item: FeedbackItem) => void;
  emptyMessage: string;
  emptyAction?: React.ReactNode;
  votesRemaining?: number;
  showPrivateMarker?: boolean;
}) {
  if (!items.length) {
    return <EmptyState message={emptyMessage} action={emptyAction} />;
  }

  return (
    <ul className="fb-list">
      {items.map((item) => (
        <li key={item.id} className="fb-row">
          <VoteButton item={item} onToggle={() => onVote(item)} votesRemaining={votesRemaining} />

          <div className="fb-row__main">
            <Link href={`/alignment-asset/feedback/${item.id}`} className="fb-row__title">
              {item.title}
            </Link>
            <div className="fb-row__meta">
              <TypeBadge type={item.type} />
              <StatusBadge status={item.status} />
              {showPrivateMarker && !item.is_public && <span className="fb-badge fb-badge--muted">Private</span>}
              <MemberDisplay author={item.author} size="sm" />
              <span className="fb-row__age">{relativeAge(item.created_at)}</span>
            </div>
          </div>

          <span className="fb-row__comments" title={`${item.comment_count} comments`}>
            <span aria-hidden="true">💬</span> {item.comment_count}
          </span>
        </li>
      ))}
    </ul>
  );
}

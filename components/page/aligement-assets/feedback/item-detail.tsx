'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FeedbackComment,
  FeedbackItem,
  FeedbackStatus,
  STATUS_LABELS,
} from '@/services/plaa/feedback/feedback.types';
import MemberDisplay from './member-display';
import MoveToMenu from './move-to-menu';
import { StatusBadge, TypeBadge, VoteButton } from './feedback-bits';
import { formatDate, relativeAge } from './feedback.utils';

const COMMENT_MAX = 2000;

/**
 * Item detail (F-4). Everything a member needs to judge an idea: what it is,
 * where it stands, who moved it and why, and what others said.
 */
export default function ItemDetail({
  item,
  comments,
  isAdmin,
  currentMemberUid,
  onVote,
  onComment,
  onDeleteComment,
  onHideComment,
  onMove,
  onRetryLinear,
  commentPending,
  votesRemaining,
}: {
  item: FeedbackItem;
  comments: FeedbackComment[];
  isAdmin: boolean;
  currentMemberUid?: string;
  onVote: () => void;
  onComment: (body: string) => void;
  onDeleteComment: (commentId: string) => void;
  onHideComment: (commentId: string, hidden: boolean) => void;
  onMove: (toStatus: FeedbackStatus, note?: string, duplicateOfId?: string) => void;
  onRetryLinear: () => void;
  commentPending?: boolean;
  votesRemaining?: number;
}) {
  const [draft, setDraft] = useState('');

  const sinceLine =
    item.status === 'in_progress' || item.status === 'completed'
      ? `${STATUS_LABELS[item.status]} since ${formatDate(item.status_changed_at)}`
      : null;

  return (
    <article className="fb-detail">
      {item.duplicate_of && (
        <div className="fb-duplicate" role="status">
          Merged into{' '}
          <Link href={`/alignment-asset/feedback/${item.duplicate_of.id}`}>{item.duplicate_of.title}</Link>.
        </div>
      )}

      <header className="fb-detail__head">
        <div className="fb-detail__badges">
          <TypeBadge type={item.type} />
          <StatusBadge status={item.status} />
          {!item.is_public && <span className="fb-badge fb-badge--muted">Private</span>}
        </div>
        <h1 className="fb-detail__title">{item.title}</h1>
        <div className="fb-detail__byline">
          <MemberDisplay author={item.author} size="sm" />
          <span className="fb-detail__date">{relativeAge(item.created_at)}</span>
          {sinceLine && <span className="fb-detail__since">{sinceLine}</span>}
        </div>
      </header>

      <div className="fb-detail__body">
        <p className="fb-detail__description">{item.description}</p>

        {item.importance && (
          <section className="fb-detail__section">
            <h2 className="fb-detail__h2">Why it&apos;s important</h2>
            <p>{item.importance}</p>
          </section>
        )}

        {item.link_url && (
          <p className="fb-detail__link">
            <a href={item.link_url} target="_blank" rel="noreferrer">
              {item.link_url}
            </a>
          </p>
        )}

        {/* §6: the count only. The images live in Linear, never on the board. */}
        {item.screenshot_count > 0 && (
          <p className="fb-detail__screenshots">
            {item.screenshot_count} screenshot{item.screenshot_count === 1 ? '' : 's'} sent to the PLAA team
          </p>
        )}

        <VoteButton item={item} onToggle={onVote} votesRemaining={votesRemaining} />
      </div>

      {item.status_events && item.status_events.length > 0 && (
        <section className="fb-timeline" aria-label="Status timeline">
          <h2 className="fb-detail__h2">Timeline</h2>
          <ol className="fb-timeline__list">
            {item.status_events.map((event, index) => (
              <li key={`${event.created_at}-${index}`} className="fb-timeline__row">
                <span className="fb-timeline__dot" aria-hidden="true" />
                <div>
                  <p className="fb-timeline__label">
                    {event.from_status ? `Moved to ${STATUS_LABELS[event.to_status]}` : 'Submitted'}
                    <span className="fb-timeline__date"> · {formatDate(event.created_at)}</span>
                  </p>
                  {event.note && <p className="fb-timeline__note">{event.note}</p>}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {isAdmin && (
        <section className="fb-admin" aria-label="Admin controls">
          <h2 className="fb-detail__h2">PLAA team</h2>
          <div className="fb-admin__row">
            <MoveToMenu currentStatus={item.status} idPrefix="fb-detail" onMove={onMove} />
            {item.linear_status === 'created' && item.linear_issue_url ? (
              <a className="fb-linear-link" href={item.linear_issue_url} target="_blank" rel="noreferrer">
                {item.linear_issue_identifier}
              </a>
            ) : (
              <span className="fb-linear-state">
                Linear: {item.linear_status ?? 'pending'}
                <button type="button" className="fb-btn fb-btn--ghost fb-btn--sm" onClick={onRetryLinear}>
                  Retry
                </button>
              </span>
            )}
          </div>
        </section>
      )}

      <section className="fb-comments" aria-label="Comments">
        <h2 className="fb-detail__h2">Comments ({item.comment_count})</h2>

        <ul className="fb-comments__list">
          {comments.map((comment) => (
            <li key={comment.id} className="fb-comment" data-testid={`fb-comment-${comment.id}`}>
              {comment.hidden && !comment.body ? (
                <p className="fb-comment__hidden">Comment hidden by a moderator</p>
              ) : (
                <>
                  <div className="fb-comment__head">
                    {comment.author && (
                      <MemberDisplay
                        author={comment.author}
                        size="sm"
                        badge={comment.is_admin_author ? 'PLAA team' : undefined}
                      />
                    )}
                    <span className="fb-comment__date">{relativeAge(comment.created_at)}</span>
                  </div>
                  <p className="fb-comment__body">{comment.body}</p>
                  <div className="fb-comment__actions">
                    {comment.author?.member_uid === currentMemberUid && (
                      <button
                        type="button"
                        className="fb-linkbtn"
                        onClick={() => onDeleteComment(comment.id)}
                        data-testid={`fb-comment-delete-${comment.id}`}
                      >
                        Delete
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        type="button"
                        className="fb-linkbtn"
                        onClick={() => onHideComment(comment.id, !comment.hidden)}
                      >
                        {comment.hidden ? 'Unhide' : 'Hide'}
                      </button>
                    )}
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>

        {item.status === 'duplicate' ? (
          <p className="fb-help">This item was merged. Add your comment on the canonical item instead.</p>
        ) : (
          <form
            className="fb-composer"
            onSubmit={(event) => {
              event.preventDefault();
              if (!draft.trim()) return;
              onComment(draft.trim());
              setDraft('');
            }}
          >
            <label className="fb-sr-only" htmlFor="fb-comment-input">
              Add a comment
            </label>
            <textarea
              id="fb-comment-input"
              className="fb-textarea"
              rows={3}
              value={draft}
              maxLength={COMMENT_MAX}
              placeholder="Add a comment"
              onChange={(event) => setDraft(event.target.value)}
            />
            <button
              type="submit"
              className="fb-btn fb-btn--primary"
              disabled={!draft.trim() || commentPending}
            >
              {commentPending ? 'Posting…' : 'Post'}
            </button>
          </form>
        )}
      </section>
    </article>
  );
}

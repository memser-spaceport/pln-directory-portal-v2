'use client';

import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { formatTimeAgo } from '@/utils/formatTimeAgo';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { clampDepth } from '@/utils/comments';
import { useCurrentUserStore } from '@/services/auth/store';
import { useFeedComments } from '@/services/feed/hooks/useFeedComments';
import { useAddFeedComment } from '@/services/feed/hooks/useAddFeedComment';
import { useDeleteFeedComment } from '@/services/feed/hooks/useDeleteFeedComment';
import { FEED_COMMENT_MAX_LENGTH } from '@/services/feed/constants';
import { useTeamNewsAnalytics, type FeedItemKind, type TeamNewsAnalyticsSource } from '@/analytics/team-news.analytics';
import type { IFeedComment } from '@/types/feed.types';

import s from './FeedCommentsThread.module.scss';

// Show at most this many TOP-LEVEL comments before capping behind "View all N …".
const VISIBLE = 2;

// Deepest rendered level, as a depth index — 2 means comment → reply →
// reply-to-reply, the same cap as the forum's CommentItem.MAX_DEPTH. The wire
// allows unlimited depth, so anything deeper is lifted to this level by
// clampDepth rather than indented off the edge of the card.
const MAX_DEPTH = 2;

/** Total comments in the thread, replies included — matches what the count
 *  badge shows (the backend counts every row under an item, at any depth). */
function countComments(comments: readonly IFeedComment[]): number {
  return comments.reduce((total, comment) => total + 1 + countComments(comment.replies), 0);
}

interface FeedCommentsThreadProps {
  itemUid: string;
  kind: FeedItemKind;
  source: TeamNewsAnalyticsSource;
}

/**
 * Inline comment thread + composer for a feed item.
 *
 * The comments come from one of two entirely separate systems, and this
 * component is deliberately blind to which: news comments are directory-native,
 * a forum post's comments are its real NodeBB topic replies. Both arrive as the
 * same `IFeedComment` tree from services/feed/feed.service.ts.
 *
 * Mount = expanded: the parent renders this component only while the thread is
 * open, so the lazy comments query fetches on first expand and, with no
 * observer after collapse, never refetches in the background. All comment
 * text / names / roles render via JSX text interpolation only —
 * dangerouslySetInnerHTML is banned in this component.
 *
 * Composer rules (no toasts, ever):
 * - The in-flight comment renders immediately from the mutation's `variables`
 *   (dimmed) — optimistic via UI, nothing written to the cache until the
 *   server confirms, so there's no rollback to get wrong.
 * - The input is cleared ONLY on success; on failure the draft is simply
 *   still there, with an inline error that clears on the next keystroke.
 * - Submit is guarded in the handler (not just the disabled attribute) so
 *   Enter can't double-fire while a submit is in flight.
 *
 * Delete (author-only, `isOwn`): an inline "Delete this comment? Yes / Cancel"
 * swap on the row — no modal, no toast, matching the composer's style. No
 * optimistic removal: the row shows a disabled Yes while the request is in
 * flight, same "nothing touches the cache until the server confirms" rule the
 * composer follows. Deleting cascades to the comment's replies, server-side and
 * in the cache patch alike. NodeBB-sourced comments always report
 * `isOwn: false`, so the affordance never appears on them.
 */
export function FeedCommentsThread({ itemUid, kind, source }: FeedCommentsThreadProps) {
  const router = useRouter();
  const analytics = useTeamNewsAnalytics();
  const { currentUser, isHydrated } = useCurrentUserStore();
  const [draft, setDraft] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [confirmingUid, setConfirmingUid] = useState<string | null>(null);

  const { data } = useFeedComments(itemUid, { enabled: true });
  const addComment = useAddFeedComment(itemUid);
  const deleteComment = useDeleteFeedComment(itemUid);

  const items = data?.items;
  // Display cap applied once, here: every consumer below can then recurse
  // without re-checking depth.
  const comments = useMemo(() => clampDepth<IFeedComment>(items ?? [], MAX_DEPTH), [items]);
  const totalCount = useMemo(() => countComments(comments), [comments]);

  // Oldest-first data: the most recent VISIBLE comments are the LAST ones, not
  // the first — a plain slice(0, VISIBLE) would show the oldest instead.
  const shown = expanded ? comments : comments.slice(-VISIBLE);

  const requestDelete = (commentUid: string) => {
    if (deleteComment.isPending) return;
    deleteComment.mutate(
      { commentUid },
      {
        onSuccess: () => setConfirmingUid(null),
      },
    );
  };

  const submit = () => {
    const text = draft.trim();
    if (!text || addComment.isPending) return;
    addComment.mutate(
      { text },
      {
        onSuccess: () => {
          // UI-local follow-ups only — the cache writes live in the hook's
          // options callbacks, which survive this component unmounting.
          setDraft('');
          analytics.onFeedCommentSubmitted(itemUid, kind, source);
        },
      },
    );
  };

  const handleDraftChange = (value: string) => {
    setDraft(value);
    // A stale "couldn't post" must not sit above a fresh draft.
    if (addComment.isError) addComment.reset();
  };

  const goToLogin = () => {
    router.push(`${window.location.pathname}${window.location.search}#login`, { scroll: false });
  };

  const pendingText = addComment.isPending ? addComment.variables?.text.trim() : undefined;

  return (
    <div className={s.thread} onClick={(e) => e.stopPropagation()}>
      {/* Composer sits above the list — leave a comment first, then read. */}
      {isHydrated && !currentUser ? (
        <div className={s.signedOut}>
          <span>Join the conversation —</span>
          <button type="button" className={s.signInBtn} onClick={goToLogin}>
            sign in to comment
          </button>
        </div>
      ) : (
        <div className={s.composer}>
          <form
            className={s.inline}
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <input
              className={s.forumField}
              value={draft}
              maxLength={FEED_COMMENT_MAX_LENGTH}
              placeholder="Write your comment here…"
              onChange={(e) => handleDraftChange(e.target.value)}
            />
            <button
              type="submit"
              className={clsx(
                s.primaryBtn,
                s.commentBtn,
                (!draft.trim() || addComment.isPending) && s.commentBtnDisabled,
              )}
              disabled={!draft.trim() || addComment.isPending}
            >
              Comment
            </button>
          </form>
          {addComment.isError && (
            <p className={s.error} role="alert">
              Couldn&apos;t post your comment — try again.
            </p>
          )}
        </div>
      )}

      {(comments.length > 0 || pendingText) && (
        <div className={s.list}>
          {pendingText && (
            <div className={clsx(s.item, s.itemPending)}>
              <img
                className={s.avatar}
                src={currentUser?.profileImageUrl || getDefaultAvatar(currentUser?.name ?? 'You')}
                alt=""
                loading="lazy"
              />
              <div className={s.body}>
                <div className={s.head}>
                  <span className={s.name}>{currentUser?.name ?? 'You'}</span>
                  <span className={s.time}>· posting…</span>
                </div>
                <p className={s.text}>{pendingText}</p>
              </div>
            </div>
          )}
          {shown.map((comment) => (
            <CommentRow
              key={comment.uid}
              comment={comment}
              confirmingUid={confirmingUid}
              onConfirmDelete={setConfirmingUid}
              onDelete={requestDelete}
              isDeletePending={deleteComment.isPending}
              deletingUid={deleteComment.variables?.commentUid}
              deleteFailed={deleteComment.isError}
              resetDelete={deleteComment.reset}
            />
          ))}
          {comments.length > VISIBLE && (
            <button type="button" className={s.viewAll} onClick={() => setExpanded((v) => !v)}>
              {expanded ? 'Show fewer comments' : `View all ${totalCount} comments`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface CommentRowProps {
  comment: IFeedComment;
  confirmingUid: string | null;
  onConfirmDelete: (uid: string | null) => void;
  onDelete: (uid: string) => void;
  isDeletePending: boolean;
  deletingUid: string | undefined;
  deleteFailed: boolean;
  resetDelete: () => void;
}

/**
 * One comment and its replies. Recursive, but bounded: the tree it renders has
 * already been through clampDepth, so recursion is at most MAX_DEPTH deep.
 * Delete state is passed down rather than held here — there is one delete
 * mutation for the whole thread, and only one row may be confirming at a time.
 */
function CommentRow({
  comment,
  confirmingUid,
  onConfirmDelete,
  onDelete,
  isDeletePending,
  deletingUid,
  deleteFailed,
  resetDelete,
}: CommentRowProps) {
  const isConfirming = confirmingUid === comment.uid;
  const isDeletingThis = isDeletePending && deletingUid === comment.uid;
  const deleteFailedThis = deleteFailed && deletingUid === comment.uid;
  // `name` is nullable on the wire; the fallback keeps the avatar deterministic
  // and the row readable rather than rendering a blank byline.
  const displayName = comment.author.name || 'Member';

  return (
    <div className={s.item}>
      <img className={s.avatar} src={comment.author.avatarUrl || getDefaultAvatar(displayName)} alt="" loading="lazy" />
      <div className={s.body}>
        <div className={s.head}>
          <span className={s.name}>{displayName}</span>
          {comment.author.role && <span className={s.role}>· {comment.author.role}</span>}
          <span className={s.time}>· {formatTimeAgo(comment.createdAt)}</span>
          {comment.isOwn &&
            (isConfirming ? (
              <span className={s.deleteConfirm}>
                Delete this comment?
                <button
                  type="button"
                  className={s.deleteConfirmBtn}
                  disabled={isDeletingThis}
                  onClick={() => onDelete(comment.uid)}
                >
                  {isDeletingThis ? 'Deleting…' : 'Yes'}
                </button>
                <button
                  type="button"
                  className={s.deleteCancelBtn}
                  disabled={isDeletingThis}
                  onClick={() => {
                    onConfirmDelete(null);
                    if (deleteFailed) resetDelete();
                  }}
                >
                  Cancel
                </button>
              </span>
            ) : (
              <button type="button" className={s.deleteBtn} onClick={() => onConfirmDelete(comment.uid)}>
                Delete
              </button>
            ))}
        </div>
        <p className={s.text}>{comment.text}</p>
        {deleteFailedThis && (
          <p className={s.error} role="alert">
            Couldn&apos;t delete — try again.
          </p>
        )}

        {comment.replies.length > 0 && (
          <div className={s.repliesWrapper}>
            {comment.replies.map((reply) => (
              <CommentRow
                key={reply.uid}
                comment={reply}
                confirmingUid={confirmingUid}
                onConfirmDelete={onConfirmDelete}
                onDelete={onDelete}
                isDeletePending={isDeletePending}
                deletingUid={deletingUid}
                deleteFailed={deleteFailed}
                resetDelete={resetDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

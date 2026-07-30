'use client';

import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { formatTimeAgo } from '@/utils/formatTimeAgo';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { clampDepth } from '@/utils/comments';
import { useCurrentUserStore } from '@/services/auth/store';
import { useForumAccess } from '@/services/access-control/hooks/useForumAccess';
import { forumErrorMessage } from '@/services/forum/forum.service';
import { useFeedComments } from '@/services/feed/hooks/useFeedComments';
import { useAddFeedComment } from '@/services/feed/hooks/useAddFeedComment';
import { useDeleteFeedComment } from '@/services/feed/hooks/useDeleteFeedComment';
import { FEED_COMMENT_MAX_LENGTH } from '@/services/feed/constants';
import { useTeamNewsAnalytics, type FeedItemKind, type TeamNewsAnalyticsSource } from '@/analytics/team-news.analytics';
import { isForumPostUid, type IFeedComment } from '@/types/feed.types';

import s from './FeedCommentsThread.module.scss';

// Show at most this many TOP-LEVEL comments before capping behind "View all N …".
const VISIBLE = 2;

// Deepest rendered level, as a depth index — 2 means comment → reply →
// reply-to-reply, the same cap as the forum's CommentItem.MAX_DEPTH. The wire
// allows unlimited depth, so anything deeper is lifted to this level by
// clampDepth rather than indented off the edge of the modal.
const MAX_DEPTH = 2;

const POST_FAILED = 'Couldn’t post your comment — try again.';

/** Total comments in the thread, replies included — matches what the count
 *  badge shows (the backend counts every row under an item, at any depth). */
function countComments(comments: readonly IFeedComment[]): number {
  return comments.reduce((total, comment) => total + 1 + countComments(comment.replies), 0);
}

interface FeedCommentsThreadProps {
  itemUid: string;
  kind: FeedItemKind;
  source: TeamNewsAnalyticsSource;
  /** Forum posts only: the topic's opening post, which a top-level comment
   *  replies to. Lets the write happen in one request instead of two. */
  forumMainPid?: number;
}

/**
 * Comment thread + composer for a feed item, rendered inside the detail modal.
 *
 * The comments come from one of two entirely separate systems, and this
 * component is deliberately blind to which: news comments are directory-native,
 * a forum post's comments are its real NodeBB topic replies — posting one here
 * really does appear on /forum. Both arrive as the same `IFeedComment` tree from
 * services/feed/feed.service.ts.
 *
 * Mount = expanded: the parent renders this component only while the modal is
 * open, so the lazy comments query fetches on mount and, with no observer after
 * close, never refetches in the background. All comment text / names / roles
 * render via JSX text interpolation only — dangerouslySetInnerHTML is banned in
 * this component, and forum HTML arrives already stripped to plain text.
 *
 * Composer rules (no toasts, ever):
 * - The in-flight comment renders immediately from the mutation's `variables`
 *   (dimmed), under its parent when it's a reply — optimistic via UI, nothing
 *   written to the cache until the server confirms, so there's no rollback to
 *   get wrong.
 * - The input is cleared ONLY on success; on failure the draft is simply
 *   still there, with an inline error that clears on the next keystroke.
 * - Submit is guarded in the handler (not just the disabled attribute) so
 *   Enter can't double-fire while a submit is in flight.
 * - Forum failures show NodeBB's reason when it's a sentence (too short, too
 *   fast) and a generic line when it's an untranslated `[[error:…]]` key.
 *
 * Writing to a forum post additionally requires `forum.write` — the same gate
 * the /forum page's composer uses. Without it the thread stays fully readable.
 *
 * Delete (author-only, `isOwn`): an inline "Delete this comment? Yes / Cancel"
 * swap on the row — no modal, no toast, matching the composer's style. No
 * optimistic removal: the row shows a disabled Yes while the request is in
 * flight. Deleting cascades to the comment's replies, server-side and in the
 * cache patch alike. NodeBB-sourced comments always report `isOwn: false`, so
 * the affordance never appears on them.
 */
export function FeedCommentsThread({ itemUid, kind, source, forumMainPid }: FeedCommentsThreadProps) {
  const router = useRouter();
  const analytics = useTeamNewsAnalytics();
  const { currentUser, isHydrated } = useCurrentUserStore();
  const { canWrite: canWriteForum } = useForumAccess();
  const [draft, setDraft] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [confirmingUid, setConfirmingUid] = useState<string | null>(null);
  // One open reply composer at a time — a thread full of open inputs is noise,
  // and the draft belongs to whichever comment the member is answering.
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const { data } = useFeedComments(itemUid, { enabled: true });
  const addComment = useAddFeedComment(itemUid, forumMainPid);
  const deleteComment = useDeleteFeedComment(itemUid);

  const isForumPost = isForumPostUid(itemUid);
  // Forum writes go through NodeBB, which enforces this itself; checking here
  // keeps a member from typing a comment only to have it refused.
  const canComment = !isForumPost || canWriteForum;

  const items = data?.items;
  // Display cap applied once, here: everything below can recurse without
  // re-checking depth.
  const comments = useMemo(() => clampDepth<IFeedComment>(items ?? [], MAX_DEPTH), [items]);
  const totalCount = useMemo(() => countComments(comments), [comments]);

  // NodeBB serves one page of posts per request, so a busy topic's thread is
  // only partly here. Saying "View all N" over a subset would be a lie; the
  // forum link is where the rest actually is.
  const forumTopic = data?.forumTopic;
  const forumTopicUrl = forumTopic?.url ?? undefined;
  const missingReplyCount = forumTopic ? Math.max(0, forumTopic.totalReplyCount - totalCount) : 0;

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

  const submit = (text: string, parentUid?: string) => {
    const trimmed = text.trim();
    if (!trimmed || addComment.isPending) return false;
    addComment.mutate(
      { text: trimmed, parentUid },
      {
        onSuccess: () => {
          // UI-local follow-ups only — the cache writes live in the hook's
          // options callbacks, which survive this component unmounting.
          if (parentUid) setReplyingTo(null);
          else setDraft('');
          analytics.onFeedCommentSubmitted(itemUid, kind, source, Boolean(parentUid));
        },
      },
    );
    return true;
  };

  const clearError = () => {
    // A stale "couldn't post" must not sit above a fresh draft.
    if (addComment.isError) addComment.reset();
  };

  const handleDraftChange = (value: string) => {
    setDraft(value);
    clearError();
  };

  const goToLogin = () => {
    router.push(`${window.location.pathname}${window.location.search}#login`, { scroll: false });
  };

  // The last submit attempted, which outlives the request itself — so a failure
  // can be attributed to the composer it came from.
  const attempt = addComment.variables;
  const pending = addComment.isPending ? attempt : undefined;
  const pendingText = pending?.text.trim();
  const errorText = addComment.isError
    ? isForumPost
      ? forumErrorMessage(addComment.error, POST_FAILED)
      : POST_FAILED
    : undefined;
  // `null` = the failure belongs to the top-level composer; a uid = to that
  // comment's reply composer. Without this the same error renders in both.
  const errorParentUid = errorText ? (attempt?.parentUid ?? null) : undefined;

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
        canComment && (
          <div className={s.composer}>
            <Composer
              value={draft}
              onChange={handleDraftChange}
              onSubmit={() => submit(draft)}
              placeholder="Write your comment here…"
              submitLabel="Comment"
              disabled={addComment.isPending}
            />
            {errorText && errorParentUid === null && (
              <p className={s.error} role="alert">
                {errorText}
              </p>
            )}
          </div>
        )
      )}

      {(comments.length > 0 || (pendingText && !pending?.parentUid)) && (
        <div className={s.list}>
          {pendingText && !pending?.parentUid && <PendingRow text={pendingText} />}
          {shown.map((comment) => (
            <CommentRow
              key={comment.uid}
              comment={comment}
              depth={0}
              canReply={canComment}
              replyingTo={replyingTo}
              setReplyingTo={(uid) => {
                setReplyingTo(uid);
                clearError();
              }}
              onSubmitReply={submit}
              isSubmitting={addComment.isPending}
              pendingReply={pending?.parentUid ? { parentUid: pending.parentUid, text: pendingText ?? '' } : undefined}
              replyError={errorText && errorParentUid ? { parentUid: errorParentUid, text: errorText } : undefined}
              confirmingUid={confirmingUid}
              onConfirmDelete={setConfirmingUid}
              onDelete={requestDelete}
              isDeletePending={deleteComment.isPending}
              deletingUid={deleteComment.variables?.commentUid}
              deleteFailed={deleteComment.isError}
              resetDelete={deleteComment.reset}
              forumTopicUrl={forumTopicUrl}
            />
          ))}
          {comments.length > VISIBLE && (
            <button type="button" className={s.viewAll} onClick={() => setExpanded((v) => !v)}>
              {expanded
                ? 'Show fewer comments'
                : missingReplyCount > 0
                  ? 'Show more comments'
                  : `View all ${totalCount} comments`}
            </button>
          )}
          {missingReplyCount > 0 && forumTopicUrl && (
            <a className={s.forumLink} href={forumTopicUrl} target="_blank" rel="noopener noreferrer">
              {missingReplyCount === 1
                ? '1 more comment on the forum →'
                : `${missingReplyCount} more comments on the forum →`}
            </a>
          )}
        </div>
      )}
    </div>
  );
}

interface ComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
  submitLabel: string;
  disabled: boolean;
  onCancel?: () => void;
  autoFocus?: boolean;
}

/** The composer row, shared by the thread's own input and every reply input. */
function Composer({
  value,
  onChange,
  onSubmit,
  placeholder,
  submitLabel,
  disabled,
  onCancel,
  autoFocus,
}: ComposerProps) {
  const canSubmit = Boolean(value.trim()) && !disabled;

  return (
    <form
      className={s.inline}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <input
        className={s.forumField}
        value={value}
        maxLength={FEED_COMMENT_MAX_LENGTH}
        placeholder={placeholder}
        // Opening a reply box is an explicit request to type in it, so focus
        // follows the click rather than making the member click twice.
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
      />
      {onCancel && (
        <button type="button" className={s.replyCancelBtn} onClick={onCancel}>
          Cancel
        </button>
      )}
      <button
        type="submit"
        className={clsx(s.primaryBtn, s.commentBtn, !canSubmit && s.commentBtnDisabled)}
        disabled={!canSubmit}
      >
        {submitLabel}
      </button>
    </form>
  );
}

/** The viewer's own comment while it's in flight, rendered from the mutation's
 *  variables rather than written to the cache. */
function PendingRow({ text }: { text: string }) {
  const { currentUser } = useCurrentUserStore();
  const name = currentUser?.name ?? 'You';

  return (
    <div className={clsx(s.item, s.itemPending)}>
      <img className={s.avatar} src={currentUser?.profileImageUrl || getDefaultAvatar(name)} alt="" loading="lazy" />
      <div className={s.body}>
        <div className={s.head}>
          <span className={s.name}>{name}</span>
          <span className={s.time}>· posting…</span>
        </div>
        <p className={s.text}>{text}</p>
      </div>
    </div>
  );
}

interface CommentRowProps {
  comment: IFeedComment;
  depth: number;
  canReply: boolean;
  replyingTo: string | null;
  setReplyingTo: (uid: string | null) => void;
  onSubmitReply: (text: string, parentUid: string) => boolean;
  isSubmitting: boolean;
  pendingReply: { parentUid: string; text: string } | undefined;
  replyError: { parentUid: string; text: string } | undefined;
  confirmingUid: string | null;
  onConfirmDelete: (uid: string | null) => void;
  onDelete: (uid: string) => void;
  isDeletePending: boolean;
  deletingUid: string | undefined;
  deleteFailed: boolean;
  resetDelete: () => void;
  /** Where an attachment-only comment can actually be seen (forum posts only). */
  forumTopicUrl: string | undefined;
}

/**
 * One comment, its reply composer, and its replies. Recursive, but bounded: the
 * tree it renders has already been through clampDepth, so recursion is at most
 * MAX_DEPTH deep and Reply disappears at the cap (a deeper reply would be
 * displayed at the same level as its parent, which reads as a non-sequitur).
 *
 * Reply and delete state is passed down rather than held here — there is one
 * mutation of each kind for the whole thread, and only one row may be replying
 * or confirming at a time.
 */
function CommentRow(props: CommentRowProps) {
  const {
    comment,
    depth,
    canReply,
    replyingTo,
    setReplyingTo,
    onSubmitReply,
    isSubmitting,
    pendingReply,
    replyError,
    confirmingUid,
    onConfirmDelete,
    onDelete,
    isDeletePending,
    deletingUid,
    deleteFailed,
    resetDelete,
    forumTopicUrl,
  } = props;

  const [replyDraft, setReplyDraft] = useState('');

  const isConfirming = confirmingUid === comment.uid;
  const isDeletingThis = isDeletePending && deletingUid === comment.uid;
  const deleteFailedThis = deleteFailed && deletingUid === comment.uid;
  const isReplying = replyingTo === comment.uid;
  const showReply = canReply && depth < MAX_DEPTH;
  const pendingHere = pendingReply?.parentUid === comment.uid ? pendingReply.text : undefined;
  const errorHere = replyError?.parentUid === comment.uid ? replyError.text : undefined;
  // `name` is nullable on the wire; the fallback keeps the avatar deterministic
  // and the row readable rather than rendering a blank byline.
  const displayName = comment.author.name || 'Member';

  const submitReply = () => {
    if (onSubmitReply(replyDraft, comment.uid)) setReplyDraft('');
  };

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
        {/* A forum comment that was only an image or a file strips to nothing —
            the text is plain by contract, and the attachment isn't in it. Say so
            and point at where it can be seen, rather than rendering a blank row. */}
        {comment.text ? (
          <p className={s.text}>{comment.text}</p>
        ) : (
          <p className={clsx(s.text, s.textAttachment)}>
            {forumTopicUrl ? (
              <a href={forumTopicUrl} target="_blank" rel="noopener noreferrer" className={s.forumLink}>
                Shared an image or file — view it on the forum →
              </a>
            ) : (
              'Shared an image or file.'
            )}
          </p>
        )}
        {deleteFailedThis && (
          <p className={s.error} role="alert">
            Couldn’t delete — try again.
          </p>
        )}

        {showReply && !isReplying && (
          <button type="button" className={s.replyBtn} onClick={() => setReplyingTo(comment.uid)}>
            Reply
          </button>
        )}

        {isReplying && (
          <div className={s.replyComposer}>
            <Composer
              autoFocus
              value={replyDraft}
              onChange={setReplyDraft}
              onSubmit={submitReply}
              onCancel={() => {
                setReplyDraft('');
                setReplyingTo(null);
              }}
              placeholder={`Reply to ${displayName}…`}
              submitLabel="Reply"
              disabled={isSubmitting}
            />
            {errorHere && (
              <p className={s.error} role="alert">
                {errorHere}
              </p>
            )}
          </div>
        )}

        {(comment.replies.length > 0 || pendingHere) && (
          <div className={s.repliesWrapper}>
            {comment.replies.map((reply) => (
              <CommentRow key={reply.uid} {...props} comment={reply} depth={depth + 1} />
            ))}
            {pendingHere && <PendingRow text={pendingHere} />}
          </div>
        )}
      </div>
    </div>
  );
}

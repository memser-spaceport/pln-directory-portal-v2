'use client';

import clsx from 'clsx';
import { useState } from 'react';

import { formatTimeAgo } from '@/utils/formatTimeAgo';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';

import type { FeedComment } from './mocks';
// The feed's own Like affordance (a copy-simplify of the forum LikesButton) —
// the same button the cards use, so a comment like matches a story like.
import { LikeButton } from './FeedActions';
import s from './CommentsThread.module.scss';
// Reuse the production forum comment-input styling (its layout row + the brand
// "Comment" button) so the composer matches the forum 1:1.
import fs from '@/components/page/forum/CommentsInputDesktop/CommentsInputDesktop.module.scss';

interface Props {
  comments: FeedComment[];
  /**
   * Append a new comment (owned by the prototype so it persists for the
   * session). `parentUid` set = the new comment is a reply to that comment.
   */
  onAddComment: (text: string, parentUid?: string) => void;
  /** Has the viewer liked this comment? Keyed by comment uid. */
  isCommentLiked: (commentUid: string) => boolean;
  /** Toggle the viewer's like on a comment — available at every nesting depth. */
  onToggleCommentLike: (commentUid: string) => void;
}

/** A comment with its direct replies attached — the render-time shape. */
interface NestedComment extends FeedComment {
  replies: NestedComment[];
}

/**
 * Flat list → tree, mirroring the production forum's
 * `PostComments/utils/nestComments` (which nests on `parent.pid`; here it's
 * `parentUid`). Orphaned replies fall back to the root so nothing disappears.
 */
function nestComments(items: FeedComment[]): NestedComment[] {
  const map = new Map<string, NestedComment>();
  for (const item of items) map.set(item.uid, { ...item, replies: [] });

  const roots: NestedComment[] = [];
  for (const item of items) {
    const current = map.get(item.uid)!;
    const parent = item.parentUid ? map.get(item.parentUid) : undefined;
    if (parent) parent.replies.push(current);
    else roots.push(current);
  }
  return roots;
}

/**
 * Inline comment thread for the "Comments" interaction version — a simplified,
 * mocked stand-in for the production forum `PostComments` (which is bound to
 * auth, RBAC, and the forum API). Renders the nested thread and a working
 * composer; posting and replying append live via `onAddComment`.
 */
// Show at most this many top-level comments before capping behind "View all N …".
const VISIBLE = 2;
// Same cap as the forum's CommentItem: 3 levels — comment, reply, reply-to-reply.
const MAX_DEPTH = 2;

/** Shared composer row: the field + a brand submit, optionally with Cancel. */
function Composer({
  value,
  onChange,
  onSubmit,
  onCancel,
  placeholder,
  submitLabel,
  autoFocus,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  placeholder: string;
  submitLabel: string;
  autoFocus?: boolean;
  className?: string;
}) {
  return (
    <form
      className={clsx(fs.inline, className)}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <input
        className={s.forumField}
        value={value}
        placeholder={placeholder}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
      />
      {onCancel && (
        <button type="button" className={clsx(fs.secondaryBtn, s.commentBtn)} onClick={onCancel}>
          Cancel
        </button>
      )}
      <button
        type="submit"
        className={clsx(fs.primaryBtn, s.commentBtn, !value.trim() && s.commentBtnDisabled)}
        disabled={!value.trim()}
      >
        {submitLabel}
      </button>
    </form>
  );
}

/**
 * One comment plus its nested replies. The action row (replies count + Reply)
 * and the depth cap follow the forum's `CommentItem`; likes and the edit menu
 * are deliberately dropped — this is a mocked feed thread, not the forum post.
 */
function CommentRow({
  comment,
  depth,
  replyingTo,
  setReplyingTo,
  onAddComment,
  isCommentLiked,
  onToggleCommentLike,
}: {
  comment: NestedComment;
  depth: number;
  replyingTo: string | null;
  setReplyingTo: (uid: string | null) => void;
  onAddComment: (text: string, parentUid?: string) => void;
  isCommentLiked: (commentUid: string) => boolean;
  onToggleCommentLike: (commentUid: string) => void;
}) {
  const [draft, setDraft] = useState('');
  const canReply = depth < MAX_DEPTH;
  const isReplying = replyingTo === comment.uid;
  const liked = isCommentLiked(comment.uid);
  const likes = (comment.likes ?? 0) + (liked ? 1 : 0);

  const submitReply = () => {
    const text = draft.trim();
    if (!text) return;
    onAddComment(text, comment.uid);
    setDraft('');
    setReplyingTo(null);
  };

  return (
    <div className={clsx(s.item, depth > 0 && s.reply)}>
      <img className={s.avatar} src={getDefaultAvatar(comment.author)} alt="" loading="lazy" />
      <div className={s.body}>
        <div className={s.head}>
          <span className={s.name}>{comment.author}</span>
          <span className={s.role}>· {comment.role}</span>
          <span className={s.time}>· {formatTimeAgo(comment.createdAt)}</span>
        </div>
        <p className={s.text}>{comment.text}</p>

        {/* Likes → Reply, in the forum CommentItem's order. The forum's "N Replies"
            counter is deliberately dropped — the replies are rendered right below,
            so the number is noise. Likes stay available at every depth; Reply
            stops at the depth cap. */}
        <div className={s.sub}>
          <LikeButton count={likes} liked={liked} onToggle={() => onToggleCommentLike(comment.uid)} showLabel />
          {canReply && (
            <button type="button" className={s.replyBtn} onClick={() => setReplyingTo(isReplying ? null : comment.uid)}>
              Reply
            </button>
          )}
        </div>

        {isReplying && (
          <Composer
            className={s.replyForm}
            value={draft}
            onChange={setDraft}
            onSubmit={submitReply}
            onCancel={() => {
              setDraft('');
              setReplyingTo(null);
            }}
            placeholder={`Reply to ${comment.author}…`}
            submitLabel="Reply"
            autoFocus
          />
        )}

        {comment.replies.length > 0 && (
          <div className={s.repliesWrapper}>
            {comment.replies.map((reply) => (
              <CommentRow
                key={reply.uid}
                comment={reply}
                depth={depth + 1}
                replyingTo={replyingTo}
                setReplyingTo={setReplyingTo}
                onAddComment={onAddComment}
                isCommentLiked={isCommentLiked}
                onToggleCommentLike={onToggleCommentLike}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function CommentsThread({ comments, onAddComment, isCommentLiked, onToggleCommentLike }: Props) {
  const [draft, setDraft] = useState('');
  const [expanded, setExpanded] = useState(false);
  // One open reply composer at a time across the whole thread, like the forum.
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const nested = nestComments(comments);
  // The cap counts top-level comments; replies always travel with their parent.
  const shown = expanded ? nested : nested.slice(0, VISIBLE);

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    onAddComment(text);
    setDraft('');
  };

  return (
    <div className={s.thread} onClick={(e) => e.stopPropagation()}>
      {/* Composer sits above the list — leave a comment first, then read. */}
      <Composer
        value={draft}
        onChange={setDraft}
        onSubmit={submit}
        placeholder="Write your comment here, use @ to mention someone"
        submitLabel="Comment"
      />

      {comments.length > 0 && (
        <div className={s.list}>
          {shown.map((c) => (
            <CommentRow
              key={c.uid}
              comment={c}
              depth={0}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              onAddComment={onAddComment}
              isCommentLiked={isCommentLiked}
              onToggleCommentLike={onToggleCommentLike}
            />
          ))}
          {nested.length > VISIBLE && (
            <button type="button" className={s.viewAll} onClick={() => setExpanded((v) => !v)}>
              {expanded ? 'Show fewer comments' : `View all ${comments.length} comments`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import { clsx } from 'clsx';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/common/Button/Button';
import { getAvatarColor } from '@/components/page/ai-apps/AiAppFeedbackPage/utils/getAvatarColor';
import {
  FEEDBACK_COMMENT_MAX_LENGTH,
  type AiAppFeedbackComment,
} from '@/services/ai-app-feedback/ai-app-feedback.service';
import {
  useAddFeedbackComment,
  useDeleteFeedbackComment,
  useFeedbackComments,
} from '@/services/ai-app-feedback/hooks/useFeedbackComments';
import { useAiAppsAnalytics } from '@/analytics/ai-apps.analytics';
// Forum comment rows, as the comment above them uses.
import ci from '@/components/page/forum/PostComments/components/CommentItem/CommentItem.module.scss';
import fd from '@/components/page/ai-apps/components/GiveAiAppFeedbackDialog/GiveAiAppFeedbackDialog.module.scss';

import s from './CommentMode.module.scss';

/** Who is reading the thread: their replies show at once under their name, and only theirs can be deleted. */
export type ThreadViewer = { uid: string; name: string; image: string | null };

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

type Props = {
  appUid: string;
  feedbackUid: string;
  /** From the pin read; replies are fetched only when there are some. Undefined: the API has no conversations yet. */
  commentCount: number | undefined;
  /** Null while signed out: no thread (the reads need a session). */
  viewer: ThreadViewer | null;
  /** The "Not on screen" list: a toggle first, so the list doesn't fetch every thread at once. */
  collapsed?: boolean;
};

const NOTHING = { list: null, field: null };

/**
 * The conversation under a feedback item (phase 2): the replies, oldest first,
 * then a reply field — the prototype PinThread's lower half. Plain text; Enter
 * sends, Shift+Enter breaks the line. Returns the list (for the card's scroll
 * area) and the field (for its footer) separately; both null when the API has
 * no conversations yet (`commentCount` absent) or nobody is signed in.
 */
export function useFeedbackReplies({ appUid, feedbackUid, commentCount, viewer, collapsed = false }: Props) {
  const available = typeof commentCount === 'number' && viewer !== null;
  const count = commentCount ?? 0;
  const [expanded, setExpanded] = useState(!collapsed);
  const { comments, isLoading, isError, refetch } = useFeedbackComments(
    appUid,
    feedbackUid,
    available && expanded && count > 0,
  );
  const add = useAddFeedbackComment(appUid, feedbackUid, viewer);
  const remove = useDeleteFeedbackComment(appUid, feedbackUid);
  const analytics = useAiAppsAnalytics();
  const [confirmingUid, setConfirmingUid] = useState<string | null>(null);

  if (!available || !viewer) return NOTHING;

  const send = async (text: string) => {
    await add.mutateAsync(text);
    analytics.onFeedbackReplySent({ appUid, feedbackUid });
  };

  if (!expanded) {
    return {
      list: (
        <button type="button" className={s.repliesToggle} onClick={() => setExpanded(true)}>
          {count > 0 ? `Replies (${count})` : 'Reply'}
        </button>
      ),
      field: null,
    };
  }

  const list =
    count > 0 || comments.length > 0 ? (
      <div className={clsx(ci.repliesWrapper, s.replies)} aria-label="Replies">
        {isLoading && comments.length === 0 && <p className={s.repliesNote}>Loading replies…</p>}
        {isError && comments.length === 0 && (
          <p className={s.repliesNote}>
            Couldn’t load replies.{' '}
            <button type="button" className={s.linkButton} onClick={() => void refetch()}>
              Try again
            </button>
          </p>
        )}
        {comments.map((comment) => (
          <ReplyRow
            key={comment.uid}
            comment={comment}
            isOwn={!comment.pending && comment.member?.uid === viewer.uid}
            confirming={confirmingUid === comment.uid}
            onAskDelete={() => setConfirmingUid(comment.uid)}
            onCancelDelete={() => setConfirmingUid(null)}
            onDelete={() => {
              setConfirmingUid(null);
              remove.mutate(comment.uid);
              analytics.onFeedbackReplyDeleted({ appUid, feedbackUid });
            }}
          />
        ))}
      </div>
    ) : null;

  return { list, field: <ReplyField onSend={send} /> };
}

function ReplyRow({
  comment,
  isOwn,
  confirming,
  onAskDelete,
  onCancelDelete,
  onDelete,
}: {
  comment: AiAppFeedbackComment;
  isOwn: boolean;
  confirming: boolean;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onDelete: () => void;
}) {
  const name = comment.member?.name ?? 'A member';
  return (
    <div className={clsx(ci.itemRoot, ci.reply, comment.pending && s.replyPending)}>
      <div className={ci.footer}>
        <span className={ci.Avatar} style={{ backgroundColor: getAvatarColor(name) }} aria-hidden>
          <span className={ci.Fallback}>{initials(name)}</span>
        </span>
        <div className={ci.col}>
          <span className={ci.name}>
            {name}
            {comment.kind === 'CLOSING_NOTE' && <span className={s.shippedNote}>Shipped note</span>}
          </span>
          <span className={ci.time}>
            {comment.pending ? 'Sending…' : formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </span>
        </div>
      </div>
      <p className={clsx(ci.postContent, s.body)}>{comment.text}</p>
      {isOwn &&
        (confirming ? (
          <p className={s.replyConfirm} role="group" aria-label="Delete this reply?">
            Delete this reply?
            <button type="button" className={s.linkButtonDanger} onClick={onDelete}>
              Delete
            </button>
            <button type="button" className={s.linkButton} onClick={onCancelDelete}>
              Cancel
            </button>
          </p>
        ) : (
          <button type="button" className={s.replyDelete} onClick={onAskDelete}>
            Delete
          </button>
        ))}
    </div>
  );
}

function ReplyField({ onSend }: { onSend: (text: string) => Promise<void> }) {
  const [text, setText] = useState('');
  const trimmed = text.trim();
  const canSend = trimmed.length > 0 && trimmed.length <= FEEDBACK_COMMENT_MAX_LENGTH;

  const send = () => {
    if (!canSend) return;
    const sent = text;
    setText('');
    /* It shows in the thread at once; if it doesn't go, it comes back here. */
    onSend(trimmed).catch(() => setText((current) => current || sent));
  };

  return (
    <div className={clsx(fd.footer, s.replyRow)}>
      <textarea
        className={clsx(s.composerField, s.replyInput)}
        rows={1}
        maxLength={FEEDBACK_COMMENT_MAX_LENGTH}
        aria-label="Reply"
        placeholder="Reply…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send();
          } else if (e.key === 'Escape' && text) {
            /* First Esc leaves the field (keeping the text); the next closes the thread. */
            e.preventDefault();
            e.currentTarget.blur();
          }
        }}
      />
      <Button size="xs" disabled={!canSend} onClick={send}>
        Reply
      </Button>
    </div>
  );
}

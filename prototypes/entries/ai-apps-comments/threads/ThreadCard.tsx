'use client';

import { clsx } from 'clsx';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/common/Button/Button';
import { CloseIcon } from '@/components/icons';
import { ConfirmDialog } from '@/components/core/ConfirmDialog/ConfirmDialog';
import { getAvatarColor } from '@/components/page/ai-apps/AiAppFeedbackPage/utils/getAvatarColor';
import { FeedbackStatusSelector } from '@/components/page/ai-apps/AiAppFeedbackPage/components/FeedbackStatusSelector';
import { FeedbackImageLightbox } from '@/components/page/ai-apps/AiAppFeedbackPage/components/FeedbackImageLightbox/FeedbackImageLightbox';
import { AnnotationCanvas } from '@/components/page/ai-apps/components/screenshot-feedback/AnnotationCanvas';
import { hasAnyAnnotation } from '@/components/page/ai-apps/components/screenshot-feedback';
import { AI_APP_FEEDBACK_STATUS_LABELS } from '@/services/ai-app-feedback/constants';
// Forum comment rows — avatar, name, time, body — verbatim.
import ci from '@/components/page/forum/PostComments/components/CommentItem/CommentItem.module.scss';
// The feedback dialog's card (radius, shadow) and its footer rule.
import fd from '@/components/page/ai-apps/components/GiveAiAppFeedbackDialog/GiveAiAppFeedbackDialog.module.scss';
import st from '@/components/page/ai-apps/AiAppFeedbackPage/components/FeedbackStatusSelector/FeedbackStatusSelector.module.scss';

// The shared pin popover's stylesheet: same card, same rows, same reply field.
import pt from '../../feedback-shared/comments/PinThread.module.scss';
import { formatMinutesAgo } from '../../feedback-shared/comments/time';
import { CommentMenu } from './CommentMenu';
import type { Thread } from './useThreads';
import s from './ThreadCard.module.scss';

const MAX_LENGTH = 5000;

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

interface RowProps {
  name: string;
  minutesAgo: number;
  text: string;
  isReply?: boolean;
  edited?: boolean;
  /** Present on what the viewer wrote: the ⋯ with Edit and Delete. */
  own?: { onSave: (text: string) => void; onDelete: () => void };
}

/**
 * One comment or reply, in the forum comment row's classes. On your own, the
 * forum's ⋯ sits at the row's end (its `menuWrapper` slot); Edit swaps the
 * text for the reply field's textarea in place, with Cancel / Save under it —
 * the forum edits a comment where it stands, too. "Edited" follows the time,
 * the team news card's mark.
 */
function Row({ name, minutesAgo, text, isReply, edited, own }: RowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  const field = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!editing) return;
    const el = field.current;
    el?.focus();
    el?.setSelectionRange(el.value.length, el.value.length);
  }, [editing]);

  const save = () => {
    const next = draft.trim();
    if (!next) return;
    if (next !== text) own?.onSave(next);
    setEditing(false);
  };

  return (
    <div className={clsx(ci.itemRoot, isReply && ci.reply)}>
      <div className={ci.footer}>
        <span className={ci.Avatar} style={{ backgroundColor: getAvatarColor(name) }} aria-hidden>
          <span className={ci.Fallback}>{initials(name)}</span>
        </span>
        <div className={ci.col}>
          <span className={ci.name}>{name}</span>
          {/* Plain `time`, not the forum's mobile-only copy: on desktop the forum shows
              the time in its inline row, which this card doesn't have, so here
              time and "Edited" would otherwise not show at all. */}
          <span className={ci.time}>
            {formatMinutesAgo(minutesAgo)}
            {edited && ' · Edited'}
          </span>
        </div>
        {own && !editing && (
          <div className={clsx(ci.menuWrapper, s.menu)}>
            <CommentMenu
              kind={isReply ? 'reply' : 'comment'}
              onEdit={() => {
                setDraft(text);
                setEditing(true);
              }}
              onDelete={own.onDelete}
            />
          </div>
        )}
      </div>
      {editing ? (
        <div className={s.edit}>
          <textarea
            ref={field}
            className={pt.textarea}
            rows={3}
            maxLength={MAX_LENGTH}
            value={draft}
            aria-label={isReply ? 'Edit your reply' : 'Edit your comment'}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                // The card's own Esc would close the thread; here it only cancels the edit.
                e.stopPropagation();
                setEditing(false);
              }
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                save();
              }
            }}
          />
          <div className={s.editActions}>
            <Button style="border" variant="neutral" size="xs" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button size="xs" disabled={!draft.trim()} onClick={save}>
              Save
            </Button>
          </div>
        </div>
      ) : (
        <p className={clsx(ci.postContent, pt.body)}>{text}</p>
      )}
    </div>
  );
}

interface Props {
  thread: Thread;
  canManage: boolean;
  onReply: (text: string) => void;
  onStatus: (status: Thread['status']) => void;
  /** The viewer, so their own comment and replies get Edit / Delete. */
  viewerUid: string;
  onEdit: (itemId: string, text: string) => void;
  onDeleteThread: () => void;
  onDeleteReply: (replyId: string) => void;
  onClose: () => void;
  style?: React.CSSProperties;
  flip: boolean;
}

/**
 * The popover beside a pin: the comment, its screenshot WITH what was drawn on
 * it, the replies, a reply field, and the author's status.
 *
 * A COPY of the shared `PinThread` with one change — the picture. There it is a
 * flat image; here a comment's screenshot carries production annotation state
 * (strokes, boxes, arrows, numbered notes), so the thumbnail is production's
 * read-only `AnnotationCanvas` and a press opens production's
 * `FeedbackImageLightbox`, the viewer the feedback table already uses for
 * annotated screenshots. Copied rather than edited because the shared one is
 * the `ai-apps` prototype's, which stays as it is.
 *
 * Second change: whoever wrote a comment or reply can edit or delete it (see
 * `Row`). Deleting the first comment deletes the thread — the replies were
 * answers to it — so that one asks first and says how many replies go with it;
 * a reply asks too, as every destroy in the product does.
 */
export function ThreadCard(props: Props) {
  const { thread, canManage, onReply, onStatus, onClose, style, flip } = props;
  const { viewerUid, onEdit, onDeleteThread, onDeleteReply } = props;
  const [text, setText] = useState('');
  /** The delete awaiting confirmation: the thread itself, or one reply. */
  const [pendingDelete, setPendingDelete] = useState<{ replyId: string | null } | null>(null);
  const edited = new Set(thread.editedIds ?? []);
  const [viewing, setViewing] = useState(false);

  const trimmed = text.trim();
  const canSend = trimmed.length > 0 && text.length <= MAX_LENGTH;
  const showStatus = canManage || thread.status !== 'NEW';
  const annotations = thread.annotations && hasAnyAnnotation(thread.annotations) ? thread.annotations : null;

  return (
    <div className={clsx(fd.root, pt.card, flip && pt.flip)} style={style} onClick={(e) => e.stopPropagation()}>
      <div className={pt.threadHead}>
        {showStatus &&
          (canManage ? (
            <FeedbackStatusSelector status={thread.status} onStatusSelect={onStatus} />
          ) : (
            <span className={clsx(st.badge, st[`badge_${thread.status}`])}>
              {AI_APP_FEEDBACK_STATUS_LABELS[thread.status]}
            </span>
          ))}
        <button type="button" className={clsx(fd.closeButton, pt.close)} onClick={onClose} aria-label="Close">
          <CloseIcon width={16} height={16} />
        </button>
      </div>

      <div className={pt.thread}>
        <Row
          name={thread.authorName}
          minutesAgo={thread.minutesAgo}
          text={thread.text}
          edited={edited.has(thread.id)}
          own={
            thread.authorUid === viewerUid
              ? {
                  onSave: (next) => onEdit(thread.id, next),
                  onDelete: () => setPendingDelete({ replyId: null }),
                }
              : undefined
          }
        />

        {/* null = attached, still being photographed (seeds take theirs on first open). */}
        {thread.shot === null && (
          <div className={pt.shot}>
            <span className={pt.shotPending} />
          </div>
        )}
        {thread.shot && (
          <div className={pt.shot}>
            <button type="button" className={pt.shotOpen} onClick={() => setViewing(true)} title="View full size">
              {annotations ? (
                <AnnotationCanvas className={s.canvas} imageSrc={thread.shot} annotations={annotations} readOnly />
              ) : (
                <img src={thread.shot} alt="Screenshot attached to this comment" />
              )}
            </button>
          </div>
        )}
        <FeedbackImageLightbox
          image={
            viewing && thread.shot
              ? {
                  src: thread.shot,
                  alt: 'Screenshot attached to this comment',
                  annotations,
                  hasVisibleAnnotations: !!annotations,
                }
              : null
          }
          onClose={() => setViewing(false)}
        />

        {thread.replies.length > 0 && (
          <div className={ci.repliesWrapper}>
            {thread.replies.map((r) => (
              <Row
                key={r.id}
                name={r.authorName}
                minutesAgo={r.minutesAgo}
                text={r.text}
                isReply
                edited={edited.has(r.id)}
                own={
                  r.authorUid === viewerUid
                    ? {
                        onSave: (next) => onEdit(r.id, next),
                        onDelete: () => setPendingDelete({ replyId: r.id }),
                      }
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </div>

      <div className={clsx(fd.footer, pt.footer, pt.replyRow)}>
        <textarea
          className={clsx(pt.textarea, pt.replyInput)}
          rows={1}
          maxLength={MAX_LENGTH}
          placeholder="Reply…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && canSend) {
              e.preventDefault();
              onReply(trimmed);
              setText('');
            }
          }}
        />
        <Button
          size="xs"
          disabled={!canSend}
          onClick={() => {
            onReply(trimmed);
            setText('');
          }}
        >
          Reply
        </Button>
      </div>

      <ConfirmDialog
        isOpen={!!pendingDelete}
        title={pendingDelete?.replyId ? 'Delete reply?' : 'Delete comment?'}
        desc={
          pendingDelete?.replyId
            ? 'Your reply will be removed from this thread.'
            : thread.replies.length > 0
              ? `Your comment and the ${thread.replies.length} ${thread.replies.length === 1 ? 'reply' : 'replies'} to it will be removed.`
              : 'Your comment will be removed from the app.'
        }
        confirmTitle="Delete"
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          const target = pendingDelete;
          setPendingDelete(null);
          if (!target) return;
          if (target.replyId) onDeleteReply(target.replyId);
          else onDeleteThread();
        }}
      />
    </div>
  );
}

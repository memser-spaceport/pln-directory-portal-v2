'use client';

import { clsx } from 'clsx';
import { useState } from 'react';

import { Button } from '@/components/common/Button/Button';
import { CloseIcon } from '@/components/icons';
import { getAvatarColor } from '@/components/page/ai-apps/AiAppFeedbackPage/utils/getAvatarColor';
import { FeedbackStatusSelector } from '@/components/page/ai-apps/AiAppFeedbackPage/FeedbackStatusSelector/FeedbackStatusSelector';
import { AI_APP_FEEDBACK_STATUS_LABELS, type AiAppFeedbackStatus } from '@/services/ai-app-feedback/constants';
// Forum comment rows — avatar, name, time, body — verbatim, so a thread on a
// pin reads like every other thread in the product.
import ci from '@/components/page/forum/PostComments/components/CommentItem/CommentItem.module.scss';
// The feedback dialog's card (radius, shadow) and its footer rule.
import fd from '@/components/page/ai-apps/components/GiveAiAppFeedbackDialog/GiveAiAppFeedbackDialog.module.scss';
// The status badge classes, so a reader sees the same pill the author sets.
import st from '@/components/page/ai-apps/AiAppFeedbackPage/FeedbackStatusSelector/FeedbackStatusSelector.module.scss';

import { ShotEditor } from './ShotEditor';
import { formatMinutesAgo } from './time';
import type { AppComment, CommentReply } from './types';
import s from './PinThread.module.scss';

const MAX_LENGTH = 5000;

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function Avatar({ name }: { name: string }) {
  return (
    <span className={ci.Avatar} style={{ backgroundColor: getAvatarColor(name) }} aria-hidden>
      <span className={ci.Fallback}>{initials(name)}</span>
    </span>
  );
}

function Row({ name, minutesAgo, text, isReply }: Pick<CommentReply, 'text' | 'minutesAgo'> & { name: string; isReply?: boolean }) {
  return (
    <div className={clsx(ci.itemRoot, isReply && ci.reply)}>
      <div className={ci.footer}>
        <Avatar name={name} />
        <div className={ci.col}>
          <span className={ci.name}>{name}</span>
          <span className={clsx(ci.time, ci.mob)}>{formatMinutesAgo(minutesAgo)}</span>
        </div>
      </div>
      <p className={clsx(ci.postContent, s.body)}>{text}</p>
    </div>
  );
}

/** The captured element, or the moment before it arrives. Pressing it opens it full size. */
function Shot({ src, pending, onOpen }: { src: string | null; pending: boolean; onOpen: () => void }) {
  if (!src && !pending) return null;
  return (
    <div className={s.shot}>
      {src ? (
        <button type="button" className={s.shotOpen} onClick={onOpen} title="View full size">
          <img src={src} alt="The part of the app this comment points at" />
        </button>
      ) : (
        <span className={s.shotPending} />
      )}
    </div>
  );
}

interface Props {
  comment: AppComment;
  canManage: boolean;
  onReply: (text: string) => void;
  onStatus: (status: AiAppFeedbackStatus) => void;
  onClose: () => void;
  style?: React.CSSProperties;
  flip: boolean;
}

/**
 * The popover beside a pin: the comment that was sent, its picture, the replies,
 * and a reply field. It is the feedback dialog's card, narrowed and anchored — the
 * app picker went away because the pin already says which app.
 *
 * Writing a new comment is not here. That happens in `DraftsPanel`, where several
 * can be collected, their pictures marked up, and the set sent together; a sent
 * comment's picture opens read-only, because the author reads what was sent.
 */
export function PinThread(props: Props) {
  const { comment, canManage, onReply, onStatus, onClose } = props;
  const [text, setText] = useState('');
  const [viewingShot, setViewingShot] = useState(false);

  const trimmed = text.trim();
  const canSend = trimmed.length > 0 && text.length <= MAX_LENGTH;
  const showStatus = canManage || comment.status !== 'NEW';

  return (
    <div className={clsx(fd.root, s.card, props.flip && s.flip)} style={props.style} onClick={(e) => e.stopPropagation()}>
      <div className={s.threadHead}>
        {/* The author triages on the pin; a reader only sees a status once it
            says something (New on your own comment says nothing). */}
        {showStatus &&
          (canManage ? (
            <FeedbackStatusSelector status={comment.status} onStatusSelect={onStatus} />
          ) : (
            <span className={clsx(st.badge, st[`badge_${comment.status}`])}>
              {AI_APP_FEEDBACK_STATUS_LABELS[comment.status]}
            </span>
          ))}
        <button type="button" className={clsx(fd.closeButton, s.close)} onClick={onClose} aria-label="Close">
          <CloseIcon width={16} height={16} />
        </button>
      </div>

      <div className={s.thread}>
        <Row name={comment.authorName} minutesAgo={comment.minutesAgo} text={comment.text} />
        <Shot src={comment.shot || null} pending={comment.shot === null} onOpen={() => setViewingShot(true)} />
        {viewingShot && comment.shot && (
          <ShotEditor src={comment.shot} mode="view" onClose={() => setViewingShot(false)} />
        )}
        {comment.replies.length > 0 && (
          <div className={ci.repliesWrapper}>
            {comment.replies.map((r) => (
              <Row key={r.id} name={r.authorName} minutesAgo={r.minutesAgo} text={r.text} isReply />
            ))}
          </div>
        )}
      </div>

      <div className={clsx(fd.footer, s.footer, s.replyRow)}>
        <textarea
          className={clsx(s.textarea, s.replyInput)}
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
    </div>
  );
}

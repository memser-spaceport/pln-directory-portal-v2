'use client';

import clsx from 'clsx';
import { useState } from 'react';

import { formatTimeAgo } from '@/utils/formatTimeAgo';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';

import type { FeedComment } from './mocks';
import s from './CommentsThread.module.scss';
// Reuse the production forum comment-input styling (its layout row + the brand
// "Comment" button) so the composer matches the forum 1:1.
import fs from '@/components/page/forum/CommentsInputDesktop/CommentsInputDesktop.module.scss';

interface Props {
  comments: FeedComment[];
  /** Append a new comment (owned by the prototype so it persists for the session). */
  onAddComment: (text: string) => void;
}

/**
 * Inline comment thread for the "Comments" interaction version — a simplified,
 * mocked stand-in for the production forum `PostComments` (which is bound to
 * auth, RBAC, and the forum API). Renders the existing thread and a working
 * composer; posting appends live via `onAddComment`.
 */
// Show at most this many comments before capping behind "View all N …".
const VISIBLE = 2;

export function CommentsThread({ comments, onAddComment }: Props) {
  const [draft, setDraft] = useState('');
  const [expanded, setExpanded] = useState(false);

  const shown = expanded ? comments : comments.slice(0, VISIBLE);

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    onAddComment(text);
    setDraft('');
  };

  return (
    <div className={s.thread} onClick={(e) => e.stopPropagation()}>
      {/* Composer sits above the list — leave a comment first, then read. */}
      <form
        className={fs.inline}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <input
          className={s.forumField}
          value={draft}
          placeholder="Write your comment here, use @ to mention someone"
          onChange={(e) => setDraft(e.target.value)}
        />
        <button
          type="submit"
          className={clsx(fs.primaryBtn, s.commentBtn, !draft.trim() && s.commentBtnDisabled)}
          disabled={!draft.trim()}
        >
          Comment
        </button>
      </form>

      {comments.length > 0 && (
        <div className={s.list}>
          {shown.map((c) => (
            <div key={c.uid} className={s.item}>
              <img className={s.avatar} src={getDefaultAvatar(c.author)} alt="" loading="lazy" />
              <div className={s.body}>
                <div className={s.head}>
                  <span className={s.name}>{c.author}</span>
                  <span className={s.role}>· {c.role}</span>
                  <span className={s.time}>· {formatTimeAgo(c.createdAt)}</span>
                </div>
                <p className={s.text}>{c.text}</p>
              </div>
            </div>
          ))}
          {comments.length > VISIBLE && (
            <button type="button" className={s.viewAll} onClick={() => setExpanded((v) => !v)}>
              {expanded ? 'Show fewer comments' : `View all ${comments.length} comments`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

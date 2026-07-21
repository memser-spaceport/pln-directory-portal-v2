'use client';

import { useState } from 'react';

import { formatTimeAgo } from '@/utils/formatTimeAgo';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';

import type { FeedComment } from './mocks';
import s from './CommentsThread.module.scss';

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
export function CommentsThread({ comments, onAddComment }: Props) {
  const [draft, setDraft] = useState('');

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    onAddComment(text);
    setDraft('');
  };

  return (
    <div className={s.thread} onClick={(e) => e.stopPropagation()}>
      {comments.length > 0 ? (
        <div className={s.list}>
          {comments.map((c) => (
            <div key={c.uid} className={s.item}>
              <img className={s.avatar} src={getDefaultAvatar(c.author)} alt="" loading="lazy" />
              <div className={s.body}>
                <div className={s.head}>
                  <span className={s.name}>{c.author}</span>
                  <span className={s.role}>· {c.role}</span>
                  <span className={s.time}>{formatTimeAgo(c.createdAt)}</span>
                </div>
                <p className={s.text}>{c.text}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <span className={s.empty}>Be the first to comment.</span>
      )}

      <div className={s.composer}>
        <img className={s.avatar} src={getDefaultAvatar('You')} alt="" loading="lazy" />
        <div className={s.field}>
          <input
            className={s.input}
            value={draft}
            placeholder="Add a comment…"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
          />
          <button type="button" className={s.send} disabled={!draft.trim()} onClick={submit}>
            Post
          </button>
        </div>
      </div>
    </div>
  );
}

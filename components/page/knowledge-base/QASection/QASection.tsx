'use client';

import React, { useState } from 'react';
import s from './QASection.module.scss';

interface IComment {
  id: string;
  author: string;
  initials: string;
  text: string;
  timestamp: string;
}

const MOCK_COMMENTS: IComment[] = [
  {
    id: '1',
    author: 'Priya Narayan',
    initials: 'PN',
    text: 'This was super helpful — especially the section on token side letters. Do you have recommendations for attorneys who specialize in SAFT structures specifically?',
    timestamp: '2 days ago',
  },
  {
    id: '2',
    author: 'Marcus Delgado',
    initials: 'MD',
    text: "Great resource. One thing I'd add: if you're doing a token raise, make sure to get your legal structure in order at least 6 months before you plan to launch. The delays can be brutal.",
    timestamp: '1 week ago',
  },
];

interface Props {
  isLoggedIn: boolean;
  articleSlug: string;
}

export function QASection({ isLoggedIn, articleSlug: _ }: Props) {
  const [comments, setComments] = useState<IComment[]>(MOCK_COMMENTS);
  const [draft, setDraft] = useState('');

  const handleSubmit = () => {
    if (!draft.trim()) return;
    const newComment: IComment = {
      id: Date.now().toString(),
      author: 'You',
      initials: 'YO',
      text: draft.trim(),
      timestamp: 'just now',
    };
    setComments((prev) => [...prev, newComment]);
    setDraft('');
  };

  return (
    <div className={s.root}>
      <h2 className={s.heading}>
        <CommentIcon /> Q&amp;A
        <span className={s.count}>{comments.length}</span>
      </h2>

      <div className={s.comments}>
        {comments.map((c) => (
          <div key={c.id} className={s.comment}>
            <div className={s.avatar}>{c.initials}</div>
            <div className={s.body}>
              <div className={s.meta}>
                <span className={s.author}>{c.author}</span>
                <span className={s.timestamp}>{c.timestamp}</span>
              </div>
              <p className={s.text}>{c.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className={s.inputArea}>
        {isLoggedIn ? (
          <>
            <textarea
              className={s.textarea}
              placeholder="Have a question about this article? Ask away..."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
            />
            <div className={s.inputFooter}>
              <span className={s.inputHint}>Be specific — the more context you give, the better the answer</span>
              <button
                className={s.submitButton}
                onClick={handleSubmit}
                disabled={!draft.trim()}
              >
                Post question
              </button>
            </div>
          </>
        ) : (
          <p className={s.loginPrompt}>
            <a href="/sign-up" className={s.loginLink}>Log in</a> to ask a question
          </p>
        )}
      </div>
    </div>
  );
}

const CommentIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M2 2.5C2 1.95 2.45 1.5 3 1.5H13C13.55 1.5 14 1.95 14 2.5V10.5C14 11.05 13.55 11.5 13 11.5H5L2 14.5V2.5Z"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
  </svg>
);

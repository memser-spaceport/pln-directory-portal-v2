'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import { LikeThumbsIcon } from '@/components/icons/LikeThumbsIcon';
import { mockGantryItem } from '../mocks';
import { AdminPreview } from '../shared/AdminPreview';
import { MockGantryCard } from '../shared/MockGantryCard';
import s from '../shared/SupportControls.module.scss';

/** Option 8 — Binary support + optional note (uses existing API note field). */
export function Option8NoteOnly() {
  const [supported, setSupported] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState('');
  const [count, setCount] = useState(mockGantryItem.upvoteCount);

  const toggle = () => {
    if (supported) {
      setSupported(false);
      setNote('');
      setNoteOpen(false);
      setCount((c) => c - 1);
      return;
    }
    setSupported(true);
    setCount((c) => c + 1);
    setNoteOpen(true);
  };

  return (
    <MockGantryCard
      item={{ ...mockGantryItem, upvoteCount: count }}
      supportControl={
        <div>
          <button
            type="button"
            className={clsx(s.upvote, supported && s.upvoteActive)}
            aria-pressed={supported}
            onClick={toggle}
          >
            <LikeThumbsIcon filled={supported} />
            <span>{count}</span>
          </button>
          {supported && (
            <>
              {!noteOpen ? (
                <button type="button" className={s.refineButton} onClick={() => setNoteOpen(true)}>
                  Add why you need this
                </button>
              ) : (
                <textarea
                  className={s.textarea}
                  placeholder="Why does this matter for your work? (optional)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  style={{ marginTop: 6, width: 200, minHeight: 48, fontSize: 12 }}
                />
              )}
            </>
          )}
        </div>
      }
      adminPreview={
        <AdminPreview
          item={{ ...mockGantryItem, upvoteCount: count }}
          viewerNote={note || null}
          extra={note ? undefined : 'No structured priority — qualitative only'}
        />
      }
    />
  );
}

'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/common/Button/Button';
import { FEEDBACK_CAPTURE_IGNORE_ATTR } from '../screenshot-feedback/capturePage';

import s from './CommentMode.module.scss';

type Props = {
  /** What the tap picked, in the words its row in the list will use; null before a tap. */
  selectedLabel: string | null;
  onCancel: () => void;
  onCommentHere: () => void;
  onDone: () => void;
};

/**
 * Phone (LAB-2796, prototype ai-apps-feedback-drawer): the bar that stands where
 * the drawer was while a spot on the app is picked — one line of instruction and
 * its way out, or, once something is tapped, what was picked and "Comment here".
 * A tap is a guess at a small target, so it selects; this bar commits.
 */
export function PlacingBar({ selectedLabel, onCancel, onCommentHere, onDone }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  /* The drawer it replaces held focus; a hidden panel can't keep it. */
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);

  return createPortal(
    <div
      ref={ref}
      className={s.bar}
      role="region"
      aria-label="Add a comment"
      tabIndex={-1}
      // Our own chrome stays out of the app's screenshots.
      {...{ [FEEDBACK_CAPTURE_IGNORE_ATTR]: '' }}
    >
      {selectedLabel ? (
        <>
          <p className={s.barText}>
            <span className={s.barLabel}>{selectedLabel}</span>
            Tap again to pick something else.
          </p>
          <div className={s.barActions}>
            <Button style="border" variant="neutral" size="s" onClick={onCancel}>
              Cancel
            </Button>
            <Button size="s" onClick={onCommentHere}>
              Comment here
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className={s.barText}>Tap the part of the app your comment is about.</p>
          <div className={s.barActions}>
            <Button style="border" variant="neutral" size="s" onClick={onDone}>
              Done
            </Button>
          </div>
        </>
      )}
    </div>,
    document.body,
  );
}

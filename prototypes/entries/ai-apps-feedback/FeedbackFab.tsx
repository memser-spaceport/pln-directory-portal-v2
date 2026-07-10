'use client';

import { useEffect, useRef, useState } from 'react';

import { CommentIcon } from '@/components/icons';
import type { AiApp } from '@/services/ai-apps/ai-apps.service';

import { FeedbackForm } from './FeedbackForm';
import s from './feedback.module.scss';

interface Props {
  apps: AiApp[];
  /** Pre-select an app (detail page opens with its own app selected). */
  initialAppUid?: string | null;
  currentUserName: string;
  onSubmit: (appUid: string, text: string) => void;
}

/**
 * Floating "Give feedback" button pinned to the bottom-right corner. Opens the
 * shared feedback form as a popover above the button (no modal).
 */
export function FeedbackFab({ apps, initialAppUid, currentUserName, onSubmit }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Popover, not modal: dismiss on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className={s.fabWrap} ref={wrapRef}>
      {open && (
        <div className={s.popover} role="dialog" aria-label="Give feedback">
          <FeedbackForm
            apps={apps}
            initialAppUid={initialAppUid}
            currentUserName={currentUserName}
            onSubmit={onSubmit}
            onClose={() => setOpen(false)}
          />
        </div>
      )}

      <button
        type="button"
        className={`${s.fab} ${open ? s.fabActive : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <CommentIcon width={18} height={18} />
        Give feedback
      </button>
    </div>
  );
}

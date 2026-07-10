'use client';

import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/common/Button/Button';
import { CommentIcon } from '@/components/icons';
import type { AiApp } from '@/services/ai-apps/ai-apps.service';

import { FeedbackForm } from './FeedbackForm';
import s from './feedback.module.scss';

interface Props {
  apps: AiApp[];
  currentUserName: string;
  onSubmit: (appUid: string, text: string) => void;
}

/**
 * Header placement of "Give feedback" (alternative to the floating FAB): a
 * button that drops the same form as a popover anchored below it.
 */
export function FeedbackHeaderButton({ apps, currentUserName, onSubmit }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

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
    <div className={s.headerFeedbackWrap} ref={wrapRef}>
      <Button size="s" className={s.iconLabelButton} onClick={() => setOpen((o) => !o)}>
        <CommentIcon width={16} height={16} />
        Give feedback
      </Button>

      {open && (
        <div className={`${s.popover} ${s.headerPopover}`} role="dialog" aria-label="Give feedback">
          <FeedbackForm
            apps={apps}
            initialAppUid={null}
            currentUserName={currentUserName}
            onSubmit={onSubmit}
            onClose={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  );
}

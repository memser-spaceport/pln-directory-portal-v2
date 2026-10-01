'use client';

import { clsx } from 'clsx';
import { useEffect, useRef } from 'react';
import { CloseIcon } from '@/components/icons';
// The feedback dialog's card (radius, shadow), as the prototype's card uses it.
import fd from '@/components/page/ai-apps/components/GiveAiAppFeedbackDialog/GiveAiAppFeedbackDialog.module.scss';
import { FeedbackTabs } from '../FeedbackTabs/FeedbackTabs';
import type { OverlayStatus } from './useFeedbackOverlay';

import s from './CommentMode.module.scss';

type Props = {
  commentCount: number;
  /** The Feedback tab: comment mode ends and the written form opens in its place. */
  onFeedbackTab: () => void;
  onClose: () => void;
  status: OverlayStatus;
  /** Where the card sits on screen, so threads beside a pin can keep clear of it. */
  onBoundsChange?: (bounds: { top: number; left: number } | null) => void;
};

/**
 * The Comment tab of the feedback button's panel (prototype ai-apps-comments):
 * open for as long as comment mode is, above the button. It says how to leave a
 * comment — a click anywhere in the app — and who sees it. The comments
 * themselves are listed in the panel on the right.
 */
export function CommentCard({ commentCount, onFeedbackTab, onClose, status, onBoundsChange }: Props) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !onBoundsChange) return;
    const report = () => {
      const r = el.getBoundingClientRect();
      onBoundsChange({ top: r.top, left: r.left });
    };
    report();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(report) : null;
    observer?.observe(el);
    window.addEventListener('resize', report);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', report);
      onBoundsChange(null);
    };
  }, [onBoundsChange]);

  return (
    <section ref={ref} className={clsx(fd.root, s.dock)} aria-label="Comments on this app">
      <div className={s.top}>
        <FeedbackTabs
          active="comment"
          commentCount={commentCount}
          onSelect={(tab) => tab === 'feedback' && onFeedbackTab()}
        />
        <button type="button" className={s.iconButton} onClick={onClose} aria-label="Close comments">
          <CloseIcon width={14} height={14} />
        </button>
      </div>
      <div className={s.hintBlock}>
        <p className={s.hintLead}>
          {status === 'unsupported'
            ? 'Click anywhere on the app to leave a comment. This app can’t show where earlier comments point; open them from the list.'
            : 'Click anywhere on the app to leave a comment.'}
        </p>
        <p className={s.audience}>Only the app’s author and admins see it.</p>
      </div>
    </section>
  );
}

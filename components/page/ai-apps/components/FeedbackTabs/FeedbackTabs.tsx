'use client';

import { clsx } from 'clsx';
import { CommentIcon } from '@/components/icons';

import s from './FeedbackTabs.module.scss';

export type FeedbackTab = 'comment' | 'feedback';

type Props = {
  active: FeedbackTab;
  /** Comments on the app, shown beside the Comment tab. */
  commentCount: number;
  onSelect: (tab: FeedbackTab) => void;
};

/**
 * The two doors of the feedback button on an app's page (prototype
 * ai-apps-comments): Feedback — the written form about the app, the primary
 * door — and Comment — point at something in the app. Heads both the comment card and
 * the feedback dialog, so switching between them reads as one panel.
 */
export function FeedbackTabs({ active, commentCount, onSelect }: Props) {
  return (
    <div className={s.root} role="tablist" aria-label="Feedback on this app">
      {/* Feedback first: it's the primary door (prototype ai-apps-comments). */}
      <button
        type="button"
        role="tab"
        aria-selected={active === 'feedback'}
        className={clsx(s.tab, active === 'feedback' && s.active)}
        onClick={() => onSelect('feedback')}
      >
        Feedback
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={active === 'comment'}
        className={clsx(s.tab, active === 'comment' && s.active)}
        onClick={() => onSelect('comment')}
      >
        <CommentIcon />
        Comment
        {commentCount > 0 && <span className={s.count}>{commentCount}</span>}
      </button>
    </div>
  );
}

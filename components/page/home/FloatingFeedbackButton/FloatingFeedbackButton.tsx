'use client';

import { useContactSupportStore } from '@/services/contact-support/store';
import { useHomeAnalytics } from '@/analytics/home.analytics';
import { CommentIcon } from '@/components/icons';

import s from './FloatingFeedbackButton.module.scss';

export function FloatingFeedbackButton() {
  const { openModal } = useContactSupportStore((store) => store.actions);
  const { onFeedbackButtonClicked } = useHomeAnalytics();

  return (
    <button
      type="button"
      className={s.floatingButton}
      onClick={() => {
        onFeedbackButtonClicked();
        openModal(undefined, 'giveFeedback');
      }}
    >
      <CommentIcon />
      Give feedback
    </button>
  );
}

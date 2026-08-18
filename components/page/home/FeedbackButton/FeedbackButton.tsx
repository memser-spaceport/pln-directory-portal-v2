'use client';

import { CommentIcon } from '@/components/icons';
import { useContactSupportStore } from '@/services/contact-support/store';
import { useHomeAnalytics } from '@/analytics/home.analytics';

import s from './FeedbackButton.module.scss';

/**
 * Floating "Give feedback" button shown on the home page. Reuses the
 * global Contact Support modal (mounted in app/layout.tsx) preselected
 * to the "Give feedback" topic, so no dedicated dialog/state is needed here.
 */
export function FeedbackButton() {
  const { openModal } = useContactSupportStore((store) => store.actions);
  const { onFeedbackButtonClicked } = useHomeAnalytics();

  const handleClick = () => {
    onFeedbackButtonClicked();
    openModal(undefined, 'giveFeedback');
  };

  return (
    <button type="button" className={s.floatingButton} onClick={handleClick}>
      <CommentIcon />
      Give feedback
    </button>
  );
}

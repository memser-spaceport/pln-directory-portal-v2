'use client';

import { useTeamNewsAnalytics } from '@/analytics/team-news.analytics';
import { useContactSupportStore } from '@/services/contact-support/store';
import { CommentIcon } from '@/components/icons';

import s from './NewsFeedbackButton.module.scss';

/**
 * Floating "Give feedback" entry point for the news feed (/home). Reuses the
 * shared ContactSupport dialog (same one the navbar's help icon opens) rather
 * than introducing a new feedback surface — pre-selects the "Give feedback"
 * topic so members land straight on the right form.
 */
export function NewsFeedbackButton() {
  const analytics = useTeamNewsAnalytics();
  const { openModal } = useContactSupportStore((state) => state.actions);

  return (
    <button
      type="button"
      className={s.floatingButton}
      onClick={() => {
        analytics.onFeedbackButtonClicked('home');
        openModal({ source: 'news-feed' }, 'giveFeedback');
      }}
    >
      <CommentIcon />
      Give feedback
    </button>
  );
}

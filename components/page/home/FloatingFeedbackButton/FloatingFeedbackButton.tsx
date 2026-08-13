'use client';

import { useContactSupportStore } from '@/services/contact-support/store';
import { useCurrentUserStore } from '@/services/auth/store';
import { useHomeAnalytics } from '@/analytics/home.analytics';
import { getAnalyticsUserInfo } from '@/utils/common.utils';
import { CommentIcon } from '@/components/icons';

import s from './FloatingFeedbackButton.module.scss';

export function FloatingFeedbackButton() {
  const { currentUser } = useCurrentUserStore();
  const { openModal } = useContactSupportStore((s) => s.actions);
  const analytics = useHomeAnalytics();

  return (
    <button
      type="button"
      className={s.floatingButton}
      onClick={() => {
        analytics.onFloatingFeedbackButtonClicked(getAnalyticsUserInfo(currentUser));
        openModal(undefined, 'giveFeedback');
      }}
    >
      <CommentIcon />
      Give feedback
    </button>
  );
}

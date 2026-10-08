'use client';

import Link from 'next/link';
import { useAiAppsAnalytics } from '@/analytics/ai-apps.analytics';
import { useAiAppFeedbackReviewAccess } from '@/services/ai-app-feedback/hooks/useAiAppFeedbackReviewAccess';
import { useAiAppFeedbackList } from '@/services/ai-app-feedback/hooks/useAiAppFeedbackList';
import { FEEDBACK_PAGE_HREF } from '@/components/page/ai-apps/AiAppFeedbackPage/FeedbackPage';

import s from './ViewFeedbackEntryPoint.module.scss';

/**
 * The one door to the Feedback page from the AI Apps masthead (LAB-2767,
 * prototype ai-apps-feedback-drawer). It replaces "Your feedback" and "View
 * feedback": what the viewer received and what they gave are now tabs of one
 * page.
 *
 * Directory admins and app creators land on Received, and the badge counts
 * the items there still marked New: the number that asks for action, where a
 * total would only grow. Everyone else lands on Given, with no badge.
 */
export function ViewFeedbackEntryPoint() {
  const analytics = useAiAppsAnalytics();
  const { canReview, isLoading: isAccessLoading } = useAiAppFeedbackReviewAccess();
  const { feedback, isLoading: isFeedbackLoading } = useAiAppFeedbackList();

  const isReviewer = !isAccessLoading && canReview;
  const newCount = isReviewer && !isFeedbackLoading ? feedback.filter((row) => row.status === 'NEW').length : 0;

  return (
    <Link
      href={FEEDBACK_PAGE_HREF[isReviewer ? 'received' : 'mine']}
      className={s.link}
      onClick={() => {
        if (isReviewer) analytics.onViewFeedbackClicked({ feedbackCount: feedback.length });
      }}
    >
      Feedback
      {newCount > 0 && (
        <span className={s.badge} aria-label={`${newCount} new`}>
          {newCount > 99 ? '99+' : newCount}
        </span>
      )}
    </Link>
  );
}

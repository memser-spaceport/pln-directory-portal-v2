'use client';

import Link from 'next/link';
import { useAiAppsAnalytics } from '@/analytics/ai-apps.analytics';
import { useAiAppFeedbackReviewAccess } from '@/services/ai-app-feedback/hooks/useAiAppFeedbackReviewAccess';
import { useAiAppFeedbackList } from '@/services/ai-app-feedback/hooks/useAiAppFeedbackList';
import { useMyAiAppFeedbackList } from '@/services/ai-app-feedback/hooks/useMyAiAppFeedbackList';

import s from './ViewFeedbackEntryPoint.module.scss';

/**
 * "Your feedback" is for everyone. "View feedback" is visible only to Directory
 * admins or members who created at least one AI App, and only when there is at
 * least one reviewable feedback item.
 * Each badge shows the total count on that list, not an "unread" count -
 * there's no backend read-state/unread-tracking endpoint to back that (see
 * docs/plans/2026-07-08-feat-ai-apps-feedback-ui-plan.md, Dependencies & Risks).
 */
export function ViewFeedbackEntryPoint() {
  const analytics = useAiAppsAnalytics();
  const { canReview, isLoading: isAccessLoading } = useAiAppFeedbackReviewAccess();
  const { feedback, isLoading: isFeedbackLoading } = useAiAppFeedbackList();
  const { feedback: myFeedback, isLoading: isMyFeedbackLoading } = useMyAiAppFeedbackList();

  return (
    <>
      <Link href="/pl-infra/ai-apps/feedback/mine" className={s.link}>
        Your feedback
        {!isMyFeedbackLoading && myFeedback.length > 0 && (
          <span className={s.badge}>{myFeedback.length > 99 ? '99+' : myFeedback.length}</span>
        )}
      </Link>
      {!isAccessLoading && !isFeedbackLoading && canReview && feedback.length > 0 && (
        <Link
          href="/pl-infra/ai-apps/feedback"
          className={s.link}
          onClick={() => analytics.onViewFeedbackClicked({ feedbackCount: feedback.length })}
        >
          View feedback
          <span className={s.badge}>{feedback.length > 99 ? '99+' : feedback.length}</span>
        </Link>
      )}
    </>
  );
}

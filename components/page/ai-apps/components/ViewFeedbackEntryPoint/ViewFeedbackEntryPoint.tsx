'use client';

import Link from 'next/link';
import { useAiAppFeedbackReviewAccess } from '@/services/ai-app-feedback/hooks/useAiAppFeedbackReviewAccess';
import { useAiAppFeedbackList } from '@/services/ai-app-feedback/hooks/useAiAppFeedbackList';

import s from './ViewFeedbackEntryPoint.module.scss';

/**
 * Visible only to Directory admins or members who created at least one AI App.
 * The badge shows the total count of reviewable feedback, not an "unread" count -
 * there's no backend read-state/unread-tracking endpoint to back that (see
 * docs/plans/2026-07-08-feat-ai-apps-feedback-ui-plan.md, Dependencies & Risks).
 */
export function ViewFeedbackEntryPoint() {
  const { canReview, isLoading } = useAiAppFeedbackReviewAccess();
  const { feedback } = useAiAppFeedbackList();

  if (isLoading || !canReview) {
    return null;
  }

  return (
    <Link href="/pl-infra/ai-apps/feedback" className={s.link}>
      View feedback
      {feedback.length > 0 && <span className={s.badge}>{feedback.length > 99 ? '99+' : feedback.length}</span>}
    </Link>
  );
}

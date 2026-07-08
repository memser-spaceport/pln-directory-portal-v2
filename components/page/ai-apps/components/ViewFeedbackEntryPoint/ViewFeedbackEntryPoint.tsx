'use client';

import Link from 'next/link';
import { useAiAppFeedbackReviewAccess } from '@/services/ai-app-feedback/hooks/useAiAppFeedbackReviewAccess';

import s from './ViewFeedbackEntryPoint.module.scss';

/**
 * Visible only to Directory admins or members who created at least one AI App.
 * No "new" count badge for v1 - see docs/plans/2026-07-08-feat-ai-apps-feedback-ui-plan.md
 * (Dependencies & Risks: the badge needs a confirmed backend unread-tracking capability).
 */
export function ViewFeedbackEntryPoint() {
  const { canReview, isLoading } = useAiAppFeedbackReviewAccess();

  if (isLoading || !canReview) {
    return null;
  }

  return (
    <Link href="/pl-infra/ai-apps/feedback" className={s.link}>
      View feedback
    </Link>
  );
}

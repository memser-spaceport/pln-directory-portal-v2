'use client';

import Link from 'next/link';

// Production stylesheet, verbatim.
import s from '@/components/page/ai-apps/components/ViewFeedbackEntryPoint/ViewFeedbackEntryPoint.module.scss';

import { feedbackHref } from './FeedbackPage';

interface Props {
  /** Items on the viewer's apps still marked New: the part that asks for something. */
  newReceivedCount: number;
  /** Stand-in for production's `canReview` (Directory admin or creator of an app). */
  canReview: boolean;
}

/**
 * Production `ViewFeedbackEntryPoint` (develop, 5 Oct) has two buttons, "Your
 * feedback" and "View feedback", each leading to its own page. Here the
 * feedback you received and the feedback you gave are tabs on one page, so the
 * masthead has one door to it, in production's button style.
 *
 * Creators land on Received and the badge counts what is still New there.
 * That is the number that asks for action, where a total would only grow.
 * Everyone else lands on Given, with no badge.
 */
export function ViewFeedbackLink({ newReceivedCount, canReview }: Props) {
  return (
    <Link href={feedbackHref(canReview ? 'received' : 'mine')} className={s.link}>
      Feedback
      {canReview && newReceivedCount > 0 && (
        <span className={s.badge}>{newReceivedCount > 99 ? '99+' : newReceivedCount}</span>
      )}
    </Link>
  );
}

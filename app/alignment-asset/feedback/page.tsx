import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import FeedbackPage from '@/components/page/aligement-assets/feedback/feedback-page';
import { isFeedbackBoardEnabled } from '@/components/page/aligement-assets/feedback/feedback.utils';

export const metadata: Metadata = {
  title: 'Feedback | PL Alignment Asset',
  description: 'Suggest features, report bugs, and follow what the PLAA team is building.',
};

/**
 * AC-T8.1: with the flag off the page is not reachable at all, so a stray link
 * during rollout 404s rather than showing a half-wired board.
 */
export default function Page() {
  if (!isFeedbackBoardEnabled()) {
    notFound();
  }
  return (
    // useSearchParams needs a Suspense boundary in the App Router.
    <Suspense fallback={null}>
      <FeedbackPage />
    </Suspense>
  );
}
